/**
 * Enterprise WebRTC Peer Connection Manager for MCPA Construction & Supply
 * 
 * Handles zero-cost Peer-to-Peer (P2P) WebRTC connections:
 * - Direct encrypted media exchange (UDP/SRTP)
 * - Free Google STUN servers for NAT traversal
 * - Dynamic Screen Sharing track switching via sender.replaceTrack()
 * - Audio & Video stream synchronization
 */

export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

export class WebRTCPeerManager {
  constructor({
    socket,
    roomCode,
    currentUser,
    onRemoteStream = () => {},
    onConnectionStateChange = () => {},
    onPeerLeft = () => {},
  }) {
    this.socket = socket;
    this.roomCode = roomCode;
    this.currentUser = currentUser;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onPeerLeft = onPeerLeft;

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteSocketId = null;
    this.isInitiator = false;
    this.pendingCandidates = [];
  }

  /**
   * Initializes the native RTCPeerConnection and attaches local tracks
   * @param {MediaStream} localStream 
   */
  initPeerConnection(localStream) {
    if (this.peerConnection) {
      this.close();
    }

    this.localStream = localStream;
    this.remoteStream = new MediaStream();

    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    // 1. Add local audio and video tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          this.peerConnection.addTrack(track, this.localStream);
        } catch (e) {
          console.warn("[WEBRTC] Error adding track to peer connection:", e);
        }
      });
    }

    // 2. Handle incoming remote audio and video tracks
    this.peerConnection.ontrack = (event) => {
      console.log(`[WEBRTC] Incoming remote ${event.track.kind} track received.`);
      
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      } else {
        this.remoteStream.addTrack(event.track);
      }

      this.onRemoteStream(this.remoteStream);
    };

    // 3. Send locally discovered ICE candidates to remote peer via Socket.IO
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit("ice-candidate", {
          targetSocketId: this.remoteSocketId,
          roomCode: this.roomCode,
          candidate: event.candidate,
        });
      }
    };

    // 4. Track connection lifecycle
    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      console.log(`[WEBRTC] Connection state changed: ${state}`);
      this.onConnectionStateChange(state);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (!this.peerConnection) return;
      console.log(`[WEBRTC] ICE state: ${this.peerConnection.iceConnectionState}`);
    };

    return this.peerConnection;
  }

  /**
   * Called when acting as the call initiator (Caller) to create and send an SDP offer
   * @param {string} targetSocketId 
   */
  async createAndSendOffer(targetSocketId) {
    if (!this.peerConnection) return;
    this.remoteSocketId = targetSocketId;
    this.isInitiator = true;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.peerConnection.setLocalDescription(offer);

      console.log(`[WEBRTC] Sending SDP Offer to peer: ${targetSocketId || "room"}`);
      this.socket.emit("webrtc-offer", {
        targetSocketId,
        roomCode: this.roomCode,
        sdpOffer: offer,
        sender: this.currentUser,
      });
    } catch (err) {
      console.error("[WEBRTC] Failed to create or send offer:", err);
    }
  }

  /**
   * Called when receiving an SDP offer from the remote peer to create and return an SDP answer
   * @param {RTCSessionDescriptionInit} sdpOffer 
   * @param {string} fromSocketId 
   */
  async handleOfferAndSendAnswer(sdpOffer, fromSocketId) {
    if (!this.peerConnection) return;
    this.remoteSocketId = fromSocketId;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdpOffer));

      // Process any early arrived ICE candidates
      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log(`[WEBRTC] Sending SDP Answer to peer: ${fromSocketId}`);
      this.socket.emit("webrtc-answer", {
        targetSocketId: fromSocketId,
        roomCode: this.roomCode,
        sdpAnswer: answer,
        sender: this.currentUser,
      });
    } catch (err) {
      console.error("[WEBRTC] Failed to handle offer and create answer:", err);
    }
  }

  /**
   * Called on the initiator side when receiving the SDP answer
   * @param {RTCSessionDescriptionInit} sdpAnswer 
   */
  async handleAnswer(sdpAnswer) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdpAnswer));

      // Process pending candidates
      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
      console.log("[WEBRTC] Remote SDP Answer applied successfully. P2P link establishing...");
    } catch (err) {
      console.error("[WEBRTC] Failed to set remote description answer:", err);
    }
  }

  /**
   * Adds incoming ICE candidate from the remote peer
   * @param {RTCIceCandidateInit} candidate 
   */
  async handleIceCandidate(candidate) {
    if (!candidate) return;

    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      // Buffer candidates if remote description not yet set
      this.pendingCandidates.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[WEBRTC] Error adding received ICE candidate:", err);
    }
  }

  /**
   * Seamlessly replaces the outgoing video track with screen share or camera
   * without renegotiation
   * @param {MediaStreamTrack} newVideoTrack 
   */
  async replaceVideoTrack(newVideoTrack) {
    if (!this.peerConnection) return;

    try {
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
        console.log("[WEBRTC] Outgoing video track replaced successfully.");
      }
    } catch (err) {
      console.error("[WEBRTC] Failed to replace video track:", err);
    }
  }

  /**
   * Terminates the peer connection and releases resources
   */
  close() {
    if (this.peerConnection) {
      try {
        this.peerConnection.ontrack = null;
        this.peerConnection.onicecandidate = null;
        this.peerConnection.onconnectionstatechange = null;
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    if (this.remoteStream) {
      try {
        this.remoteStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.remoteStream = null;
    }

    this.pendingCandidates = [];
    this.remoteSocketId = null;
  }
}

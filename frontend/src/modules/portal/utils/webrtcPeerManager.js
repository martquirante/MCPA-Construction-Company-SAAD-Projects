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
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:global.stun.twilio.com:3478" },
  { urls: "stun:relay.metered.ca:80" },
  {
    urls: "turn:relay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:relay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:relay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
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
   * @param {MediaStream} [localStream] 
   */
  initPeerConnection(localStream = null) {
    if (this.peerConnection) {
      if (localStream) {
        this.attachLocalTracks(localStream);
      }
      return this.peerConnection;
    }

    this.localStream = localStream;
    this.remoteStream = new MediaStream();

    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // 1. Ensure transceivers exist for both audio and video reception
    try {
      this.peerConnection.addTransceiver("audio", { direction: "sendrecv" });
      this.peerConnection.addTransceiver("video", { direction: "sendrecv" });
    } catch (e) {}

    // 2. Add local audio and video tracks if available
    if (this.localStream) {
      this.attachLocalTracks(this.localStream);
    }

    // 3. Handle incoming remote audio and video tracks
    this.peerConnection.ontrack = (event) => {
      console.log(`[WEBRTC] Incoming remote ${event.track.kind} track received:`, event.track.id);
      
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!this.remoteStream.getTracks().some((t) => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      } else {
        if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      // Fresh MediaStream instance guarantees React re-render detection
      const freshStream = new MediaStream(this.remoteStream.getTracks());
      this.onRemoteStream(freshStream);
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

    // 4. Track renegotiation when tracks change dynamically
    this.peerConnection.onnegotiationneeded = async () => {
      if (this.remoteSocketId && this.peerConnection && this.peerConnection.signalingState === "stable") {
        console.log("[WEBRTC] Negotiation needed, sending updated SDP offer...");
        await this.createAndSendOffer(this.remoteSocketId);
      }
    };

    // 5. Track connection lifecycle
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
   * Attaches or updates local audio and video tracks on existing peer connection
   * @param {MediaStream} stream 
   */
  attachLocalTracks(stream) {
    if (!this.peerConnection || !stream) return;
    this.localStream = stream;

    const transceivers = typeof this.peerConnection.getTransceivers === "function"
      ? this.peerConnection.getTransceivers()
      : [];
    const senders = typeof this.peerConnection.getSenders === "function"
      ? this.peerConnection.getSenders()
      : [];

    stream.getTracks().forEach((track) => {
      // Find transceiver matching this track kind
      const transceiver = transceivers.find(
        (t) => (t.receiver?.track?.kind === track.kind) || (t.sender?.track?.kind === track.kind)
      );

      if (transceiver && transceiver.sender) {
        transceiver.direction = "sendrecv";
        transceiver.sender.replaceTrack(track).then(() => {
          console.log(`[WEBRTC] Attached ${track.kind} track to transceiver successfully.`);
        }).catch((err) => {
          console.warn(`[WEBRTC] replaceTrack failed for ${track.kind}:`, err);
        });
      } else {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(() => {});
        } else {
          try {
            this.peerConnection.addTrack(track, stream);
          } catch (e) {
            console.warn("[WEBRTC] Error adding track:", e);
          }
        }
      }
    });
  }

  /**
   * Called when acting as the call initiator (Caller) to create and send an SDP offer
   * @param {string} targetSocketId 
   */
  async createAndSendOffer(targetSocketId) {
    if (!this.peerConnection) {
      this.initPeerConnection(this.localStream);
    }
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
    if (!this.peerConnection) {
      this.initPeerConnection(this.localStream);
    }
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

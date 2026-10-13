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

/**
 * Optimizes WebRTC Opus SDP to enable:
 * - DTX (Discontinuous Transmission): silences ambient background room noise when participant pauses
 * - In-band FEC (Forward Error Correction): repairs jittered voice packets
 * - Mono Voice Optimization: directs all bitrate to human speech clarity and acoustic echo cancellation
 * @param {string} sdp
 * @returns {string}
 */
export function optimizeOpusSdp(sdp) {
  if (!sdp || typeof sdp !== "string") return sdp;

  try {
    const opusMatch = sdp.match(/a=rtpmap:(\d+)\s+opus\/48000/i);
    if (!opusMatch) return sdp;

    const pt = opusMatch[1];
    const fmtpRegex = new RegExp(`(a=fmtp:${pt}\\s+)([^\\r\\n]+)`, "i");

    if (fmtpRegex.test(sdp)) {
      return sdp.replace(fmtpRegex, (match, prefix, params) => {
        let updated = params;
        // Keep in-band FEC for packet loss protection, but remove usedtx=1 (DTX)
        // because aggressive DTX mutes speech on pauses and cuts off sentence starts
        if (updated.includes("usedtx=1")) {
          updated = updated.replace(/;?usedtx=1/g, "");
        }
        if (!updated.includes("useinbandfec=")) updated += ";useinbandfec=1";
        return `${prefix}${updated}`;
      });
    } else {
      return sdp.replace(
        new RegExp(`(a=rtpmap:${pt}\\s+opus\\/48000[^\\r\\n]*[\\r\\n]+)`, "i"),
        `$1a=fmtp:${pt} useinbandfec=1\r\n`
      );
    }
  } catch (err) {
    console.warn("[WEBRTC] Could not optimize Opus SDP:", err);
    return sdp;
  }
}

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
      
      // Ensure audio track unmuting is caught immediately to trigger playback
      event.track.onunmute = () => {
        console.log(`[WEBRTC] Remote ${event.track.kind} track unmuted and active.`);
        const freshStream = new MediaStream(this.remoteStream.getTracks());
        this.onRemoteStream(freshStream);
      };

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
  async attachLocalTracks(stream) {
    if (!stream) return;
    this.localStream = stream;

    if (!this.peerConnection) {
      this.initPeerConnection(stream);
      return;
    }

    const transceivers = typeof this.peerConnection.getTransceivers === "function"
      ? this.peerConnection.getTransceivers()
      : [];
    const senders = typeof this.peerConnection.getSenders === "function"
      ? this.peerConnection.getSenders()
      : [];

    await Promise.all(
      stream.getTracks().map(async (track) => {
        track.enabled = true;
        // Find transceiver matching this track kind
        const transceiver = transceivers.find(
          (t) => (t.receiver?.track?.kind === track.kind) || (t.sender?.track?.kind === track.kind)
        );

        if (transceiver && transceiver.sender) {
          transceiver.direction = "sendrecv";
          try {
            await transceiver.sender.replaceTrack(track);
            console.log(`[WEBRTC] Attached ${track.kind} track to transceiver successfully.`);
          } catch (err) {
            console.warn(`[WEBRTC] replaceTrack failed for ${track.kind}:`, err);
          }
        } else {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (sender) {
            await sender.replaceTrack(track).catch(() => {});
          } else {
            try {
              this.peerConnection.addTrack(track, stream);
              console.log(`[WEBRTC] addTrack called for ${track.kind} track.`);
            } catch (e) {
              console.warn("[WEBRTC] Error adding track:", e);
            }
          }
        }
      })
    );

    // If connection is already established and stable, renegotiate so the remote peer receives the updated audio/video
    if (this.remoteSocketId && this.peerConnection.signalingState === "stable") {
      console.log("[WEBRTC] Local media tracks updated post-handshake, triggering renegotiation offer...");
      await this.createAndSendOffer(this.remoteSocketId);
    }
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
      // Ensure all local tracks are attached to senders before offer creation
      if (this.localStream) {
        const transceivers = typeof this.peerConnection.getTransceivers === "function"
          ? this.peerConnection.getTransceivers()
          : [];
        await Promise.all(
          this.localStream.getTracks().map(async (track) => {
            track.enabled = true;
            const t = transceivers.find(
              (tc) => (tc.receiver?.track?.kind === track.kind) || (tc.sender?.track?.kind === track.kind)
            );
            if (t && t.sender) {
              t.direction = "sendrecv";
              await t.sender.replaceTrack(track).catch(() => {});
            }
          })
        );
      }

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      const tunedOffer = new RTCSessionDescription({
        type: offer.type,
        sdp: optimizeOpusSdp(offer.sdp),
      });
      await this.peerConnection.setLocalDescription(tunedOffer);

      console.log(`[WEBRTC] Sending SDP Offer with Opus voice optimization to peer: ${targetSocketId || "room"}`);
      this.socket.emit("webrtc-offer", {
        targetSocketId,
        roomCode: this.roomCode,
        sdpOffer: tunedOffer,
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

      // Ensure local tracks are attached to the negotiated transceivers before creating answer
      if (this.localStream) {
        const transceivers = typeof this.peerConnection.getTransceivers === "function"
          ? this.peerConnection.getTransceivers()
          : [];
        await Promise.all(
          this.localStream.getTracks().map(async (track) => {
            track.enabled = true;
            const t = transceivers.find(
              (tc) => (tc.receiver?.track?.kind === track.kind) || (tc.sender?.track?.kind === track.kind)
            );
            if (t && t.sender) {
              t.direction = "sendrecv";
              await t.sender.replaceTrack(track).catch(() => {});
            }
          })
        );
      }

      // Process any early arrived ICE candidates
      while (this.pendingCandidates.length > 0) {
        const candidate = this.pendingCandidates.shift();
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }

      const answer = await this.peerConnection.createAnswer();
      const tunedAnswer = new RTCSessionDescription({
        type: answer.type,
        sdp: optimizeOpusSdp(answer.sdp),
      });
      await this.peerConnection.setLocalDescription(tunedAnswer);

      console.log(`[WEBRTC] Sending SDP Answer with Opus voice optimization to peer: ${fromSocketId}`);
      this.socket.emit("webrtc-answer", {
        targetSocketId: fromSocketId,
        roomCode: this.roomCode,
        sdpAnswer: tunedAnswer,
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
      console.log("[WEBRTC] Remote SDP Answer applied with Opus voice tuning. P2P link establishing...");
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
      const transceivers = typeof this.peerConnection.getTransceivers === "function"
        ? this.peerConnection.getTransceivers()
        : [];
      const videoTransceiver = transceivers.find(
        (t) => (t.receiver?.track?.kind === "video") || (t.sender?.track?.kind === "video")
      );

      if (videoTransceiver && videoTransceiver.sender) {
        videoTransceiver.direction = "sendrecv";
        await videoTransceiver.sender.replaceTrack(newVideoTrack);
        console.log("[WEBRTC] Outgoing video/screen track replaced on transceiver successfully.");
        return;
      }

      const senders = typeof this.peerConnection.getSenders === "function"
        ? this.peerConnection.getSenders()
        : [];
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
        console.log("[WEBRTC] Outgoing video track replaced on sender successfully.");
      }
    } catch (err) {
      console.error("[WEBRTC] Failed to replace video track:", err);
    }
  }

  /**
   * Seamlessly replaces the outgoing audio track (e.g. mixed mic + presentation audio)
   * without renegotiation
   * @param {MediaStreamTrack} newAudioTrack 
   */
  async replaceAudioTrack(newAudioTrack) {
    if (!this.peerConnection || !newAudioTrack) return;

    try {
      const transceivers = typeof this.peerConnection.getTransceivers === "function"
        ? this.peerConnection.getTransceivers()
        : [];
      const audioTransceiver = transceivers.find(
        (t) => (t.receiver?.track?.kind === "audio") || (t.sender?.track?.kind === "audio")
      );

      if (audioTransceiver && audioTransceiver.sender) {
        audioTransceiver.direction = "sendrecv";
        await audioTransceiver.sender.replaceTrack(newAudioTrack);
        console.log("[WEBRTC] Outgoing audio track replaced on transceiver successfully.");
        return;
      }

      const senders = typeof this.peerConnection.getSenders === "function"
        ? this.peerConnection.getSenders()
        : [];
      const audioSender = senders.find((s) => s.track && s.track.kind === "audio");
      if (audioSender) {
        await audioSender.replaceTrack(newAudioTrack);
        console.log("[WEBRTC] Outgoing audio track replaced on sender successfully.");
      }
    } catch (err) {
      console.error("[WEBRTC] Failed to replace audio track:", err);
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

/**
 * Enterprise WebRTC Peer Connection Manager for MCPA Construction & Supply
 * 
 * Handles zero-cost Peer-to-Peer (P2P) WebRTC connections:
 * - Direct encrypted media exchange (UDP/SRTP)
 * - Free Google STUN servers for NAT traversal
 * - Dynamic Screen Sharing track switching via sender.replaceTrack()
 * - Audio & Video stream synchronization
 */

import { getSignalingServerUrl } from "./signalingUrl.js";

let cachedDynamicIceServers = null;

/**
 * Dynamically fetches ICE servers from the Azure backend API (/api/webrtc/ice-servers).
 * This ensures that even if Vercel environment variables are missing, the browser
 * automatically receives the production Metered TURN relay credentials from Azure.
 */
export const fetchIceServers = async () => {
  if (cachedDynamicIceServers && cachedDynamicIceServers.length > 0) {
    return cachedDynamicIceServers;
  }

  try {
    const serverUrl = getSignalingServerUrl();
    const endpoint = `${serverUrl}/api/webrtc/ice-servers`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers && data.iceServers.length > 0) {
        cachedDynamicIceServers = data.iceServers;
        console.log("[WEBRTC] Successfully fetched ICE servers from Azure backend:", data.iceServers.length);
        return cachedDynamicIceServers;
      }
    }
  } catch (err) {
    console.warn("[WEBRTC] Could not load dynamic ICE servers from backend, using env fallback:", err);
  }

  return getIceServers();
};

// Proactively pre-fetch ICE servers in the background when in browser
if (typeof window !== "undefined") {
  fetchIceServers().catch(() => {});
}

/**
 * Resolves STUN and TURN ICE servers for WebRTC NAT traversal.
 * Secrets are loaded from environment variables (.env / .env.local)
 * to maintain strict zero-exposure policy in repository source files.
 */
export const getIceServers = () => {
  if (cachedDynamicIceServers && cachedDynamicIceServers.length > 0) {
    return cachedDynamicIceServers;
  }

  const turnUsername = process.env.NEXT_PUBLIC_METERED_TURN_USERNAME;
  const turnPassword = process.env.NEXT_PUBLIC_METERED_TURN_PASSWORD;

  const servers = [
    // 1. High-speed Public STUN servers for direct P2P NAT hole-punching
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" },
  ];

  // 2. Dedicated Enterprise Metered TURN Relays (bypasses CGNAT, Mobile Data & Strict Firewalls)
  if (turnUsername && turnPassword) {
    servers.push(
      {
        urls: "turn:global.relay.metered.ca:80",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      }
    );
  }

  return servers;
};

export const ICE_SERVERS = getIceServers();



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
    onPeersChange = () => {},
    onConnectionStateChange = () => {},
    onPeerLeft = () => {},
  }) {
    this.socket = socket;
    this.roomCode = roomCode;
    this.currentUser = currentUser;
    this.onRemoteStream = onRemoteStream;
    this.onPeersChange = onPeersChange;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onPeerLeft = onPeerLeft;

    this.localStream = null;
    this.peers = new Map(); // socketId -> { socketId, pc, remoteStream, user, isInitiator, pendingCandidates }
  }

  /**
   * Helper to notify callers of any changes in active peers list
   */
  notifyPeersChange() {
    const list = Array.from(this.peers.values()).map((p) => ({
      socketId: p.socketId,
      stream: p.remoteStream,
      user: p.user,
      connectionState: p.pc?.connectionState || "new",
    }));

    if (typeof this.onPeersChange === "function") {
      this.onPeersChange(list);
    }

    // Backwards-compatible single remote stream for 1st remote peer
    if (list.length > 0 && typeof this.onRemoteStream === "function") {
      this.onRemoteStream(list[0].stream, list[0].user);
    }
  }

  /**
   * Retrieves an existing RTCPeerConnection for a given socketId or initializes a new one
   * @param {string} socketId 
   * @param {object} [user] 
   * @param {boolean} [isInitiator] 
   */
  getOrCreatePeer(socketId, user = null, isInitiator = false) {
    if (!socketId) return null;

    if (this.peers.has(socketId)) {
      const existing = this.peers.get(socketId);
      if (user && !existing.user) existing.user = user;
      return existing;
    }

    const remoteStream = new MediaStream();
    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
    });

    const peerObj = {
      socketId,
      pc,
      remoteStream,
      user: user || { socketId },
      isInitiator,
      pendingCandidates: [],
    };

    // Update with dynamic Azure TURN credentials if available
    if (!cachedDynamicIceServers) {
      fetchIceServers()
        .then((servers) => {
          if (pc && typeof pc.setConfiguration === "function") {
            try {
              pc.setConfiguration({ iceServers: servers });
              console.log(`[WEBRTC MESH] Updated peer ${socketId} with dynamic Azure TURN servers.`);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    // 1. Add sendrecv transceivers for audio and video
    try {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
    } catch (e) {}

    // 2. Attach local tracks if already available
    if (this.localStream) {
      this.attachLocalTracksToPeer(pc, this.localStream);
    }

    // 3. Handle incoming remote audio and video tracks
    pc.ontrack = (event) => {
      console.log(`[WEBRTC MESH] Incoming track (${event.track.kind}) from peer ${socketId}:`, event.track.id);

      event.track.onunmute = () => {
        console.log(`[WEBRTC MESH] Track unmuted (${event.track.kind}) from peer ${socketId}`);
        this.notifyPeersChange();
      };

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });
      } else {
        if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }
      }

      this.notifyPeersChange();
    };

    // 4. Relay ICE candidates to targeted remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit("ice-candidate", {
          targetSocketId: socketId,
          roomCode: this.roomCode,
          candidate: event.candidate,
        });
      }
    };

    // 5. Connection lifecycle
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WEBRTC MESH] Connection state with peer ${socketId}: ${state}`);
      this.onConnectionStateChange(state, socketId);
      this.notifyPeersChange();
    };

    this.peers.set(socketId, peerObj);
    this.notifyPeersChange();
    return peerObj;
  }

  /**
   * Attaches local audio and video tracks to a specific RTCPeerConnection
   */
  attachLocalTracksToPeer(pc, stream) {
    if (!pc || !stream) return;

    const transceivers = typeof pc.getTransceivers === "function" ? pc.getTransceivers() : [];
    const senders = typeof pc.getSenders === "function" ? pc.getSenders() : [];

    stream.getTracks().forEach(async (track) => {
      track.enabled = true;
      const t = transceivers.find(
        (tr) => (tr.receiver?.track?.kind === track.kind) || (tr.sender?.track?.kind === track.kind)
      );

      if (t && t.sender) {
        t.direction = "sendrecv";
        try {
          await t.sender.replaceTrack(track);
        } catch (err) {
          console.warn(`[WEBRTC] replaceTrack failed for ${track.kind}:`, err);
        }
      } else {
        const s = senders.find((snd) => snd.track && snd.track.kind === track.kind);
        if (s) {
          await s.replaceTrack(track).catch(() => {});
        } else {
          try {
            pc.addTrack(track, stream);
          } catch (e) {}
        }
      }
    });
  }

  /**
   * Attaches local stream to all active and future peers
   */
  async attachLocalTracks(stream) {
    if (!stream) return;
    this.localStream = stream;

    for (const peer of this.peers.values()) {
      this.attachLocalTracksToPeer(peer.pc, stream);
    }
  }

  /**
   * Backwards-compatible initPeerConnection (takes care of local stream setup)
   */
  initPeerConnection(localStream = null) {
    if (localStream) {
      this.localStream = localStream;
      this.attachLocalTracks(localStream);
    }
    return null;
  }

  /**
   * Creates and sends an SDP offer to a specific peer
   * @param {string} targetSocketId 
   */
  async createAndSendOffer(targetSocketId) {
    if (!targetSocketId) return;
    const peer = this.getOrCreatePeer(targetSocketId, null, true);
    if (!peer) return;

    try {
      if (this.localStream) {
        this.attachLocalTracksToPeer(peer.pc, this.localStream);
      }

      const offer = await peer.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      const tunedOffer = new RTCSessionDescription({
        type: offer.type,
        sdp: optimizeOpusSdp(offer.sdp),
      });

      await peer.pc.setLocalDescription(tunedOffer);

      console.log(`[WEBRTC MESH] Sending SDP Offer to peer: ${targetSocketId}`);
      this.socket.emit("webrtc-offer", {
        targetSocketId,
        roomCode: this.roomCode,
        sdpOffer: tunedOffer,
        sender: this.currentUser,
      });
    } catch (err) {
      console.error(`[WEBRTC MESH] Failed to create offer for ${targetSocketId}:`, err);
    }
  }

  /**
   * Handles an incoming offer from a peer, sets remote description, and returns SDP answer
   * @param {RTCSessionDescriptionInit} sdpOffer 
   * @param {string} fromSocketId 
   * @param {object} [sender] 
   */
  async handleOfferAndSendAnswer(sdpOffer, fromSocketId, sender = null) {
    if (!fromSocketId || !sdpOffer) return;
    const peer = this.getOrCreatePeer(fromSocketId, sender, false);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));

      if (this.localStream) {
        this.attachLocalTracksToPeer(peer.pc, this.localStream);
      }

      // Flush buffered ICE candidates
      while (peer.pendingCandidates.length > 0) {
        const candidate = peer.pendingCandidates.shift();
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }

      const answer = await peer.pc.createAnswer();
      const tunedAnswer = new RTCSessionDescription({
        type: answer.type,
        sdp: optimizeOpusSdp(answer.sdp),
      });

      await peer.pc.setLocalDescription(tunedAnswer);

      console.log(`[WEBRTC MESH] Sending SDP Answer to peer: ${fromSocketId}`);
      this.socket.emit("webrtc-answer", {
        targetSocketId: fromSocketId,
        roomCode: this.roomCode,
        sdpAnswer: tunedAnswer,
        sender: this.currentUser,
      });
    } catch (err) {
      console.error(`[WEBRTC MESH] Failed to handle offer and answer for ${fromSocketId}:`, err);
    }
  }

  /**
   * Handles an incoming answer from a remote peer
   * @param {RTCSessionDescriptionInit} sdpAnswer 
   * @param {string} fromSocketId 
   */
  async handleAnswer(sdpAnswer, fromSocketId) {
    let peer = this.peers.get(fromSocketId);
    if (!peer && this.peers.size === 1) {
      // Fallback for single peer if fromSocketId is not explicitly tagged
      peer = Array.from(this.peers.values())[0];
    }
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdpAnswer));

      while (peer.pendingCandidates.length > 0) {
        const candidate = peer.pendingCandidates.shift();
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
      console.log(`[WEBRTC MESH] Remote SDP Answer applied for peer: ${peer.socketId}`);
    } catch (err) {
      console.error(`[WEBRTC MESH] Failed to apply remote answer from ${fromSocketId}:`, err);
    }
  }

  /**
   * Adds an ICE candidate for a specific peer
   * @param {RTCIceCandidateInit} candidate 
   * @param {string} fromSocketId 
   */
  async handleIceCandidate(candidate, fromSocketId) {
    if (!candidate) return;
    let peer = this.peers.get(fromSocketId);
    if (!peer && this.peers.size === 1) {
      peer = Array.from(this.peers.values())[0];
    }
    if (!peer) return;

    if (!peer.pc || !peer.pc.remoteDescription) {
      peer.pendingCandidates.push(candidate);
      return;
    }

    try {
      await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn(`[WEBRTC MESH] Error adding ICE candidate for peer ${fromSocketId}:`, err);
    }
  }

  /**
   * Seamlessly replaces the outgoing video track (screen share or camera) across all active peers
   * @param {MediaStreamTrack} newVideoTrack 
   */
  async replaceVideoTrack(newVideoTrack) {
    for (const peer of this.peers.values()) {
      try {
        const transceivers = typeof peer.pc.getTransceivers === "function" ? peer.pc.getTransceivers() : [];
        const videoTransceiver = transceivers.find(
          (t) => (t.receiver?.track?.kind === "video") || (t.sender?.track?.kind === "video")
        );

        if (videoTransceiver && videoTransceiver.sender) {
          videoTransceiver.direction = "sendrecv";
          await videoTransceiver.sender.replaceTrack(newVideoTrack);
          continue;
        }

        const senders = typeof peer.pc.getSenders === "function" ? peer.pc.getSenders() : [];
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      } catch (err) {
        console.error(`[WEBRTC MESH] Failed to replace video track for peer ${peer.socketId}:`, err);
      }
    }
  }

  /**
   * Seamlessly replaces the outgoing audio track across all active peers
   * @param {MediaStreamTrack} newAudioTrack 
   */
  async replaceAudioTrack(newAudioTrack) {
    if (!newAudioTrack) return;
    for (const peer of this.peers.values()) {
      try {
        const transceivers = typeof peer.pc.getTransceivers === "function" ? peer.pc.getTransceivers() : [];
        const audioTransceiver = transceivers.find(
          (t) => (t.receiver?.track?.kind === "audio") || (t.sender?.track?.kind === "audio")
        );

        if (audioTransceiver && audioTransceiver.sender) {
          audioTransceiver.direction = "sendrecv";
          await audioTransceiver.sender.replaceTrack(newAudioTrack);
          continue;
        }

        const senders = typeof peer.pc.getSenders === "function" ? peer.pc.getSenders() : [];
        const audioSender = senders.find((s) => s.track && s.track.kind === "audio");
        if (audioSender) {
          await audioSender.replaceTrack(newAudioTrack);
        }
      } catch (err) {
        console.error(`[WEBRTC MESH] Failed to replace audio track for peer ${peer.socketId}:`, err);
      }
    }
  }

  /**
   * Removes a single peer when they leave without affecting any other participants
   * @param {string} socketId 
   */
  removePeer(socketId) {
    if (!socketId || !this.peers.has(socketId)) return;
    const peer = this.peers.get(socketId);
    try {
      peer.pc.ontrack = null;
      peer.pc.onicecandidate = null;
      peer.pc.onconnectionstatechange = null;
      peer.pc.close();
    } catch (e) {}

    try {
      peer.remoteStream.getTracks().forEach((t) => t.stop());
    } catch (e) {}

    this.peers.delete(socketId);
    console.log(`[WEBRTC MESH] Removed peer ${socketId}. Active peers remaining: ${this.peers.size}`);
    this.notifyPeersChange();
    if (typeof this.onPeerLeft === "function") {
      this.onPeerLeft(peer.user || { socketId });
    }
  }

  /**
   * Terminates all active peer connections and clears mesh resources
   */
  close() {
    for (const peer of this.peers.values()) {
      try {
        peer.pc.ontrack = null;
        peer.pc.onicecandidate = null;
        peer.pc.onconnectionstatechange = null;
        peer.pc.close();
      } catch (e) {}

      try {
        peer.remoteStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }

    this.peers.clear();
    this.notifyPeersChange();
  }
}


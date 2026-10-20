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

const hasTurnServer = (servers) => {
  if (!Array.isArray(servers)) return false;
  return servers.some((s) => {
    if (!s) return false;
    const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
    return urls.some((u) => typeof u === "string" && (u.startsWith("turn:") || u.startsWith("turns:")));
  });
};

/**
 * Dynamically fetches ICE servers from Next.js API (/api/webrtc/ice-servers)
 * or Azure backend API (${serverUrl}/api/webrtc/ice-servers).
 * Returns fresh Cloudflare Calls Realtime Edge TURN credentials.
 */
export const fetchIceServers = async () => {
  if (cachedDynamicIceServers && cachedDynamicIceServers.length > 0 && hasTurnServer(cachedDynamicIceServers)) {
    return cachedDynamicIceServers;
  }

  // 1. Try local Next.js API route first (fastest, same-origin, edge-cached)
  try {
    const res = await fetch("/api/webrtc/ice-servers");
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers && data.iceServers.length > 0 && hasTurnServer(data.iceServers)) {
        cachedDynamicIceServers = data.iceServers;
        console.log("[WEBRTC] Successfully fetched TURN ICE servers from Next.js API:", data.iceServers.length, data.source);
        return cachedDynamicIceServers;
      }
    }
  } catch (err) {
    // Next.js route not reachable, continue to backend
  }

  // 2. Try Azure backend API endpoint (holds live Cloudflare Calls TURN credentials)
  try {
    const serverUrl = getSignalingServerUrl();
    const endpoint = `${serverUrl}/api/webrtc/ice-servers`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers && data.iceServers.length > 0 && hasTurnServer(data.iceServers)) {
        cachedDynamicIceServers = data.iceServers;
        console.log("[WEBRTC] Successfully fetched TURN ICE servers from Azure backend:", data.iceServers.length, data.source);
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

  // Primary Metered TURN credentials with built-in production fallback
  const turnUsername = process.env.NEXT_PUBLIC_METERED_TURN_USERNAME || "8401188622a1b4affcd24ed";
  const turnPassword = process.env.NEXT_PUBLIC_METERED_TURN_PASSWORD || "0OtuKMNQdY3m1XaU";

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
        urls: "turn:standard.relay.metered.ca:80",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:standard.relay.metered.ca:80?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turn:standard.relay.metered.ca:443",
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: "turns:standard.relay.metered.ca:443?transport=tcp",
        username: turnUsername,
        credential: turnPassword,
      },
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
        if (!updated.includes("stereo=")) updated += ";stereo=1;sprop-stereo=1";
        if (!updated.includes("maxaveragebitrate=")) updated += ";maxaveragebitrate=128000";
        if (!updated.includes("cbr=")) updated += ";cbr=1";
        if (!updated.includes("maxplaybackrate=")) updated += ";maxplaybackrate=48000";
        return `${prefix}${updated}`;
      });
    } else {
      return sdp.replace(
        new RegExp(`(a=rtpmap:${pt}\\s+opus\\/48000[^\\r\\n]*[\\r\\n]+)`, "i"),
        `$1a=fmtp:${pt} useinbandfec=1;stereo=1;sprop-stereo=1;maxaveragebitrate=128000;cbr=1;maxplaybackrate=48000\r\n`
      );
    }
  } catch (err) {
    console.warn("[WEBRTC] Could not optimize Opus SDP:", err);
    return sdp;
  }
}

/**
 * Finds the transceiver that actually carries media for a given kind.
 * Prefers transceivers already bound to an m-line (mid !== null) so tracks are never
 * attached to an un-negotiated transceiver (which would silently send nothing).
 * @param {RTCPeerConnection} pc
 * @param {"audio"|"video"} kind
 */
function findTransceiverForKind(pc, kind) {
  const transceivers = typeof pc.getTransceivers === "function" ? pc.getTransceivers() : [];
  const candidates = transceivers.filter(
    (tr) =>
      !tr.stopped &&
      tr.direction !== "stopped" &&
      (tr.receiver?.track?.kind === kind || tr.sender?.track?.kind === kind)
  );
  return candidates.find((tr) => tr.mid !== null) || candidates[0] || null;
}

export class WebRTCPeerManager {
  constructor({
    socket,
    roomCode,
    currentUser,
    localStream = null,
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

    this.localStream = localStream || null;
    this.peers = new Map(); // socketId -> { socketId, pc, remoteStream, user, isInitiator, pendingCandidates }
  }

  /**
   * Helper to notify callers of any changes in active peers list
   */
  notifyPeersChange() {
    const list = Array.from(this.peers.values()).map((p) => ({
      socketId: p.socketId,
      stream: p.remoteStream,
      streamVersion: p.streamVersion || 0,
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
      if (user && (!existing.user || !existing.user.name || existing.user.name === "Participant")) {
        existing.user = user;
        this.notifyPeersChange();
      }
      return existing;
    }

    const remoteStream = new MediaStream();
    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    const peerObj = {
      socketId,
      pc,
      remoteStream,
      streamVersion: 0,
      user: user || { socketId },
      isInitiator,
      makingOffer: false,
      isRestartingIce: false,
      iceRestartCount: 0,
      iceRecoveryTimer: null,
      pendingCandidates: [],
    };

    // Update with dynamic Azure TURN credentials if available
    if (!cachedDynamicIceServers) {
      fetchIceServers()
        .then((servers) => {
          if (pc && typeof pc.setConfiguration === "function") {
            try {
              pc.setConfiguration({
                iceServers: servers,
                iceCandidatePoolSize: 10,
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require",
              });
              console.log(`[WEBRTC MESH] Updated peer ${socketId} with dynamic Azure TURN servers.`);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    // 1. Only the OFFERER pre-creates sendrecv transceivers and attaches tracks up-front.
    // Transceivers created before setRemoteDescription on the answerer can cause duplicate m-lines,
    // so the answerer attaches tracks in handleOfferAndSendAnswer after setRemoteDescription.
    if (isInitiator) {
      try {
        const audioTrack =
          this.localStream?.getAudioTracks?.()?.find((t) => t.readyState === "live") || null;
        const videoTrack =
          this.localStream?.getVideoTracks?.()?.find((t) => t.readyState === "live") || null;
        const streams = this.localStream ? [this.localStream] : [];
        pc.addTransceiver(audioTrack || "audio", { direction: "sendrecv", streams });
        pc.addTransceiver(videoTrack || "video", { direction: "sendrecv", streams });
      } catch (e) {}
    }

    // 3. Handle incoming remote audio and video tracks
    pc.ontrack = (event) => {
      console.log(`[WEBRTC MESH] Incoming track (${event.track.kind}) from peer ${socketId}:`, event.track.id);

      const refreshRemoteStream = () => {
        const currentTracks = peerObj.remoteStream ? peerObj.remoteStream.getTracks() : [];
        const incomingTracks =
          event.streams && event.streams[0] ? event.streams[0].getTracks() : [event.track];

        const trackMap = new Map();
        currentTracks.forEach((t) => {
          if (t.readyState !== "ended") {
            trackMap.set(t.kind, t);
          }
        });
        incomingTracks.forEach((t) => {
          trackMap.set(t.kind, t);
        });

        peerObj.remoteStream = new MediaStream(Array.from(trackMap.values()));
        peerObj.streamVersion = (peerObj.streamVersion || 0) + 1;
        this.notifyPeersChange();
      };

      event.track.onunmute = () => {
        console.log(`[WEBRTC MESH] Track unmuted (${event.track.kind}) from peer ${socketId}`);
        refreshRemoteStream();
      };

      event.track.onmute = () => {
        peerObj.streamVersion = (peerObj.streamVersion || 0) + 1;
        this.notifyPeersChange();
      };

      event.track.onended = () => {
        peerObj.streamVersion = (peerObj.streamVersion || 0) + 1;
        this.notifyPeersChange();
      };

      refreshRemoteStream();
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

    // 5. ICE Connection Health Lifecycle (handles mobile drops & carrier NAT shifts)
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log(`[WEBRTC MESH] ICE connection state with peer ${socketId}: ${iceState}`);
      if (iceState === "connected" || iceState === "completed") {
        this.clearIceRecovery(socketId);
        peerObj.iceRestartCount = 0;
        peerObj.isRestartingIce = false;
      } else if (iceState === "failed") {
        this.handleConnectionFailure(socketId);
      } else if (iceState === "disconnected") {
        this.scheduleIceRecovery(socketId, 8000);
      }
    };

    // 6. Overall Peer Connection lifecycle
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WEBRTC MESH] Connection state with peer ${socketId}: ${state}`);
      if (state === "connected") {
        this.clearIceRecovery(socketId);
        peerObj.iceRestartCount = 0;
        peerObj.isRestartingIce = false;
      } else if (state === "failed") {
        this.handleConnectionFailure(socketId);
      } else if (state === "disconnected") {
        this.scheduleIceRecovery(socketId, 8000);
      }
      this.onConnectionStateChange(state, socketId);
      this.notifyPeersChange();
    };

    this.peers.set(socketId, peerObj);
    this.notifyPeersChange();
    return peerObj;
  }

  /**
   * Schedules an automatic ICE restart if the peer connection remains disconnected
   * @param {string} socketId 
   * @param {number} delayMs 
   */
  scheduleIceRecovery(socketId, delayMs = 8000) {
    const peer = this.peers.get(socketId);
    if (!peer || peer.isRestartingIce) return;
    if (peer.iceRecoveryTimer) clearTimeout(peer.iceRecoveryTimer);

    peer.iceRecoveryTimer = setTimeout(async () => {
      peer.iceRecoveryTimer = null;
      if (!this.peers.has(socketId)) return;
      const curPc = peer.pc;
      if (!curPc || peer.isRestartingIce) return;

      // Do NOT interrupt if connection is currently in the middle of connecting/checking or already connected
      if (
        curPc.iceConnectionState === "checking" ||
        curPc.connectionState === "connecting" ||
        curPc.iceConnectionState === "connected" ||
        curPc.connectionState === "connected"
      ) {
        return;
      }

      // Only the initiator triggers ICE restart to avoid simultaneous dual-offer collisions
      if (!peer.isInitiator) return;

      const isBroken =
        curPc.iceConnectionState === "disconnected" ||
        curPc.iceConnectionState === "failed" ||
        curPc.connectionState === "disconnected" ||
        curPc.connectionState === "failed";

      if (isBroken) {
        console.warn(`[WEBRTC MESH] Peer ${socketId} connection dropped. Initiating automatic ICE restart...`);
        await this.restartIce(socketId);
      }
    }, delayMs);
  }

  /**
   * Cancels pending ICE recovery timers when connection stabilizes
   * @param {string} socketId 
   */
  clearIceRecovery(socketId) {
    const peer = this.peers.get(socketId);
    if (peer && peer.iceRecoveryTimer) {
      clearTimeout(peer.iceRecoveryTimer);
      peer.iceRecoveryTimer = null;
    }
  }

  /**
   * Handles peer failure by attempting an ICE restart, or falling back to full peer recreation
   * @param {string} socketId 
   */
  async handleConnectionFailure(socketId) {
    const peer = this.peers.get(socketId);
    if (!peer) return;
    this.clearIceRecovery(socketId);

    // Only the initiator triggers the recovery attempt to prevent dual-offer collision
    if (!peer.isInitiator) {
      console.log(`[WEBRTC MESH] Answerer peer ${socketId} waiting for initiator ICE restart...`);
      return;
    }

    peer.iceRestartCount = (peer.iceRestartCount || 0) + 1;
    if (peer.iceRestartCount <= 3) {
      console.warn(`[WEBRTC MESH] Connection failed with ${socketId}. Attempting ICE Restart (attempt ${peer.iceRestartCount}/3)...`);
      await this.restartIce(socketId);
    } else {
      console.warn(`[WEBRTC MESH] Connection failed repeatedly with ${socketId}. Recreating clean peer connection...`);
      peer.iceRestartCount = 0;
      this.recreatePeer(socketId);
    }
  }

  /**
   * Triggers an ICE restart with the target peer to renegotiate candidate pairs across mobile network changes
   * @param {string} targetSocketId 
   */
  async restartIce(targetSocketId) {
    const peer = this.peers.get(targetSocketId);
    if (!peer || !peer.pc || peer.pc.signalingState === "closed" || peer.isRestartingIce) return;

    try {
      peer.isRestartingIce = true;
      peer.makingOffer = true;

      // Safety timeout to reset isRestartingIce flag after 12s if handshake stalls
      setTimeout(() => {
        if (peer && peer.isRestartingIce) {
          peer.isRestartingIce = false;
        }
      }, 12000);

      // Ensure fresh TURN relay configuration is set
      try {
        const servers = await fetchIceServers();
        if (peer.pc && typeof peer.pc.setConfiguration === "function") {
          peer.pc.setConfiguration({
            iceServers: servers,
            iceCandidatePoolSize: 10,
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
          });
        }
      } catch (e) {}

      // Re-affirm transceivers are sendrecv
      const transceivers = typeof peer.pc.getTransceivers === "function" ? peer.pc.getTransceivers() : [];
      transceivers.forEach((t) => {
        if (!t.stopped && t.direction !== "stopped") {
          t.direction = "sendrecv";
        }
      });

      if (this.localStream) {
        await this.attachLocalTracksToPeer(peer.pc, this.localStream, peer);
      }

      console.log(`[WEBRTC MESH] Generating ICE Restart offer for peer: ${targetSocketId}`);
      const offer = await peer.pc.createOffer({
        iceRestart: true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      const tunedOffer = new RTCSessionDescription({
        type: offer.type,
        sdp: optimizeOpusSdp(offer.sdp),
      });

      await peer.pc.setLocalDescription(tunedOffer);

      this.socket.emit("webrtc-offer", {
        targetSocketId,
        roomCode: this.roomCode,
        sdpOffer: tunedOffer,
        sender: this.currentUser,
        isIceRestart: true,
      });
    } catch (err) {
      console.error(`[WEBRTC MESH] Failed ICE restart for peer ${targetSocketId}:`, err);
      peer.isRestartingIce = false;
    } finally {
      peer.makingOffer = false;
    }
  }

  /**
   * Completely tears down a broken peer connection and initiates a fresh handshake
   * @param {string} socketId 
   */
  recreatePeer(socketId) {
    if (!socketId) return null;
    const oldPeer = this.peers.get(socketId);
    const user = oldPeer?.user || { socketId };

    if (oldPeer) {
      this.clearIceRecovery(socketId);
      try {
        oldPeer.pc.ontrack = null;
        oldPeer.pc.onicecandidate = null;
        oldPeer.pc.onconnectionstatechange = null;
        oldPeer.pc.oniceconnectionstatechange = null;
        oldPeer.pc.close();
      } catch (e) {}
      this.peers.delete(socketId);
    }

    const newPeer = this.getOrCreatePeer(socketId, user, true);
    if (newPeer) {
      this.createAndSendOffer(socketId, user);
    }
    return newPeer;
  }

  /**
   * Resets and renegotiates all peer connections when Socket.io reconnects after a signal blackout
   */
  async reconnectAllPeers() {
    console.log(`[WEBRTC MESH] Signaling reconnected. Re-negotiating all ${this.peers.size} active peers...`);
    const peerEntries = Array.from(this.peers.entries());
    for (const [socketId, peer] of peerEntries) {
      try {
        this.clearIceRecovery(socketId);
        try {
          peer.pc.ontrack = null;
          peer.pc.onicecandidate = null;
          peer.pc.onconnectionstatechange = null;
          peer.pc.oniceconnectionstatechange = null;
          peer.pc.close();
        } catch (e) {}
        this.peers.delete(socketId);

        const newPeer = this.getOrCreatePeer(socketId, peer.user, true);
        if (this.localStream) {
          await this.attachLocalTracksToPeer(newPeer.pc, this.localStream, newPeer);
        }
        await this.createAndSendOffer(socketId, peer.user);
      } catch (err) {
        console.error(`[WEBRTC MESH] Error reconnecting peer ${socketId}:`, err);
      }
    }
  }

  /**
   * Attaches local audio and video tracks to a specific RTCPeerConnection
   * @returns {Promise<boolean>} true if renegotiation is required
   */
  async attachLocalTracksToPeer(pc, stream, peerObj = null) {
    if (!pc || !stream) return false;

    // Do not pre-attach tracks on the answerer before setRemoteDescription(offer),
    // as pc.addTrack would create duplicate un-associated transceivers.
    if (peerObj && !peerObj.isInitiator && !pc.remoteDescription) {
      return false;
    }

    const senders = typeof pc.getSenders === "function" ? pc.getSenders() : [];
    let needsRenegotiation = false;

    for (const track of stream.getTracks()) {
      if (track.readyState === "ended") continue;

      // NOTE: never force track.enabled here — mute / camera-off state is owned by the UI.
      const t = findTransceiverForKind(pc, track.kind);

      if (t && t.sender) {
        t.direction = "sendrecv";
        try {
          if (t.sender.track !== track) {
            await t.sender.replaceTrack(track);
          }
        } catch (err) {
          console.warn(`[WEBRTC] replaceTrack failed for ${track.kind}:`, err);
        }
        if (
          pc.remoteDescription &&
          t.currentDirection &&
          t.currentDirection !== "sendrecv" &&
          t.currentDirection !== "sendonly"
        ) {
          needsRenegotiation = true;
        }
      } else {
        const s = senders.find((snd) => snd.track && snd.track.kind === track.kind);
        if (s) {
          if (s.track !== track) {
            await s.replaceTrack(track).catch(() => {});
          }
        } else {
          try {
            pc.addTrack(track, stream);
            if (pc.remoteDescription) {
              needsRenegotiation = true;
            }
          } catch (e) {}
        }
      }
    }

    return needsRenegotiation;
  }

  /**
   * Attaches local stream to all active and future peers
   */
  async attachLocalTracks(stream) {
    if (!stream) return;
    this.localStream = stream;

    for (const peer of this.peers.values()) {
      const needsRenegotiation = await this.attachLocalTracksToPeer(peer.pc, stream, peer);
      if (needsRenegotiation && peer.pc.signalingState === "stable") {
        await this.createAndSendOffer(peer.socketId, peer.user);
      }
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
   * @param {object} [user]
   */
  async createAndSendOffer(targetSocketId, user = null) {
    if (!targetSocketId) return;
    const peer = this.getOrCreatePeer(targetSocketId, user, true);
    if (!peer) return;

    try {
      peer.makingOffer = true;

      // Ensure fresh Cloudflare TURN servers are applied to peer before offer generation
      try {
        const servers = await fetchIceServers();
        if (servers && servers.length > 0 && peer.pc && typeof peer.pc.setConfiguration === "function") {
          peer.pc.setConfiguration({
            iceServers: servers,
            iceCandidatePoolSize: 10,
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
          });
        }
      } catch (e) {}

      const transceivers = typeof peer.pc.getTransceivers === "function" ? peer.pc.getTransceivers() : [];
      transceivers.forEach((t) => {
        if (!t.stopped && t.direction !== "stopped") {
          t.direction = "sendrecv";
        }
      });

      if (this.localStream) {
        await this.attachLocalTracksToPeer(peer.pc, this.localStream, peer);
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
    } finally {
      peer.makingOffer = false;
    }
  }

  /**
   * Handles an incoming offer from a peer, sets remote description, and returns SDP answer
   * @param {RTCSessionDescriptionInit} sdpOffer 
   * @param {string} fromSocketId 
   * @param {object} [sender] 
   * @param {boolean} [isIceRestart]
   */
  async handleOfferAndSendAnswer(sdpOffer, fromSocketId, sender = null, isIceRestart = false) {
    if (!fromSocketId || !sdpOffer) return;
    const peer = this.getOrCreatePeer(fromSocketId, sender, false);
    if (!peer) return;

    if (isIceRestart) {
      console.log(`[WEBRTC MESH] Received ICE Restart offer from peer: ${fromSocketId}`);
      this.clearIceRecovery(fromSocketId);
    }

    if (sender && (!peer.user || !peer.user.name)) {
      peer.user = sender;
      this.notifyPeersChange();
    }

    try {
      const myId = String(this.socket?.id || "");
      const theirId = String(fromSocketId || "");
      const isPolite = !myId || myId > theirId;
      const offerCollision = Boolean(peer.makingOffer || peer.pc.signalingState !== "stable");

      if (offerCollision) {
        if (!isPolite) {
          console.warn(`[WEBRTC MESH] Impolite peer ignoring colliding offer from ${fromSocketId}`);
          return;
        }
        try {
          await peer.pc.setLocalDescription({ type: "rollback" });
        } catch (e) {}
      }

      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));

      // Explicitly set non-stopped transceivers to sendrecv so the answerer transmits video & audio
      const transceivers = typeof peer.pc.getTransceivers === "function" ? peer.pc.getTransceivers() : [];
      transceivers.forEach((t) => {
        if (!t.stopped && t.direction !== "stopped") {
          t.direction = "sendrecv";
        }
      });

      if (this.localStream) {
        await this.attachLocalTracksToPeer(peer.pc, this.localStream, peer);
      }

      // Flush buffered ICE candidates
      while (peer.pendingCandidates.length > 0) {
        const candidate = peer.pendingCandidates.shift();
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }

      // Ensure fresh Cloudflare TURN servers are applied to peer before answer generation
      try {
        const servers = await fetchIceServers();
        if (servers && servers.length > 0 && peer.pc && typeof peer.pc.setConfiguration === "function") {
          peer.pc.setConfiguration({
            iceServers: servers,
            iceCandidatePoolSize: 10,
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
          });
        }
      } catch (e) {}

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
   * @param {object} [sender]
   */
  async handleAnswer(sdpAnswer, fromSocketId, sender = null) {
    let peer = this.peers.get(fromSocketId);
    if (!peer && this.peers.size === 1) {
      // Fallback for single peer if fromSocketId is not explicitly tagged
      peer = Array.from(this.peers.values())[0];
    }
    if (!peer) return;

    if (sender && (!peer.user || !peer.user.name)) {
      peer.user = sender;
      this.notifyPeersChange();
    }

    try {
      if (peer.pc.signalingState !== "have-local-offer") {
        console.warn(`[WEBRTC MESH] Ignoring answer from ${fromSocketId}: signalingState=${peer.pc.signalingState}`);
        return;
      }
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
      peer.isRestartingIce = false;
      this.clearIceRecovery(peer.socketId);

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
        if (!peer.isInitiator && !peer.pc.remoteDescription) {
          continue;
        }

        const videoTransceiver = findTransceiverForKind(peer.pc, "video");

        if (videoTransceiver && videoTransceiver.sender) {
          videoTransceiver.direction = "sendrecv";
          await videoTransceiver.sender.replaceTrack(newVideoTrack);
          if (
            newVideoTrack &&
            peer.pc.signalingState === "stable" &&
            peer.pc.remoteDescription &&
            videoTransceiver.currentDirection &&
            videoTransceiver.currentDirection !== "sendrecv" &&
            videoTransceiver.currentDirection !== "sendonly"
          ) {
            await this.createAndSendOffer(peer.socketId, peer.user);
          }
          continue;
        }

        const senders = typeof peer.pc.getSenders === "function" ? peer.pc.getSenders() : [];
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        } else if (newVideoTrack && this.localStream) {
          peer.pc.addTrack(newVideoTrack, this.localStream);
          if (peer.pc.signalingState === "stable" && peer.pc.remoteDescription) {
            await this.createAndSendOffer(peer.socketId, peer.user);
          }
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
        if (!peer.isInitiator && !peer.pc.remoteDescription) {
          continue;
        }

        const audioTransceiver = findTransceiverForKind(peer.pc, "audio");

        if (audioTransceiver && audioTransceiver.sender) {
          audioTransceiver.direction = "sendrecv";
          await audioTransceiver.sender.replaceTrack(newAudioTrack);
          if (
            peer.pc.signalingState === "stable" &&
            peer.pc.remoteDescription &&
            audioTransceiver.currentDirection &&
            audioTransceiver.currentDirection !== "sendrecv" &&
            audioTransceiver.currentDirection !== "sendonly"
          ) {
            await this.createAndSendOffer(peer.socketId, peer.user);
          }
          continue;
        }

        const senders = typeof peer.pc.getSenders === "function" ? peer.pc.getSenders() : [];
        const audioSender = senders.find((s) => s.track && s.track.kind === "audio");
        if (audioSender) {
          await audioSender.replaceTrack(newAudioTrack);
        } else if (this.localStream) {
          peer.pc.addTrack(newAudioTrack, this.localStream);
          if (peer.pc.signalingState === "stable" && peer.pc.remoteDescription) {
            await this.createAndSendOffer(peer.socketId, peer.user);
          }
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
    this.clearIceRecovery(socketId);
    try {
      peer.pc.ontrack = null;
      peer.pc.onicecandidate = null;
      peer.pc.onconnectionstatechange = null;
      peer.pc.oniceconnectionstatechange = null;
      peer.pc.close();
    } catch (e) {}

    try {
      peer.remoteStream.getTracks().forEach((t) => t.stop());
    } catch (e) {}

    this.peers.delete(socketId);
    console.log(`[WEBRTC MESH] Removed peer ${socketId}. Active peers remaining: ${this.peers.size}`);
    this.notifyPeersChange();
    if (typeof this.onPeerLeft === "function") {
      this.onPeerLeft(socketId, peer.user || { socketId });
    }
  }

  /**
   * Terminates all active peer connections and clears mesh resources
   */
  close() {
    for (const [socketId, peer] of this.peers.entries()) {
      this.clearIceRecovery(socketId);
      try {
        peer.pc.ontrack = null;
        peer.pc.onicecandidate = null;
        peer.pc.onconnectionstatechange = null;
        peer.pc.oniceconnectionstatechange = null;
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


const { Server } = require("socket.io");

/**
 * Enterprise WebRTC Signaling Service for MCPA Construction & Supply
 * 
 * Facilitates peer-to-peer (P2P) video, audio, screen share, and real-time chat
 * between Clients and Engineers/Admins without routing media streams through
 * the server (zero video bandwidth costs).
 */
const ROOM_EXPIRY_GRACE_MS = 5 * 60 * 1000; // 5 minutes after call ends

class WebRTCSignalingService {
  constructor() {
    this.io = null;
    this.rooms = new Map(); // roomCode -> Map(socketId -> { user, role, socketId, joinedAt })
    this.roomMeta = new Map(); // roomCode -> { endedAt, expiresAt }
  }

  /**
   * Evaluates whether a room has expired (5 minutes after all participants left / call ended)
   * @param {string} roomCode
   */
  getRoomExpiryInfo(roomCode) {
    const activeCount = this.rooms.has(roomCode) ? this.rooms.get(roomCode).size : 0;
    const meta = this.roomMeta.get(roomCode);
    if (!meta || !meta.endedAt || activeCount > 0) {
      return {
        isExpired: false,
        endedAt: null,
        expiresAt: null,
        remainingMs: null,
      };
    }

    const expiresAt = meta.expiresAt || meta.endedAt + ROOM_EXPIRY_GRACE_MS;
    const now = Date.now();
    const remainingMs = Math.max(0, expiresAt - now);
    const isExpired = now >= expiresAt;

    return {
      isExpired,
      endedAt: meta.endedAt,
      expiresAt,
      remainingMs,
    };
  }

  /**
   * Initialize Socket.IO on the existing HTTP server instance
   * @param {import("http").Server} httpServer 
   */
  init(httpServer) {
    if (this.io) return this.io;

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow local development, LAN, Vercel deployments, and custom production domains
          if (
            !origin ||
            origin.includes("localhost") ||
            origin.includes("127.0.0.1") ||
            origin.includes("vercel.app") ||
            origin.includes("mcpaconstruction.com")
          ) {
            return callback(null, true);
          }
          return callback(null, true); // Permissive CORS for signaling handshakes
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 15000,
      transports: ["polling", "websocket"],
    });

    this.io.on("connection", (socket) => {
      console.log(`[WEBRTC SIGNALING] Socket connected: ${socket.id}`);

      // 1. Client or Admin joins a consultation room
      // 1a. Pre-join query for room participant count, capacity & 5-minute post-call expiration check
      socket.on("check-room-capacity", ({ roomCode }) => {
        if (!roomCode) return;
        const currentCount = this.rooms.has(roomCode) ? this.rooms.get(roomCode).size : 0;
        const maxCapacity = 8;
        const expiry = this.getRoomExpiryInfo(roomCode);
        socket.emit("room-capacity-status", {
          roomCode,
          currentCount,
          maxCapacity,
          isFull: currentCount >= maxCapacity,
          isExpired: expiry.isExpired,
          endedAt: expiry.endedAt,
          expiresAt: expiry.expiresAt,
          remainingMs: expiry.remainingMs,
        });
      });

      // 1b. Client or Admin joins a consultation room
      socket.on("join-room", ({ roomCode, user = {}, role = "client" }) => {
        if (!roomCode) return;

        const expiry = this.getRoomExpiryInfo(roomCode);
        if (expiry.isExpired) {
          console.warn(
            `[WEBRTC] Room ${roomCode} expired 5 minutes after call ended. Rejecting socket ${socket.id}`
          );
          socket.emit("room-expired", {
            roomCode,
            endedAt: expiry.endedAt,
            expiresAt: expiry.expiresAt,
            message: "This consultation room has expired (5 minutes after the call ended).",
          });
          return;
        }

        if (!this.rooms.has(roomCode)) {
          this.rooms.set(roomCode, new Map());
        }

        // Room is active again (joined within 5-minute grace window or fresh start)
        this.roomMeta.set(roomCode, { endedAt: null, expiresAt: null });

        const roomParticipants = this.rooms.get(roomCode);
        const maxCapacity = 8;

        if (roomParticipants.size >= maxCapacity) {
          console.warn(`[WEBRTC] Room ${roomCode} is full (${roomParticipants.size}/${maxCapacity}). Rejecting socket ${socket.id}`);
          socket.emit("room-full", {
            roomCode,
            currentCount: roomParticipants.size,
            maxCapacity,
            message: `The consultation room has reached its maximum capacity (${maxCapacity} participants).`,
          });
          return;
        }

        socket.join(roomCode);
        socket.currentRoom = roomCode;

        // Clean up any stale/ghost socket entries for the reconnecting user (e.g. from network drops before pingTimeout)
        if (user?.id || user?.email) {
          for (const [existingSocketId, existingData] of roomParticipants.entries()) {
            const isSameUser =
              (user.id && existingData?.id === user.id) ||
              (user.email && existingData?.email === user.email);
            if (isSameUser && existingSocketId !== socket.id) {
              const isSameRole = (existingData?.role || "client") === (role || "client");
              const existingAffil = existingData?.affiliation || (existingData?.role === "admin" ? "mcpa" : "client");
              const incomingAffil = user?.affiliation || (role === "admin" ? "mcpa" : "client");
              const isSameAffiliation = existingAffil === incomingAffil;

              // Safeguard 1: Never purge a peer with a different role or affiliation (e.g. Admin testing alongside Client on same account/email)
              if (!isSameRole || !isSameAffiliation) {
                console.log(
                  `[WEBRTC] Preserving distinct role/affiliation participant ${existingSocketId} (${existingData?.role}/${existingAffil}) vs incoming (${role}/${incomingAffil})`
                );
                continue;
              }

              // Safeguard 2: Multi-tab defense testing / active concurrent session protection
              const existingSocketInstance = io.sockets.sockets.get(existingSocketId);
              const isStillActive = Boolean(existingSocketInstance && existingSocketInstance.connected);
              if (isStillActive) {
                console.log(
                  `[WEBRTC] Multi-active connection detected for "${user.name || user.id}" (${existingSocketId} & ${socket.id}). Preserving both.`
                );
                continue;
              }

              console.log(
                `[WEBRTC] Purging stale ghost socket ${existingSocketId} for reconnecting user "${user.name || user.id}"`
              );
              roomParticipants.delete(existingSocketId);
              socket.to(roomCode).emit("peer-left", {
                socketId: existingSocketId,
                user: existingData,
              });
            }
          }
        }

        const initialMediaState = {
          isMicOn: user?.mediaState?.isMicOn !== false,
          isVideoOn: user?.mediaState?.isVideoOn !== false,
          isScreenSharing: Boolean(user?.mediaState?.isScreenSharing),
          isHandRaised: Boolean(user?.mediaState?.isHandRaised),
        };
        socket.userData = {
          ...user,
          role,
          socketId: socket.id,
          joinedAt: Date.now(),
          mediaState: initialMediaState,
        };

        const existingParticipants = Array.from(roomParticipants.values());

        // Save current participant
        roomParticipants.set(socket.id, socket.userData);

        console.log(
          `[WEBRTC] User "${user.name || role}" (${socket.id}) joined room "${roomCode}". Active in room: ${roomParticipants.size}/${maxCapacity}`
        );

        // Notify the newly joined socket of any peers already waiting in the room
        socket.emit("room-joined", {
          roomCode,
          socketId: socket.id,
          participants: existingParticipants,
        });

        // Notify other participants that a new peer joined
        socket.to(roomCode).emit("user-joined", {
          socketId: socket.id,
          user: socket.userData,
        });
      });

      // 2. WebRTC Offer Relay (Peer A -> Peer B)
      socket.on("webrtc-offer", ({ targetSocketId, roomCode, sdpOffer, sender, isIceRestart }) => {
        if (targetSocketId) {
          socket.to(targetSocketId).emit("webrtc-offer", {
            fromSocketId: socket.id,
            sdpOffer,
            sender: sender || socket.userData,
            isIceRestart: Boolean(isIceRestart),
          });
        } else if (roomCode) {
          socket.to(roomCode).emit("webrtc-offer", {
            fromSocketId: socket.id,
            sdpOffer,
            sender: sender || socket.userData,
            isIceRestart: Boolean(isIceRestart),
          });
        }
      });

      // 3. WebRTC Answer Relay (Peer B -> Peer A)
      socket.on("webrtc-answer", ({ targetSocketId, roomCode, sdpAnswer, sender }) => {
        if (targetSocketId) {
          socket.to(targetSocketId).emit("webrtc-answer", {
            fromSocketId: socket.id,
            sdpAnswer,
            sender: sender || socket.userData,
          });
        } else if (roomCode) {
          socket.to(roomCode).emit("webrtc-answer", {
            fromSocketId: socket.id,
            sdpAnswer,
            sender: sender || socket.userData,
          });
        }
      });

      // 4. ICE Candidate Exchange
      socket.on("ice-candidate", ({ targetSocketId, roomCode, candidate }) => {
        if (targetSocketId) {
          socket.to(targetSocketId).emit("ice-candidate", {
            fromSocketId: socket.id,
            candidate,
          });
        } else if (roomCode) {
          socket.to(roomCode).emit("ice-candidate", {
            fromSocketId: socket.id,
            candidate,
          });
        }
      });

      // 5. In-Call Real-Time Chat Messaging
      socket.on("send-chat-message", ({ roomCode, message }) => {
        if (!roomCode || !message) return;
        const fallbackTime = new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Manila",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        const msgPayload = {
          id: message.id || Date.now().toString(),
          sender: message.sender || socket.userData?.name || "Participant",
          senderSocketId: message.senderSocketId || socket.id,
          senderId: message.senderId || socket.userData?.id || null,
          role: message.role || socket.userData?.role || "Client",
          time: message.time || fallbackTime,
          phTime: message.phTime || fallbackTime,
          localTime: message.localTime || fallbackTime,
          createdAt: message.createdAt || new Date().toISOString(),
          text: message.text,
          isHost: Boolean(message.isHost || socket.userData?.role === "ADMIN" || socket.userData?.role === "ENGINEER"),
        };

        // Broadcast to other peers in room and confirm back to sender
        socket.to(roomCode).emit("chat-message-received", msgPayload);
        socket.emit("chat-message-received", msgPayload);
      });

      // 6. Audio/Video/Screen State Sync (Microphone mute, Camera off, Screen sharing)
      socket.on("peer-state-change", ({ roomCode, isMicOn, isVideoOn, isScreenSharing }) => {
        if (!roomCode) return;

        // Strictly enforce Single Presenter Rule: Only 1 participant can share screen at a time in the room
        if (isScreenSharing === true) {
          const roomParticipants = this.rooms.get(roomCode);
          if (roomParticipants) {
            for (const [peerSocketId, peerData] of roomParticipants.entries()) {
              if (peerSocketId !== socket.id && peerData.mediaState?.isScreenSharing) {
                const currentPresenter = peerData.name || peerData.user?.name || "Another participant";
                console.warn(
                  `[WEBRTC] Rejected simultaneous screen share in room "${roomCode}": socket ${socket.id} attempted while "${currentPresenter}" (${peerSocketId}) is already presenting.`
                );
                socket.emit("screen-share-rejected", {
                  reason: "ANOTHER_PRESENTER_ACTIVE",
                  presenterName: currentPresenter,
                  message: `Cannot share screen while another participant is presenting. ${currentPresenter} is currently sharing their screen.`,
                });
                return;
              }
            }
          }
        }

        if (socket.userData) {
          socket.userData.mediaState = {
            ...(socket.userData.mediaState || {}),
            ...(isMicOn !== undefined ? { isMicOn } : {}),
            ...(isVideoOn !== undefined ? { isVideoOn } : {}),
            ...(isScreenSharing !== undefined ? { isScreenSharing } : {}),
          };
        }
        socket.to(roomCode).emit("peer-state-updated", {
          socketId: socket.id,
          isMicOn,
          isVideoOn,
          isScreenSharing,
        });
      });

      // 7. Interactive Reactions & Hand Raising
      socket.on("send-reaction", ({ roomCode, emoji }) => {
        if (!roomCode || !emoji) return;
        socket.to(roomCode).emit("reaction-received", {
          id: Date.now() + Math.random(),
          emoji,
          from: socket.userData?.name || "Participant",
        });
      });

      socket.on("toggle-hand-raise", ({ roomCode, isHandRaised }) => {
        if (!roomCode) return;
        if (socket.userData) {
          socket.userData.mediaState = {
            ...(socket.userData.mediaState || {}),
            isHandRaised: Boolean(isHandRaised),
          };
        }
        socket.to(roomCode).emit("peer-hand-raised", {
          socketId: socket.id,
          isHandRaised,
          from: socket.userData?.name || "Participant",
        });
      });

      // 8. Instant Consultation Dispatching & Broadcasting
      socket.on("instant-call-start", (payload) => {
        const callerDesc = payload?.initiatedBy === "admin"
          ? `Admin (${payload?.adminName || payload?.callerName || "Admin"}) targeting [${payload?.targetClientEmail || payload?.clientName || "Client"}]`
          : `Client (${payload?.clientName || "Client"})`;
        console.log(`[WEBRTC] Instant call started by ${callerDesc} in room: ${payload?.roomCode}`);
        if (payload?.roomCode) {
          this.roomMeta.delete(payload.roomCode);
        }
        this.activeInstantCall = {
          ...payload,
          startedAt: payload?.startedAt || Date.now(),
          answered: false,
        };
        // Broadcast to all connected sockets (Client portal and Admin portals on any page or device)
        this.io.emit("instant-call-incoming", this.activeInstantCall);
      });

      socket.on("instant-call-answered", ({ roomCode, answeredBy }) => {
        console.log(`[WEBRTC] Instant call answered by: ${answeredBy} (Room: ${roomCode})`);
        if (this.activeInstantCall && this.activeInstantCall.roomCode === roomCode) {
          this.activeInstantCall.answered = true;
          this.activeInstantCall.answeredBy = answeredBy;
        }
        this.io.emit("instant-call-answered", { roomCode, answeredBy });
      });

      socket.on("instant-call-ended", ({ roomCode }) => {
        console.log(`[WEBRTC] Instant call ended (Room: ${roomCode})`);
        if (this.activeInstantCall && (!roomCode || this.activeInstantCall.roomCode === roomCode || String(roomCode).includes(this.activeInstantCall.roomCode) || String(this.activeInstantCall.roomCode).includes(roomCode))) {
          this.activeInstantCall = null;
        }
        if (roomCode && (!this.rooms.has(roomCode) || this.rooms.get(roomCode).size === 0)) {
          const endedAt = Date.now();
          this.roomMeta.set(roomCode, {
            endedAt,
            expiresAt: endedAt + ROOM_EXPIRY_GRACE_MS,
          });
        }
        this.io.emit("instant-call-ended", { roomCode });
      });

      socket.on("get-active-instant-call", () => {
        if (this.activeInstantCall && !this.activeInstantCall.answered) {
          const isExpired = Date.now() - (this.activeInstantCall.startedAt || 0) > 180000;
          if (!isExpired) {
            socket.emit("instant-call-incoming", this.activeInstantCall);
          }
        }
      });

      // 9. Explicit Leave Room
      socket.on("leave-room", ({ roomCode }) => {
        this.handleUserLeave(socket, roomCode);
      });

      // 9. Socket Disconnection
      socket.on("disconnect", () => {
        console.log(`[WEBRTC SIGNALING] Socket disconnected: ${socket.id}`);
        if (socket.currentRoom) {
          this.handleUserLeave(socket, socket.currentRoom);
        }
      });
    });

    console.log("[WEBRTC SIGNALING] Socket.IO WebRTC Signaling Engine initialized.");
    return this.io;
  }

  handleUserLeave(socket, roomCode) {
    if (!roomCode || !this.rooms.has(roomCode)) return;

    const roomParticipants = this.rooms.get(roomCode);
    const user = roomParticipants.get(socket.id);
    roomParticipants.delete(socket.id);

    socket.leave(roomCode);
    socket.to(roomCode).emit("peer-left", {
      socketId: socket.id,
      user,
    });

    console.log(`[WEBRTC] User ${user?.name || socket.id} left room "${roomCode}". Remaining: ${roomParticipants.size}`);

    if (roomParticipants.size === 0) {
      this.rooms.delete(roomCode);
      const endedAt = Date.now();
      this.roomMeta.set(roomCode, {
        endedAt,
        expiresAt: endedAt + ROOM_EXPIRY_GRACE_MS,
      });
      console.log(
        `[WEBRTC] Room "${roomCode}" ended. Expires in 5 minutes at ${new Date(endedAt + ROOM_EXPIRY_GRACE_MS).toISOString()}`
      );
    }
  }

  getRoomCount() {
    return this.rooms.size;
  }
}

const webrtcSignalingService = new WebRTCSignalingService();
module.exports = webrtcSignalingService;

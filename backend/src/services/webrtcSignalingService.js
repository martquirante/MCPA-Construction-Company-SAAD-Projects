const { Server } = require("socket.io");

/**
 * Enterprise WebRTC Signaling Service for MCPA Construction & Supply
 * 
 * Facilitates peer-to-peer (P2P) video, audio, screen share, and real-time chat
 * between Clients and Engineers/Admins without routing media streams through
 * the server (zero video bandwidth costs).
 */
class WebRTCSignalingService {
  constructor() {
    this.io = null;
    this.rooms = new Map(); // roomCode -> Map(socketId -> { user, role, socketId, joinedAt })
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
      // 1a. Pre-join query for room participant count & capacity check
      socket.on("check-room-capacity", ({ roomCode }) => {
        if (!roomCode) return;
        const currentCount = this.rooms.has(roomCode) ? this.rooms.get(roomCode).size : 0;
        const maxCapacity = 8;
        socket.emit("room-capacity-status", {
          roomCode,
          currentCount,
          maxCapacity,
          isFull: currentCount >= maxCapacity,
        });
      });

      // 1b. Client or Admin joins a consultation room
      socket.on("join-room", ({ roomCode, user = {}, role = "client" }) => {
        if (!roomCode) return;

        if (!this.rooms.has(roomCode)) {
          this.rooms.set(roomCode, new Map());
        }

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
      socket.on("webrtc-offer", ({ targetSocketId, roomCode, sdpOffer, sender }) => {
        if (targetSocketId) {
          socket.to(targetSocketId).emit("webrtc-offer", {
            fromSocketId: socket.id,
            sdpOffer,
            sender: sender || socket.userData,
          });
        } else if (roomCode) {
          socket.to(roomCode).emit("webrtc-offer", {
            fromSocketId: socket.id,
            sdpOffer,
            sender: sender || socket.userData,
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
        console.log(`[WEBRTC] Instant call started by: ${payload?.clientName || "Client"} (Room: ${payload?.roomCode})`);
        this.activeInstantCall = {
          ...payload,
          startedAt: payload?.startedAt || Date.now(),
          answered: false,
        };
        // Broadcast to all connected sockets (all Admins on any page or device)
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
    }
  }

  getRoomCount() {
    return this.rooms.size;
  }
}

const webrtcSignalingService = new WebRTCSignalingService();
module.exports = webrtcSignalingService;

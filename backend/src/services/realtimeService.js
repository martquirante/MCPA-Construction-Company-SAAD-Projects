const { EventEmitter } = require("events");
const { WebSocketServer } = require("ws");

/**
 * Enterprise Real-time Hub for MCPA Construction & Supply
 * 
 * Provides dual real-time transports:
 * 1. Native WebSocket Server (ws:// / wss://) for low-latency bidirectional socket sync.
 * 2. Server-Sent Events (SSE) stream (/api/admin/realtime-stream) for firewall-friendly,
 *    HTTP-proxy compatible push events across Next.js rewrites and cloud hosting.
 */
class RealtimeService extends EventEmitter {
  constructor() {
    super();
    this.sseClients = new Set();
    this.wsClients = new Set();
    this.wss = null;

    // Send periodic SSE keep-alive heartbeat every 20 seconds
    setInterval(() => {
      this.sendSseHeartbeat();
    }, 20000);
  }

  /**
   * Initialize native WebSocket server on the active HTTP server instance
   * @param {import("http").Server} server
   */
  initWebSocket(server) {
    try {
      this.wss = new WebSocketServer({
        server,
        path: "/ws/accounts",
      });

      this.wss.on("connection", (ws, req) => {
        this.wsClients.add(ws);
        console.log(`[REALTIME] WebSocket client connected (${this.wsClients.size} active WS clients)`);

        // Send welcome / acknowledgment
        try {
          ws.send(
            JSON.stringify({
              type: "CONNECTED",
              message: "Connected to MCPA Realtime WebSocket Hub",
              timestamp: Date.now(),
            })
          );
        } catch (e) {}

        ws.on("close", () => {
          this.wsClients.delete(ws);
        });

        ws.on("error", (err) => {
          console.warn("[REALTIME] WebSocket client error:", err.message);
          this.wsClients.delete(ws);
        });

        // Ping-pong for connection liveness
        ws.isAlive = true;
        ws.on("pong", () => {
          ws.isAlive = true;
        });
      });

      // Liveness probe every 30s
      setInterval(() => {
        if (!this.wss) return;
        this.wss.clients.forEach((ws) => {
          if (ws.isAlive === false) return ws.terminate();
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000);

      console.log("[REALTIME] WebSocket Server initialized on /ws/accounts");
    } catch (err) {
      console.error("[REALTIME] Failed to initialize WebSocket server:", err);
    }
  }

  /**
   * Express HTTP handler for Server-Sent Events (SSE)
   * Connects at GET /api/admin/realtime-stream
   */
  handleSseConnection(req, res) {
    // Set headers for standard SSE event streaming
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ status: "LIVE", timestamp: Date.now() })}\n\n`);

    const client = {
      id: Math.random().toString(36).substring(2, 9),
      res,
    };

    this.sseClients.add(client);
    console.log(`[REALTIME] SSE client connected (${this.sseClients.size} active SSE clients)`);

    req.on("close", () => {
      this.sseClients.delete(client);
    });
  }

  sendSseHeartbeat() {
    if (this.sseClients.size === 0) return;
    const comment = `: ping ${Date.now()}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.res.write(comment);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  /**
   * Broadcast an event across both WebSocket and SSE subscribers
   * @param {string} eventType 
   * @param {object} payload 
   */
  broadcast(eventType, payload = {}) {
    const messageObj = {
      type: eventType,
      data: payload,
      timestamp: Date.now(),
    };
    const jsonStr = JSON.stringify(messageObj);

    // 1. Broadcast to WebSocket clients
    for (const ws of this.wsClients) {
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send(jsonStr);
        }
      } catch (err) {
        this.wsClients.delete(ws);
      }
    }

    // 2. Broadcast to SSE clients
    const sseFormatted = `event: ${eventType}\ndata: ${jsonStr}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.res.write(sseFormatted);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }

    // 3. Emit on local process EventEmitter
    this.emit(eventType, payload);
    console.log(`[REALTIME BROADCAST] Event: ${eventType} sent to ${this.wsClients.size} WS & ${this.sseClients.size} SSE clients.`);
  }

  /**
   * Convenience broadcaster for a newly registered client account
   */
  broadcastAccountRegistered(account) {
    this.broadcast("ACCOUNT_REGISTERED", {
      account,
      message: `New client registered: ${account.full_name || account.email}`,
    });
  }

  /**
   * Convenience broadcaster for updated client accounts
   */
  broadcastAccountUpdated(account) {
    this.broadcast("ACCOUNT_UPDATED", {
      account,
      message: `Client account updated: ${account.full_name || account.email}`,
    });
  }

  /**
   * Convenience broadcaster for deleted client accounts
   */
  broadcastAccountDeleted(userId, email) {
    this.broadcast("ACCOUNT_DELETED", {
      userId,
      email,
      message: `Client account removed: ${email}`,
    });
  }

  /**
   * Convenience broadcaster for new consultation inquiries / briefs
   */
  broadcastBriefSubmitted(brief) {
    this.broadcast("BRIEF_SUBMITTED", {
      brief,
      message: `New consultation brief submitted by ${brief.client_name || brief.client_email}`,
    });
  }

  getActiveSubscriberCount() {
    return {
      webSockets: this.wsClients.size,
      sseStreams: this.sseClients.size,
      total: this.wsClients.size + this.sseClients.size,
    };
  }
}

// Export singleton instance
const realtimeService = new RealtimeService();
module.exports = realtimeService;

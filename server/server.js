const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const cors = require("cors");
const queueManager = require("./queueManager");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// ─── Guard against duplicate instances ────────────────────────────────────
// If another WAITLESS server is already running on PORT, exit immediately
// instead of crashing or running as a duplicate.
function handlePortConflict(err) {
  if (err.code === "EADDRINUSE") {
    console.error(`\n⛔  Port ${PORT} is already in use — another WAITLESS instance is running.`);
    console.error(`    Stop the existing process before starting a new one.\n`);
    process.exit(1);
  }
  // Re-throw any other unexpected error
  throw err;
}
server.on("error", handlePortConflict);

const wss = new WebSocket.Server({ server });
// The ws library re-emits the same HTTP server error; suppress duplicates.
wss.on("error", (err) => { if (err.code !== "EADDRINUSE") throw err; });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ─── Two-way lookup: O(1) in both directions ──────────────────────────────
// ws → sessionId  (which session owns this socket)
const clientToSession = new Map();
// sessionId → ws  (which socket to use for targeted sends — O(1) instead of O(N))
const sessionToClient = new Map();

// ─── Broadcast callback ───────────────────────────────────────────────────
// Called by queueManager for every outgoing message.
// Targeted messages (targetSessionId set) go only to that client — O(1).
// Broadcast messages go to all open clients.
queueManager.setBroadcastCallback((message) => {
  if (message.targetSessionId) {
    // O(1) targeted send — no iteration over all clients
    const targetWs = sessionToClient.get(message.targetSessionId);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      // Serialise once, send once
      targetWs.send(JSON.stringify(message));
    }
  } else {
    // True broadcast — serialise once, send to all open clients
    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
});

// ─── WebSocket connection handler ─────────────────────────────────────────
wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);
      handleWsMessage(ws, msg);
    } catch (e) {
      console.error("Invalid WS message:", e);
    }
  });

  ws.on("close", () => {
    // Clean up both maps on disconnect to prevent memory leaks
    const sessionId = clientToSession.get(ws);
    if (sessionId) {
      sessionToClient.delete(sessionId);
    }
    clientToSession.delete(ws);
  });

  ws.on("error", (err) => {
    // Swallow individual socket errors so they don't crash the server
    console.warn("WS client error:", err.message);
  });
});

function registerClient(ws, sessionId) {
  // Remove old session mapping if this socket was previously registered
  const oldSessionId = clientToSession.get(ws);
  if (oldSessionId && oldSessionId !== sessionId) {
    sessionToClient.delete(oldSessionId);
  }
  clientToSession.set(ws, sessionId);
  sessionToClient.set(sessionId, ws);
}

function handleWsMessage(ws, msg) {
  switch (msg.action) {
    case "JOIN_QUEUE": {
      const session = queueManager.createSession(msg.name);
      registerClient(ws, session.sessionId);
      ws.send(JSON.stringify({ type: "SESSION_CREATED", session }));
      break;
    }

    case "RECOVER_SESSION": {
      const session = queueManager.getSession(msg.sessionId);
      if (session) {
        registerClient(ws, session.sessionId);
        ws.send(JSON.stringify({ type: "SESSION_RESTORED", session }));
      } else {
        ws.send(JSON.stringify({ type: "SESSION_NOT_FOUND" }));
      }
      break;
    }

    case "EXIT_QUEUE": {
      const sessionId = msg.sessionId || clientToSession.get(ws);
      if (sessionId) {
        const exitData = queueManager.exitQueue(sessionId);
        ws.send(JSON.stringify({ type: "EXIT_CONFIRMED", exitData }));
      }
      break;
    }

    case "RECORD_ACTIVITY": {
      const sessionId = msg.sessionId || clientToSession.get(ws);
      if (sessionId && msg.gameName) {
        queueManager.recordActivity(sessionId, msg.gameName, !!msg.completed);
      }
      break;
    }

    case "GET_WHY_WAITING": {
      const answer = queueManager.getRandomWhyAnswer();
      ws.send(JSON.stringify({ type: "WHY_WAITING_RESPONSE", answer }));
      break;
    }

    case "PING": {
      ws.send(JSON.stringify({ type: "PONG" }));
      break;
    }

    default:
      break;
  }
}

// ─── REST Endpoints ───────────────────────────────────────────────────────
app.post("/api/queue/join", (req, res) => {
  const name = req.body.name || "Anonymous Waiter";
  const session = queueManager.createSession(name);
  res.json({ success: true, session });
});

app.get("/api/session/:id", (req, res) => {
  const session = queueManager.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({ session });
});

app.post("/api/session/:id/exit", (req, res) => {
  const exitData = queueManager.exitQueue(req.params.id);
  if (!exitData) return res.status(404).json({ error: "Session not found" });
  res.json({ success: true, exitData });
});

app.post("/api/session/:id/activity", (req, res) => {
  const { gameName, completed } = req.body;
  const session = queueManager.recordActivity(req.params.id, gameName, completed);
  res.json({ success: true, session });
});

app.get("/api/why-waiting", (req, res) => {
  res.json({ answer: queueManager.getRandomWhyAnswer() });
});

app.get("/api/former-waiters", (req, res) => {
  res.json({ formerWaiters: queueManager.getFormerWaiters() });
});

// Fallback for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`WAITLESS is running on http://localhost:${PORT}`);
  console.log(`Tagline: "Please wait. For absolutely nothing."`);
  console.log(`========================================`);
});

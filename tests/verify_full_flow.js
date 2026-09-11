const http = require("http");
const WebSocket = require("ws");
const express = require("express");
const path = require("path");
const queueManager = require("../server/queueManager");

console.log("=== COMPREHENSIVE END-TO-END FLOW VERIFICATION ===");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

app.use(express.static(path.join(__dirname, "..", "public")));

queueManager.setBroadcastCallback((message) => {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (message.targetSessionId) {
        if (clients.get(client) === message.targetSessionId) {
          client.send(data);
        }
      } else {
        client.send(data);
      }
    }
  });
});

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    if (msg.action === "JOIN_QUEUE") {
      const session = queueManager.createSession(msg.name);
      clients.set(ws, session.sessionId);
      ws.send(JSON.stringify({ type: "SESSION_CREATED", session }));
    } else if (msg.action === "RECORD_ACTIVITY") {
      const sessionId = clients.get(ws);
      queueManager.recordActivity(sessionId, msg.gameName, msg.completed);
    } else if (msg.action === "EXIT_QUEUE") {
      const sessionId = clients.get(ws);
      const exitData = queueManager.exitQueue(sessionId);
      ws.send(JSON.stringify({ type: "EXIT_CONFIRMED", exitData }));
    }
  });
});

const PORT = 3005;
server.listen(PORT, () => {
  console.log(`Test server active on port ${PORT}`);

  // 1. Verify HTTP GET /
  http.get(`http://localhost:${PORT}/`, (res) => {
    console.log(`[HTTP Test] Status: ${res.statusCode}`);
    if (res.statusCode !== 200) {
      console.error("HTTP GET failed!");
      process.exit(1);
    }
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => {
      console.log(`[HTTP Test] Received index.html (${body.length} bytes)`);
      if (!body.includes("screen-landing") || !body.includes("screen-dashboard")) {
        console.error("FAIL: Incomplete index.html!");
        process.exit(1);
      }
      console.log("PASS: Static frontend serving verified.");

      // 2. WebSocket Flow
      testWebSocketClient();
    });
  });
});

function testWebSocketClient() {
  const ws = new WebSocket(`ws://localhost:${PORT}`);

  ws.on("open", () => {
    console.log("[WS Test] Connected to server.");
    ws.send(JSON.stringify({ action: "JOIN_QUEUE", name: "Subhana" }));
  });

  let createdSessionId = null;

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    
    if (msg.type === "SESSION_CREATED") {
      console.log("[WS Test] Session Created:");
      console.log(`  - Name: ${msg.session.name}`);
      console.log(`  - Duration: ${msg.session.actualWaitDuration}s (<= 60s)`);
      console.log(`  - Personality: ${msg.session.personality}`);
      console.log(`  - Initial Position: #${msg.session.currentPosition}`);
      createdSessionId = msg.session.sessionId;

      if (msg.session.actualWaitDuration > 60 || msg.session.actualWaitDuration < 1) {
        console.error("FAIL: Duration exceeds PRD bounds!");
        process.exit(1);
      }

      // Record mini-game activities
      ws.send(JSON.stringify({ action: "RECORD_ACTIVITY", gameName: "click100", completed: true }));
      ws.send(JSON.stringify({ action: "RECORD_ACTIVITY", gameName: "coinFlip", completed: false }));

      // Fast-forward session to trigger authoritative completion
      setTimeout(() => {
        const s = queueManager.getSession(createdSessionId);
        s.joinedAt = Date.now() - (s.actualWaitDuration * 1000 + 500);
        // Next tick triggers completion
      }, 1500);
    }

    if (msg.type === "SESSION_COMPLETED") {
      console.log("[WS Test] Session Completed Event Received!");
      console.log(`  - Final Position: #${msg.finalReport.finalPosition}`);
      console.log(`  - Purpose Accomplished: ${msg.finalReport.purposeAccomplished}`);
      console.log(`  - Certificate Name: ${msg.certificate.userName}`);
      console.log(`  - Certificate ID: ${msg.certificate.certificateId}`);

      if (msg.finalReport.purposeAccomplished !== "0%") {
        console.error("FAIL: Purpose accomplished is not 0%!");
        process.exit(1);
      }

      if (msg.finalReport.finalPosition !== 1) {
        console.error("FAIL: Final position is not #1!");
        process.exit(1);
      }

      console.log("\n>>> FULL END-TO-END FLOW VERIFIED SUCCESSFULLY! <<<");
      ws.close();
      server.close();
      process.exit(0);
    }
  });
}

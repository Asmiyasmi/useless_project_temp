const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const queueManager = require("../server/queueManager");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

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
    } else if (msg.action === "RECOVER_SESSION") {
      const session = queueManager.getSession(msg.sessionId);
      if (session) {
        clients.set(ws, session.sessionId);
        ws.send(JSON.stringify({ type: "SESSION_RESTORED", session }));
      }
    } else if (msg.action === "GET_WHY_WAITING") {
      ws.send(JSON.stringify({ type: "WHY_WAITING_RESPONSE", answer: queueManager.getRandomWhyAnswer() }));
    }
  });
});

server.listen(3001, () => {
  console.log("Test WS server listening on 3001");
  const ws = new WebSocket("ws://localhost:3001");

  ws.on("open", () => {
    console.log("[E2E] Connected to WS server.");
    ws.send(JSON.stringify({ action: "JOIN_QUEUE", name: "E2E Tester" }));
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    console.log(`[E2E Received] ${msg.type}`);
    if (msg.type === "SESSION_CREATED") {
      console.log(`- Created session: ${msg.session.sessionId}, Pos: #${msg.session.currentPosition}`);
      ws.send(JSON.stringify({ action: "GET_WHY_WAITING" }));
    } else if (msg.type === "WHY_WAITING_RESPONSE") {
      console.log(`- Why response: "${msg.answer}"`);
      console.log("\n>>> WEBSOCKET E2E TEST COMPLETED SUCCESSFULLY! <<<");
      ws.close();
      server.close();
      process.exit(0);
    }
  });
});

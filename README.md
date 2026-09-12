TEAM NAME:ECHO
TEAM MEMBERS:SHEMEEM SHAJAHAN,ASMIYA H
# WAITLESS 🕐

> **"Please wait. For absolutely nothing."**

A satirical queue management system that makes you wait for something completely pointless — and somehow makes you enjoy every second of it.

Built for [tinkerhub/useless_project_temp](https://github.com/tinkerhub/useless_project_temp) hackathon.

---

## What is WAITLESS?

WAITLESS is a fully functional, server-authoritative, real-time queue simulator where users join a virtual line, endure chaos, play 14 pointless mini-games while they wait, and are finally "served" — only to discover the purpose accomplished was **0%**.

The maximum wait time is **60 seconds**. The server decides when you're done. You do not.

---

## Features

- 🧍 **Real-time multiplayer queue** with live position updates via WebSocket
- 🌀 **Queue chaos engine** — your position jumps randomly with absurd reasons
- 🎮 **14 mini-games** to play while waiting (Click 100 Times, Reaction Test, RPS, Coin Flip, Don't Press The Button, and more)
- 🧠 **5 personality types** assigned at join (The Overthinker, The Zen Master, The Complainer, The Optimist, The Existentialist)
- 📉 **Patience decay** tracked live on your dashboard
- 🤡 **Fake ETA fluctuations** and absurd announcements
- 🏆 **Waiting Report & Certificate** — a printable PDF-ready certificate of your suffering
- 🔁 **Session recovery** — refresh the page and rejoin your queue position
- 🔊 **Web Audio API** synthesized sound effects (no external audio files)

---

## Screens

| Screen | Description |
|--------|-------------|
| 🏠 Landing Page | Enter your name and the reason you're waiting |
| 🧍 Join Queue | Confirm your spot and meet your personality |
| ⏳ Waiting Dashboard | Live queue position, mini-games, chaos events |
| 😬 Personality & Exit Modals | In-depth personality breakdown + exit confirmation |
| 👴 Former Waiter Hall of Fame | Legends who waited before you |
| 🎉 Final Reveal & Completion | The grand reveal that nothing was accomplished |
| 📄 Waiting Report & Certificate | Printable certificate of your wait |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Real-time | WebSocket (`ws` library) |
| Frontend | Vanilla JS SPA |
| Styling | Tailwind CSS (CDN) |
| Fonts | JetBrains Mono, Space Grotesk, Cinzel |
| Audio | Web Audio API (synthesized) |
| Storage | In-memory (no database needed) |

---

## Getting Started

### Prerequisites

- Node.js v18+ installed
- npm v8+

### Installation

```bash
git clone https://github.com/tinkerhub/useless_project_temp.git
cd useless_project_temp
npm install
```

### Running the App

```bash
npm start
```

Open your browser to: **http://localhost:3000**

### Running Tests

```bash
npm test
```

All unit + WebSocket E2E tests should pass.

---

## Project Structure

```
useless/
├── server/
│   ├── server.js          # Express HTTP + WebSocket server
│   └── queueManager.js    # Singleton queue engine (sessions, chaos, timers)
├── public/
│   ├── index.html         # 7-screen SPA
│   ├── app.js             # WebSocket client, screen router, session restore
│   └── minigames.js       # All 14 mini-games
├── tests/
│   ├── test_system.js         # Unit tests
│   ├── test_websocket_e2e.js  # WebSocket connection tests
│   └── verify_full_flow.js    # Full E2E flow test
├── package.json
└── README.md
```

---

## How It Works

1. User submits their name + reason for waiting → **server creates a session**
2. Server assigns a **random authoritative wait duration** (5–60 seconds) — the client never knows how long
3. Every second, the server ticks:
   - May randomly shuffle queue positions (with satirical reasons)
   - Decays patience score
   - Fluctuates fake ETA
   - Broadcasts announcements
4. When the server-side timer expires → `SESSION_COMPLETED` event fires
5. User sees the final reveal: **0% purpose accomplished**, certificate generated

> **WAIT AGAIN** always returns to the landing page. It never auto-creates a new session.

---

## Rules (Hardcoded, Non-negotiable)

- ⏱️ Max wait: **60 seconds** (server authoritative)
- 📉 Purpose accomplished: **always 0%**
- 🔁 "Wait Again": returns to landing page only
- 🧩 Sessions are in-memory only — server restart clears all sessions

---

## Certificate Serial Number Format

```
CERT-{6-CHAR-HEX}
```

Example: `CERT-A3F7B2`

---

## Team

Built with ✨ unnecessary dedication ✨ for a completely useless purpose.

*Hackathon: TinkerHub Useless Projects*

---

## License

MIT — feel free to wait with this code as long as you like.

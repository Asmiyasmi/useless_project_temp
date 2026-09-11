/**
 * WAITLESS - Core Client Application
 * Supports both Live WebSocket mode (Node.js backend) and
 * Autonomous Standalone Simulation mode (Static HTTP / python -m http.server).
 * Handles Screen Routing, Sound FX, Modals, State Restoration,
 * Live Queue Roster, Queue Chaos, Ornamental ETAs, and 17 Activities.
 */

const PERSONALITIES = [
  { name: "The Patient One", description: "Breathes deeply. Convinced waiting builds spiritual resilience." },
  { name: "The Impatient", description: "Continuously refreshes. Wonders why the digits aren't moving faster." },
  { name: "The Confused", description: "Not entirely sure how they ended up here, but committed to staying." },
  { name: "The Optimist", description: "Believes something life-changing awaits at position #1." },
  { name: "The Professional Waiter", description: "Has waited in queues since childhood. Treats this as a career." }
];

const ANNOUNCEMENTS = [
  "Please continue waiting.",
  "Waiting is proceeding normally.",
  "There is currently no important information.",
  "Your patience has been acknowledged.",
  "Please remain available for absolutely nothing.",
  "Queue position changes may occur arbitrarily.",
  "A reminder that leaving the queue will result in missing absolutely nothing.",
  "Your estimated wait time is purely ornamental.",
  "System efficiency has plateaued at zero.",
  "Thank you for participating in structured boredom."
];

const CHAOS_REASONS = [
  "Administrative issue detected.",
  "Someone has been promoted.",
  "Queue updated.",
  "Please do not question the queue.",
  "System adjustment.",
  "VIP nothingness pass used ahead of you.",
  "Server took a philosophical breath.",
  "Re-indexed priority in descending ambiguity."
];

const WHY_WAITING_ANSWERS = [
  "Because you joined.",
  "Because the queue exists.",
  "We don't know either.",
  "That's an excellent question.",
  "Please continue waiting.",
  "To experience the raw essence of passage of time.",
  "Because somewhere, a database needs an active row."
];

const INITIAL_FORMER_WAITERS = [
  { id: "fw-1", name: "Miya",   waitedSeconds: 23, lastPosition: 5, personality: "The Patient One",         patienceLevel: 72, exitedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "fw-2", name: "Arjun",  waitedSeconds: 41, lastPosition: 3, personality: "The Professional Waiter", patienceLevel: 61, exitedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "fw-3", name: "Devika", waitedSeconds: 15, lastPosition: 8, personality: "The Confused",             patienceLevel: 89, exitedAt: new Date(Date.now() - 900000).toISOString() },
  { id: "fw-4", name: "Kiran",  waitedSeconds: 52, lastPosition: 2, personality: "The Optimist",             patienceLevel: 44, exitedAt: new Date(Date.now() - 300000).toISOString() }
];

class WaitlessClient {
  constructor() {
    this.ws = null;
    this.isStandalone = false;
    this.currentScreen = "screen-landing";
    this.session = null;
    this.soundEnabled = true;
    this.audioCtx = null;
    this.reconnectAttempts = 0;
    this.activitiesPanel = false;
    this.simInterval = null;
    this.formerWaiters = [...INITIAL_FORMER_WAITERS];
    this.simulatedRoster = [];

    this.init();
  }

  init() {
    this.initAudio();
    this.setupEventListeners();
    if (window.Activities) {
      window.Activities.init();
    }

    // Determine mode: Port 3000 indicates the custom Node.js server.
    // Any other port (e.g. 5500 for Python http.server) or file:// uses Standalone Simulation.
    const isNodeServer = window.location.port === "3000";
    if (isNodeServer) {
      this.connectWebSocket();
    } else {
      this.enableStandaloneMode();
    }
  }

  // -------------------------------------------------------
  // AUDIO SYNTHESIS (Web Audio API)
  // -------------------------------------------------------
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext not supported:", e);
    }
  }

  playSfx(type) {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    switch(type) {
      case "click":
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case "chaos":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case "chime":
        osc.type = "sine";
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case "fanfare":
        [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.type = "triangle";
          o.frequency.setValueAtTime(f, now + idx * 0.12);
          g.gain.setValueAtTime(0.15, now + idx * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
          o.start(now + idx * 0.12);
          o.stop(now + idx * 0.12 + 0.45);
        });
        break;
    }
  }

  // -------------------------------------------------------
  // STANDALONE SIMULATION MODE
  // -------------------------------------------------------
  enableStandaloneMode() {
    this.isStandalone = true;
    this.updateStatusIndicator("online");
    this.initLandingStats();
    this.checkSavedSession();
  }

  initLandingStats() {
    this.updateGlobalQueueStats({
      activeWaitersCount: 14,
      formerWaitersCount: this.formerWaiters.length,
      recentFormerWaiters: this.formerWaiters.slice(0, 5)
    });
  }

  checkSavedSession() {
    const saved = localStorage.getItem("waitless_sessionId");
    const savedData = localStorage.getItem("waitless_sessionData");
    if (saved && savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.status === "WAITING") {
          const elapsedSoFar = Math.floor((Date.now() - parsed.joinedAt) / 1000);
          if (elapsedSoFar < parsed.actualWaitDuration) {
            this.session = parsed;
            this.showScreen("screen-dashboard");
            this.initDashboard();
            this.startSimulationTick();
            return;
          }
        }
      } catch (e) {
        // Corrupted session
      }
    }
    localStorage.removeItem("waitless_sessionId");
    localStorage.removeItem("waitless_sessionData");
    this.showScreen("screen-landing");
  }

  createStandaloneSession(name) {
    const sessionId = "sess_" + Math.random().toString(16).substring(2, 10);
    const userId = "usr_" + Math.random().toString(16).substring(2, 8);
    // Responsive wait time between 25 and 45s (guaranteed <= 120s)
    const actualWaitDuration = Math.floor(Math.random() * 20) + 25;
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    const initialPos = Math.floor(Math.random() * 6) + 6; // starts at position 6 to 11

    const session = {
      userId,
      name: name.trim() || "Anonymous Waiter",
      sessionId,
      status: "WAITING",
      joinedAt: Date.now(),
      actualWaitDuration,
      currentPosition: initialPos,
      positionsExperienced: [initialPos],
      personality: personality.name,
      personalityDetails: personality,
      patienceLevel: 100,
      patienceStatus: "Completely fine.",
      fakeEtaSeconds: Math.floor(Math.random() * 25) + 15,
      activitiesUsed: [],
      activitiesCompleted: 0,
      chaosEvents: 0,
      chaosHistory: [],
      announcementsReceived: 0,
      lastAnnouncement: "You have entered the queue. Welcome to nothing.",
      exitedAt: null,
      completedAt: null,
      finalReport: null
    };

    this.session = session;
    this.buildSimulatedRoster();
    localStorage.setItem("waitless_sessionId", session.sessionId);
    localStorage.setItem("waitless_sessionData", JSON.stringify(session));

    this.handleMessage({ type: "SESSION_CREATED", session });
    this.startSimulationTick();
  }

  buildSimulatedRoster() {
    const mockNames = [
      "Sarah C.", "Marcus T.", "Elena R.", "Aiden W.",
      "Devon K.", "Chloe B.", "Priya N.", "Liam S.",
      "Maya L.", "Zoe K.", "Noah B.", "Harper M."
    ];
    this.simulatedRoster = [];
    let nameIdx = 0;
    const myPos = this.session ? this.session.currentPosition : 7;
    const totalCount = Math.max(myPos + 4, 12);

    for (let pos = 1; pos <= totalCount; pos++) {
      if (pos === myPos && this.session) {
        this.simulatedRoster.push({
          sessionId: this.session.sessionId,
          name: this.session.name,
          position: pos
        });
      } else {
        this.simulatedRoster.push({
          sessionId: "sim_" + pos,
          name: mockNames[nameIdx % mockNames.length],
          position: pos
        });
        nameIdx++;
      }
    }
  }

  startSimulationTick() {
    this.stopSimulationTick();
    this.simInterval = setInterval(() => this.simulationTick(), 1000);
  }

  stopSimulationTick() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
  }

  simulationTick() {
    if (!this.session || this.session.status !== "WAITING") {
      this.stopSimulationTick();
      return;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - this.session.joinedAt) / 1000);
    const remaining = this.session.actualWaitDuration - elapsed;

    // 1. Patience gradual decline
    const decayRatio = Math.min(1, elapsed / this.session.actualWaitDuration);
    this.session.patienceLevel = Math.max(12, Math.round(100 - (decayRatio * 55) - (Math.random() * 6)));
    this.session.patienceStatus =
      this.session.patienceLevel >= 80 ? "Completely fine." :
      this.session.patienceLevel >= 60 ? "Still surprisingly calm." :
      this.session.patienceLevel >= 40 ? "Mild concern detected." :
                                         "Patience is becoming questionable.";

    // 2. Check for completion
    if (remaining <= 0) {
      this.completeStandaloneSession();
      return;
    }

    // 3. Fake ETA fluctuation
    if (Math.random() < 0.35) {
      const fakeDelta = Math.floor(Math.random() * 11) - 5;
      this.session.fakeEtaSeconds = Math.max(3, this.session.fakeEtaSeconds + fakeDelta);
    }

    // 4. Queue Chaos Event (~22% chance per tick)
    if (Math.random() < 0.22 && this.session.currentPosition > 1 && remaining > 4) {
      const oldPos = this.session.currentPosition;
      let delta;
      if (remaining <= 7) {
        delta = -Math.max(1, Math.floor(oldPos / 2));
      } else {
        delta = Math.random() < 0.45
          ? (Math.floor(Math.random() * 3) + 1)
          : -(Math.floor(Math.random() * 3) + 1);
      }
      let newPos = Math.max(2, oldPos + delta);
      if (newPos === oldPos) newPos = oldPos > 2 ? oldPos - 1 : oldPos + 1;

      const reason = CHAOS_REASONS[Math.floor(Math.random() * CHAOS_REASONS.length)];
      this.session.currentPosition = newPos;
      this.session.chaosEvents += 1;
      this.session.positionsExperienced.push(newPos);

      this.handleMessage({
        type: "QUEUE_CHAOS",
        position: newPos,
        previousPosition: oldPos,
        reason,
        chaosEvents: this.session.chaosEvents
      });
      this.buildSimulatedRoster();
    } else if (remaining <= 6 && this.session.currentPosition > 2) {
      // Natural progression toward #1 in the final moments
      this.session.currentPosition = Math.max(2, this.session.currentPosition - 1);
      this.session.positionsExperienced.push(this.session.currentPosition);
      this.buildSimulatedRoster();
    }

    // 5. Random Announcement (~18% chance per tick)
    if (Math.random() < 0.18) {
      const ann = ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)];
      this.session.announcementsReceived += 1;
      this.session.lastAnnouncement = ann;
      this.handleMessage({
        type: "ANNOUNCEMENT",
        message: ann,
        totalAnnouncements: this.session.announcementsReceived
      });
    }

    // 6. Session tick update
    this.handleMessage({
      type: "SESSION_TICK",
      currentPosition: this.session.currentPosition,
      patienceLevel: this.session.patienceLevel,
      patienceStatus: this.session.patienceStatus,
      fakeEtaSeconds: this.session.fakeEtaSeconds,
      elapsedSeconds: elapsed
    });

    // 7. Keep roster and local storage updated
    this.renderQueueRoster(this.simulatedRoster, this.simulatedRoster.length);
    localStorage.setItem("waitless_sessionData", JSON.stringify(this.session));
  }

  completeStandaloneSession() {
    this.stopSimulationTick();
    const session = this.session;
    session.status = "COMPLETED";
    session.currentPosition = 1;
    session.positionsExperienced.push(1);
    session.completedAt = Date.now();
    session.actualTimeWaited = Math.max(1, Math.round((session.completedAt - session.joinedAt) / 1000));

    const finalReport = {
      name: session.name,
      sessionId: session.sessionId,
      actualWaitingTime: session.actualTimeWaited,
      finalPosition: 1,
      positionsExperienced: Array.from(new Set(session.positionsExperienced)),
      chaosEvents: session.chaosEvents,
      announcements: session.announcementsReceived,
      activitiesUsed: session.activitiesUsed,
      activitiesCompleted: session.activitiesCompleted,
      finalPatienceLevel: session.patienceLevel,
      patienceStatus: session.patienceStatus,
      personality: session.personality,
      personalityDetails: session.personalityDetails,
      purposeAccomplished: "0%", // STRICT REQUIREMENT: Always 0%
      completedAt: new Date(session.completedAt).toISOString()
    };

    const certificate = {
      userName: session.name,
      sessionId: session.sessionId,
      waitingDuration: session.actualTimeWaited,
      personality: session.personality,
      completionDate: new Date(session.completedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      }),
      certificateId: "CERT-" + session.sessionId.replace("sess_", "").toUpperCase()
    };

    session.finalReport = finalReport;
    session.certificate = certificate;
    localStorage.removeItem("waitless_sessionId");
    localStorage.removeItem("waitless_sessionData");

    this.handleMessage({
      type: "SESSION_COMPLETED",
      session,
      finalReport,
      certificate
    });
  }

  // -------------------------------------------------------
  // WEBSOCKET HANDLING (for Node.js environment)
  // -------------------------------------------------------
  connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    try {
      this.ws = new WebSocket(`${protocol}//${host}`);
    } catch (err) {
      console.warn("WebSocket could not be initialized; switching to Standalone mode:", err);
      this.enableStandaloneMode();
      return;
    }

    this.ws.onopen = () => {
      this.isStandalone = false;
      this.updateStatusIndicator("online");
      this.reconnectAttempts = 0;

      const savedSessionId = localStorage.getItem("waitless_sessionId");
      if (savedSessionId) {
        this.sendWs({ action: "RECOVER_SESSION", sessionId: savedSessionId });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (err) {
        console.error("WS Parse error:", err);
      }
    };

    this.ws.onclose = () => {
      if (window.location.port !== "3000") {
        this.enableStandaloneMode();
        return;
      }
      this.updateStatusIndicator("offline");
      const delay = Math.min(5000, 1000 * Math.pow(1.5, this.reconnectAttempts++));
      setTimeout(() => this.connectWebSocket(), delay);
    };

    this.ws.onerror = () => {
      this.enableStandaloneMode();
    };
  }

  sendWs(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // -------------------------------------------------------
  // MESSAGE BUS & STATE DISPATCH
  // -------------------------------------------------------
  handleMessage(msg) {
    switch(msg.type) {
      case "QUEUE_UPDATE":
        this.updateGlobalQueueStats(msg);
        break;

      case "SESSION_CREATED":
        this.session = msg.session;
        localStorage.setItem("waitless_sessionId", this.session.sessionId);
        this.showScreen("screen-dashboard");
        this.initDashboard();
        break;

      case "SESSION_RESTORED":
        this.session = msg.session;
        if (this.session.status === "WAITING") {
          this.showScreen("screen-dashboard");
          this.initDashboard();
        } else if (this.session.status === "COMPLETED") {
          this.showCompletion(this.session.finalReport, this.session.certificate);
        } else if (this.session.status === "FORMER_WAITER") {
          this.showFormerWaiterScreen(this.session);
        }
        break;

      case "SESSION_NOT_FOUND":
        localStorage.removeItem("waitless_sessionId");
        localStorage.removeItem("waitless_sessionData");
        this.showScreen("screen-landing");
        break;

      case "SESSION_TICK":
        this.handleSessionTick(msg);
        break;

      case "QUEUE_CHAOS":
        this.handleQueueChaos(msg);
        break;

      case "ANNOUNCEMENT":
        this.handleAnnouncement(msg);
        break;

      case "SESSION_COMPLETED":
        this.showCompletion(msg.finalReport, msg.certificate);
        break;

      case "EXIT_CONFIRMED":
        this.showFormerWaiterScreen(msg.exitData);
        break;

      case "WHY_WAITING_RESPONSE":
        this.displayWhyWaitingAnswer(msg.answer);
        break;
    }
  }

  updateStatusIndicator(status) {
    const el = document.getElementById("connection-status");
    if (!el) return;
    if (status === "online") {
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span> LIVE QUEUE`;
      el.className = "text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center";
    } else {
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 inline-block mr-1.5"></span> RECONNECTING...`;
      el.className = "text-xs font-mono px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 flex items-center";
    }
  }

  updateGlobalQueueStats(data) {
    const waitCountEls = document.querySelectorAll(".live-waiter-count");
    waitCountEls.forEach(el => el.innerText = data.activeWaitersCount || 14);

    const formerCountEls = document.querySelectorAll(".former-waiter-count");
    formerCountEls.forEach(el => el.innerText = data.formerWaitersCount || this.formerWaiters.length);

    if (data.recentFormerWaiters && data.recentFormerWaiters.length > 0) {
      this.renderRecentFormerWaiters(data.recentFormerWaiters);
    } else {
      this.renderRecentFormerWaiters(this.formerWaiters.slice(0, 5));
    }

    if (data.activeRoster) {
      this.renderQueueRoster(data.activeRoster, data.activeWaitersCount);
    } else if (this.simulatedRoster.length > 0) {
      this.renderQueueRoster(this.simulatedRoster, this.simulatedRoster.length);
    }
  }

  renderRecentFormerWaiters(list) {
    const ticker = document.getElementById("former-waiters-ticker");
    if (!ticker) return;
    ticker.innerHTML = list.map(fw => `
      <div class="inline-flex items-center space-x-2 px-3 py-1 bg-zinc-800/80 border border-zinc-700 rounded-full text-xs text-zinc-300">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span class="font-bold text-white">${fw.name}</span>
        <span class="text-zinc-400">waited ${fw.waitedSeconds}s (${fw.personality})</span>
      </div>
    `).join("");
  }

  renderQueueRoster(roster, totalCount) {
    const listEl = document.getElementById("queue-roster-list");
    const countEl = document.getElementById("queue-roster-count");
    if (!listEl) return;

    if (countEl) {
      countEl.innerText = `${totalCount} waiting`;
    }

    if (!roster || roster.length === 0) {
      listEl.innerHTML = `<div class="px-4 py-3 text-xs text-zinc-500 italic text-center">No one in queue.</div>`;
      return;
    }

    const mySessionId = this.session ? this.session.sessionId : null;
    listEl.innerHTML = roster.map(waiter => {
      const isMe = waiter.sessionId === mySessionId;
      return `
        <div class="px-4 py-2.5 flex items-center justify-between ${isMe ? "bg-amber-400/5 border-l-2 border-amber-400" : ""}">
          <div class="flex items-center space-x-2">
            <span class="font-mono text-xs ${isMe ? "text-amber-400 font-bold" : "text-zinc-500"}">#${waiter.position}</span>
            <span class="font-medium text-sm ${isMe ? "text-white" : "text-zinc-300"}">${waiter.name}${isMe ? " (you)" : ""}</span>
          </div>
          ${isMe ? '<span class="text-[10px] font-mono text-amber-400/70 uppercase tracking-wider">● you</span>' : '<span class="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block"></span>'}
        </div>
      `;
    }).join("");
  }

  // -------------------------------------------------------
  // NAVIGATION & SCREEN SWITCHING
  // -------------------------------------------------------
  showScreen(screenId) {
    document.querySelectorAll(".screen-container").forEach(el => el.classList.add("hidden"));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove("hidden");
      this.currentScreen = screenId;
      window.scrollTo(0, 0);
    }
  }

  // -------------------------------------------------------
  // SCREEN 1 & 2: LANDING & JOIN QUEUE
  // -------------------------------------------------------
  startJoinQueue() {
    this.playSfx("click");
    this.showScreen("screen-join");
  }

  submitJoinQueue(e) {
    if (e) e.preventDefault();
    this.playSfx("click");
    const nameInput = document.getElementById("waiter-name-input");
    const name = nameInput ? nameInput.value.trim() : "Anonymous Waiter";

    const sent = this.sendWs({
      action: "JOIN_QUEUE",
      name: name || "Anonymous Waiter"
    });

    if (!sent) {
      this.createStandaloneSession(name || "Anonymous Waiter");
    }
  }

  // -------------------------------------------------------
  // SCREEN 3: DASHBOARD LOGIC
  // -------------------------------------------------------
  initDashboard() {
    if (!this.session) return;
    document.getElementById("dashboard-user-name").innerText = this.session.name;
    document.getElementById("dashboard-personality-tag").innerText = this.session.personality;
    this.updatePositionDisplay(this.session.currentPosition);
    this.updatePatienceBar(this.session.patienceLevel, this.session.patienceStatus);
    this.updateFakeEta(this.session.fakeEtaSeconds);
    this.showMainView();
  }

  showMainView() {
    const main = document.getElementById("dashboard-main-view");
    const panel = document.getElementById("dashboard-activities-panel");
    if (main) main.classList.remove("hidden");
    if (panel) panel.classList.add("hidden");
    this.activitiesPanel = false;
  }

  updatePositionDisplay(pos) {
    const el = document.getElementById("dashboard-pos-num");
    if (el) el.innerText = "#" + pos;
    const actPos = document.getElementById("activity-pos-display");
    if (actPos) actPos.innerText = "#" + pos;
  }

  updatePatienceBar(level, status) {
    const bar = document.getElementById("dashboard-patience-bar");
    const pct = document.getElementById("dashboard-patience-pct");
    const label = document.getElementById("dashboard-patience-label");
    if (bar) bar.style.width = level + "%";
    if (pct) pct.innerText = level + "%";
    if (label) label.innerText = status;
    const actPat = document.getElementById("activity-patience-display");
    if (actPat) actPat.innerText = level + "%";
  }

  updateFakeEta(sec) {
    const el = document.getElementById("dashboard-fake-eta");
    if (!el) return;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    el.innerText = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  handleSessionTick(msg) {
    this.updatePositionDisplay(msg.currentPosition);
    this.updatePatienceBar(msg.patienceLevel, msg.patienceStatus);
    this.updateFakeEta(msg.fakeEtaSeconds);
    if (this.session) {
      this.session.currentPosition = msg.currentPosition;
      this.session.patienceLevel = msg.patienceLevel;
      this.session.patienceStatus = msg.patienceStatus;
    }
  }

  handleQueueChaos(msg) {
    this.playSfx("chaos");
    this.updatePositionDisplay(msg.position);

    const toast = document.getElementById("chaos-toast");
    const reasonEl = document.getElementById("chaos-reason");
    const posShiftEl = document.getElementById("chaos-pos-shift");

    if (toast && reasonEl) {
      reasonEl.innerText = `"${msg.reason}"`;
      if (posShiftEl) {
        const diff = msg.position - msg.previousPosition;
        const sign = diff > 0 ? `+${diff} (Pushed Back)` : `${diff} (Advanced)`;
        posShiftEl.innerText = `#${msg.previousPosition} → #${msg.position} [${sign}]`;
      }
      toast.classList.remove("hidden");
      toast.classList.add("animate-bounce");
      setTimeout(() => toast.classList.remove("animate-bounce"), 1000);
      setTimeout(() => toast.classList.add("hidden"), 4500);
    }
  }

  handleAnnouncement(msg) {
    this.playSfx("chime");
    const banner = document.getElementById("announcement-text");
    if (banner) {
      banner.innerText = msg.message;
      banner.classList.add("text-amber-400");
      setTimeout(() => banner.classList.remove("text-amber-400"), 1000);
    }
  }

  // -------------------------------------------------------
  // MODALS (SCREEN 4)
  // -------------------------------------------------------
  openPersonalityModal() {
    this.playSfx("click");
    if (!this.session) return;
    document.getElementById("modal-pers-title").innerText = this.session.personality;
    document.getElementById("modal-pers-desc").innerText =
      this.session.personalityDetails ? this.session.personalityDetails.description : "A dedicated enthusiast of nothingness.";
    document.getElementById("modal-personality").classList.remove("hidden");
  }

  closePersonalityModal() {
    document.getElementById("modal-personality").classList.add("hidden");
  }

  openExitModal() {
    this.playSfx("click");
    document.getElementById("modal-exit").classList.remove("hidden");
  }

  closeExitModal() {
    document.getElementById("modal-exit").classList.add("hidden");
  }

  confirmExit() {
    this.playSfx("click");
    this.closeExitModal();
    const sent = this.sendWs({ action: "EXIT_QUEUE" });
    if (!sent && this.session) {
      const exitData = {
        name: this.session.name,
        sessionId: this.session.sessionId,
        waitedSeconds: Math.max(1, Math.round((Date.now() - this.session.joinedAt) / 1000)),
        lastPosition: this.session.currentPosition,
        personality: this.session.personality,
        patienceLevel: this.session.patienceLevel
      };
      this.formerWaiters.unshift({
        id: "fw-" + Date.now(),
        name: exitData.name,
        waitedSeconds: exitData.waitedSeconds,
        lastPosition: exitData.lastPosition,
        personality: exitData.personality,
        patienceLevel: exitData.patienceLevel,
        exitedAt: new Date().toISOString()
      });
      this.stopSimulationTick();
      this.showFormerWaiterScreen(exitData);
    }
  }

  openWhyWaitingModal() {
    this.playSfx("click");
    const sent = this.sendWs({ action: "GET_WHY_WAITING" });
    if (!sent) {
      const ans = WHY_WAITING_ANSWERS[Math.floor(Math.random() * WHY_WAITING_ANSWERS.length)];
      this.displayWhyWaitingAnswer(ans);
    }
  }

  displayWhyWaitingAnswer(answer) {
    document.getElementById("why-waiting-answer").innerText = `"${answer}"`;
    document.getElementById("modal-why-waiting").classList.remove("hidden");
  }

  closeWhyWaitingModal() {
    document.getElementById("modal-why-waiting").classList.add("hidden");
  }

  // -------------------------------------------------------
  // ACTIVITIES PANEL (inline, no state reset)
  // -------------------------------------------------------
  openActivitiesPanel() {
    this.playSfx("click");
    const main = document.getElementById("dashboard-main-view");
    const panel = document.getElementById("dashboard-activities-panel");
    if (main) main.classList.add("hidden");
    if (panel) panel.classList.remove("hidden");
    this.activitiesPanel = true;

    document.getElementById("activity-selector").classList.remove("hidden");
    document.getElementById("activity-view").classList.add("hidden");

    if (window.Activities) {
      window.Activities.renderGrid(document.getElementById("activity-grid"));
    }
  }

  closeActivitiesPanel() {
    this.playSfx("click");
    if (window.Activities) {
      window.Activities.stopActiveActivity();
    }
    this.showMainView();
  }

  backToActivityGrid() {
    if (window.Activities) {
      window.Activities.stopActiveActivity();
    }
    document.getElementById("activity-selector").classList.remove("hidden");
    document.getElementById("activity-view").classList.add("hidden");
  }

  openActivity(activityId) {
    this.playSfx("click");
    if (!window.Activities) return;
    const activity = window.Activities.getById(activityId);
    if (!activity) return;

    document.getElementById("activity-selector").classList.add("hidden");
    const viewEl = document.getElementById("activity-view");
    viewEl.classList.remove("hidden");
    document.getElementById("activity-view-title").innerText = activity.name;

    const contentEl = document.getElementById("activity-content");
    window.Activities.renderActivity(activityId, contentEl);

    this.recordActivity(activity.name, false);
  }

  recordActivity(gameName, completed) {
    this.sendWs({
      action: "RECORD_ACTIVITY",
      gameName,
      completed
    });

    if (this.session) {
      if (!this.session.activitiesUsed.includes(gameName)) {
        this.session.activitiesUsed.push(gameName);
      }
      if (completed) {
        this.session.activitiesCompleted++;
      }
    }
  }

  // -------------------------------------------------------
  // SCREEN 5: FORMER WAITER SCREEN
  // -------------------------------------------------------
  showFormerWaiterScreen(data) {
    localStorage.removeItem("waitless_sessionId");
    localStorage.removeItem("waitless_sessionData");
    document.getElementById("fw-name").innerText = data.name;
    document.getElementById("fw-duration").innerText = `${data.waitedSeconds} seconds`;
    document.getElementById("fw-pos").innerText = `#${data.lastPosition}`;
    document.getElementById("fw-personality").innerText = data.personality;
    document.getElementById("fw-patience").innerText = `${data.patienceLevel}%`;

    const renderList = (waiters) => {
      const list = document.getElementById("former-waiters-archive");
      if (list && waiters) {
        list.innerHTML = waiters.map(fw => `
          <tr class="border-b border-zinc-800 text-xs">
            <td class="py-2.5 font-bold text-zinc-200">${fw.name}</td>
            <td class="py-2.5 text-amber-400 font-mono">${fw.waitedSeconds}s</td>
            <td class="py-2.5 text-zinc-400">#${fw.lastPosition}</td>
            <td class="py-2.5 text-zinc-400">${fw.personality}</td>
          </tr>
        `).join("");
      }
    };

    renderList(this.formerWaiters);

    if (window.location.port === "3000") {
      fetch("/api/former-waiters")
        .then(res => res.json())
        .then(json => {
          if (json.formerWaiters) renderList(json.formerWaiters);
        })
        .catch(() => {});
    }

    this.showScreen("screen-former-waiter");
  }

  // -------------------------------------------------------
  // SCREEN 6: FINAL REVEAL & COMPLETION
  // -------------------------------------------------------
  showCompletion(report, certificate) {
    this.playSfx("fanfare");
    this.currentReport = report;
    this.currentCertificate = certificate;
    if (window.Activities) {
      window.Activities.stopActiveActivity();
    }

    this.showScreen("screen-completion");
    document.getElementById("completion-user").innerText = report.name;
    this.triggerConfetti();
  }

  triggerConfetti() {
    const container = document.getElementById("confetti-container");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("div");
      p.className = "absolute w-2.5 h-2.5 rounded-sm animate-ping";
      p.style.backgroundColor = ["#fbbf24", "#f87171", "#34d399", "#60a5fa", "#a78bfa"][i % 5];
      p.style.top = Math.random() * 100 + "%";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = (Math.random() * 2 + 1) + "s";
      container.appendChild(p);
    }
  }

  // -------------------------------------------------------
  // SCREEN 7: REPORT & CERTIFICATE
  // -------------------------------------------------------
  showReportAndCertificate() {
    this.playSfx("click");
    const r = this.currentReport;
    const c = this.currentCertificate;
    if (!r || !c) return;

    document.getElementById("rep-name").innerText = r.name;
    document.getElementById("rep-session-id").innerText = r.sessionId;
    document.getElementById("rep-time").innerText = `${r.actualWaitingTime} seconds`;
    document.getElementById("rep-final-pos").innerText = `#${r.finalPosition}`;
    document.getElementById("rep-positions").innerText = r.positionsExperienced.map(p => `#${p}`).join(" → ");
    document.getElementById("rep-chaos").innerText = `${r.chaosEvents} events`;
    document.getElementById("rep-announcements").innerText = `${r.announcements} broadcasts`;
    document.getElementById("rep-activities").innerText = `${r.activitiesUsed.length} played (${r.activitiesCompleted} completed)`;
    document.getElementById("rep-patience").innerText = `${r.finalPatienceLevel}% (${r.patienceStatus})`;
    document.getElementById("rep-personality").innerText = r.personality;
    document.getElementById("rep-purpose").innerText = "0%"; // STRICT REQUIREMENT

    document.getElementById("cert-name").innerText = c.userName;
    document.getElementById("cert-duration").innerText = `${c.waitingDuration} SECONDS`;
    document.getElementById("cert-personality").innerText = c.personality;
    document.getElementById("cert-date").innerText = c.completionDate;
    document.getElementById("cert-id").innerText = c.certificateId;

    this.showScreen("screen-report");
  }

  printCertificate() {
    window.print();
  }

  // -------------------------------------------------------
  // RETURN TO LANDING / WAIT AGAIN
  // -------------------------------------------------------
  waitAgain() {
    this.playSfx("click");
    this.stopSimulationTick();
    localStorage.removeItem("waitless_sessionId");
    localStorage.removeItem("waitless_sessionData");
    this.session = null;
    this.currentReport = null;
    this.currentCertificate = null;
    if (window.Activities) {
      window.Activities.stopActiveActivity();
    }

    const input = document.getElementById("waiter-name-input");
    if (input) input.value = "";

    this.initLandingStats();
    this.showScreen("screen-landing");
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById("sound-toggle-btn");
    if (btn) {
      btn.innerText = this.soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
    }
  }

  setupEventListeners() {
    const joinForm = document.getElementById("join-queue-form");
    if (joinForm) {
      joinForm.addEventListener("submit", (e) => this.submitJoinQueue(e));
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.WaitlessApp = new WaitlessClient();
});

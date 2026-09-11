/**
 * WAITLESS - Core Client Application
 * Handles Real-Time WebSockets, Screen Routing, Sound FX,
 * Modals, State Restoration, Live Queue Roster, and 17 Activities.
 */

class WaitlessClient {
  constructor() {
    this.ws = null;
    this.currentScreen = "screen-landing";
    this.session = null;
    this.soundEnabled = true;
    this.audioCtx = null;
    this.reconnectAttempts = 0;
    this.activitiesPanel = false; // tracks if activities panel is open

    this.init();
  }

  init() {
    this.initAudio();
    this.connectWebSocket();
    this.setupEventListeners();
    Activities.init();
  }

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

  connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.ws = new WebSocket(`${protocol}//${host}`);

    this.ws.onopen = () => {
      this.updateStatusIndicator("online");
      this.reconnectAttempts = 0;

      // Attempt session recovery
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
      this.updateStatusIndicator("offline");
      const delay = Math.min(5000, 1000 * Math.pow(1.5, this.reconnectAttempts++));
      setTimeout(() => this.connectWebSocket(), delay);
    };

    this.ws.onerror = (err) => {
      console.warn("WS Error:", err);
    };
  }

  sendWs(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

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
    // Update landing page counters
    const waitCountEls = document.querySelectorAll(".live-waiter-count");
    waitCountEls.forEach(el => el.innerText = data.activeWaitersCount || 0);

    const formerCountEls = document.querySelectorAll(".former-waiter-count");
    formerCountEls.forEach(el => el.innerText = data.formerWaitersCount || 4);

    if (data.recentFormerWaiters && data.recentFormerWaiters.length > 0) {
      this.renderRecentFormerWaiters(data.recentFormerWaiters);
    }

    // Update live queue roster on dashboard
    if (data.activeRoster) {
      this.renderQueueRoster(data.activeRoster, data.activeWaitersCount);
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

  // Navigation
  showScreen(screenId) {
    document.querySelectorAll(".screen-container").forEach(el => el.classList.add("hidden"));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove("hidden");
      this.currentScreen = screenId;
      window.scrollTo(0, 0);
    }
  }

  // Screen 1 & 2 actions
  startJoinQueue() {
    this.playSfx("click");
    this.showScreen("screen-join");
  }

  submitJoinQueue(e) {
    if (e) e.preventDefault();
    this.playSfx("click");
    const nameInput = document.getElementById("waiter-name-input");
    const name = nameInput ? nameInput.value.trim() : "Anonymous Waiter";

    this.sendWs({
      action: "JOIN_QUEUE",
      name: name || "Anonymous Waiter"
    });
  }

  // Screen 3: Dashboard logic
  initDashboard() {
    if (!this.session) return;
    document.getElementById("dashboard-user-name").innerText = this.session.name;
    document.getElementById("dashboard-personality-tag").innerText = this.session.personality;
    this.updatePositionDisplay(this.session.currentPosition);
    this.updatePatienceBar(this.session.patienceLevel, this.session.patienceStatus);
    this.updateFakeEta(this.session.fakeEtaSeconds);
    // Ensure main view is visible, activities panel hidden
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
    // Also update the mini status bar in activities panel
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
    // Also update activities panel patience display
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
    // Keep session state up to date
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

  // Modals (Screen 4)
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
    this.sendWs({ action: "EXIT_QUEUE" });
  }

  openWhyWaitingModal() {
    this.playSfx("click");
    this.sendWs({ action: "GET_WHY_WAITING" });
  }

  displayWhyWaitingAnswer(answer) {
    document.getElementById("why-waiting-answer").innerText = `"${answer}"`;
    document.getElementById("modal-why-waiting").classList.remove("hidden");
  }

  closeWhyWaitingModal() {
    document.getElementById("modal-why-waiting").classList.add("hidden");
  }

  // -------------------------------------------------------
  // ACTIVITIES PANEL (inline, no modal)
  // -------------------------------------------------------

  openActivitiesPanel() {
    this.playSfx("click");
    const main = document.getElementById("dashboard-main-view");
    const panel = document.getElementById("dashboard-activities-panel");
    if (main) main.classList.add("hidden");
    if (panel) panel.classList.remove("hidden");
    this.activitiesPanel = true;

    // Show grid, hide activity view
    document.getElementById("activity-selector").classList.remove("hidden");
    document.getElementById("activity-view").classList.add("hidden");

    // Render activity cards
    Activities.renderGrid(document.getElementById("activity-grid"));
  }

  closeActivitiesPanel() {
    this.playSfx("click");
    Activities.stopActiveActivity();
    this.showMainView();
  }

  backToActivityGrid() {
    Activities.stopActiveActivity();
    document.getElementById("activity-selector").classList.remove("hidden");
    document.getElementById("activity-view").classList.add("hidden");
  }

  openActivity(activityId) {
    this.playSfx("click");
    const activity = Activities.getById(activityId);
    if (!activity) return;

    document.getElementById("activity-selector").classList.add("hidden");
    const viewEl = document.getElementById("activity-view");
    viewEl.classList.remove("hidden");
    document.getElementById("activity-view-title").innerText = activity.name;

    const contentEl = document.getElementById("activity-content");
    Activities.renderActivity(activityId, contentEl);

    this.recordActivity(activity.name, false);
  }

  recordActivity(gameName, completed) {
    this.sendWs({
      action: "RECORD_ACTIVITY",
      gameName,
      completed
    });
  }

  // Screen 5: Former Waiter Screen
  showFormerWaiterScreen(data) {
    localStorage.removeItem("waitless_sessionId");
    document.getElementById("fw-name").innerText = data.name;
    document.getElementById("fw-duration").innerText = `${data.waitedSeconds} seconds`;
    document.getElementById("fw-pos").innerText = `#${data.lastPosition}`;
    document.getElementById("fw-personality").innerText = data.personality;
    document.getElementById("fw-patience").innerText = `${data.patienceLevel}%`;

    // Load former waiters list from server
    fetch("/api/former-waiters")
      .then(res => res.json())
      .then(json => {
        const list = document.getElementById("former-waiters-archive");
        if (list && json.formerWaiters) {
          list.innerHTML = json.formerWaiters.map(fw => `
            <tr class="border-b border-zinc-800 text-xs">
              <td class="py-2.5 font-bold text-zinc-200">${fw.name}</td>
              <td class="py-2.5 text-amber-400 font-mono">${fw.waitedSeconds}s</td>
              <td class="py-2.5 text-zinc-400">#${fw.lastPosition}</td>
              <td class="py-2.5 text-zinc-400">${fw.personality}</td>
            </tr>
          `).join("");
        }
      });

    this.showScreen("screen-former-waiter");
  }

  // Screen 6: Final Reveal & Completion
  showCompletion(report, certificate) {
    this.playSfx("fanfare");
    this.currentReport = report;
    this.currentCertificate = certificate;
    Activities.stopActiveActivity();

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

  // Screen 7: Report & Certificate
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

  // SECTION 25: WAIT AGAIN LOGIC
  waitAgain() {
    this.playSfx("click");
    localStorage.removeItem("waitless_sessionId");
    this.session = null;
    this.currentReport = null;
    this.currentCertificate = null;
    Activities.stopActiveActivity();

    const input = document.getElementById("waiter-name-input");
    if (input) input.value = "";

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

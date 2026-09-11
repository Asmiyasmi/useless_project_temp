const crypto = require("crypto");

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

// Maximum number of chaos history entries to keep per session (prevents unbounded growth)
const MAX_CHAOS_HISTORY = 20;

class QueueManager {
  constructor() {
    this.sessions = new Map();      // sessionId -> session
    this.activeQueue = [];          // array of sessionIds in order joined
    this.formerWaiters = [
      { id: "fw-1", name: "Miya",   waitedSeconds: 23, lastPosition: 5, personality: "The Patient One",       patienceLevel: 72, exitedAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "fw-2", name: "Arjun",  waitedSeconds: 41, lastPosition: 3, personality: "The Professional Waiter", patienceLevel: 61, exitedAt: new Date(Date.now() - 1800000).toISOString() },
      { id: "fw-3", name: "Devika", waitedSeconds: 15, lastPosition: 8, personality: "The Confused",           patienceLevel: 89, exitedAt: new Date(Date.now() - 900000).toISOString() },
      { id: "fw-4", name: "Kiran",  waitedSeconds: 52, lastPosition: 2, personality: "The Optimist",           patienceLevel: 44, exitedAt: new Date(Date.now() - 300000).toISOString() }
    ];
    this.broadcastCallback = null;

    // Cached roster fingerprint — used to suppress identical QUEUE_UPDATE broadcasts
    this._lastRosterFingerprint = "";

    // Single tick interval — created once, never duplicated
    this._tickInterval = setInterval(() => this.tick(), 1000);
  }

  setBroadcastCallback(cb) {
    this.broadcastCallback = cb;
  }

  broadcast(message) {
    if (this.broadcastCallback) {
      this.broadcastCallback(message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────────────────────

  createSession(name = "Anonymous Waiter") {
    const sessionId = "sess_" + crypto.randomBytes(8).toString("hex");
    const userId    = "usr_"  + crypto.randomBytes(6).toString("hex");

    // Duration: 1 to 120 seconds (server authoritative, never > 120s)
    const actualWaitDuration = Math.floor(Math.random() * 120) + 1;
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

    const realQueuePos = this.activeQueue.length + 1;
    const initialDisplayPosition = Math.max(realQueuePos, Math.floor(Math.random() * 15) + 3);

    const session = {
      userId,
      name: name.trim() || "Anonymous Waiter",
      sessionId,
      status: "WAITING",
      joinedAt: Date.now(),
      actualWaitDuration,
      currentPosition: initialDisplayPosition,
      positionsExperienced: [initialDisplayPosition],
      personality: personality.name,
      personalityDetails: personality,
      patienceLevel: 100,
      patienceStatus: "Completely fine.",
      fakeEtaSeconds: Math.floor(Math.random() * 45) + 15,
      activitiesUsed: [],
      activitiesCompleted: 0,
      chaosEvents: 0,
      chaosHistory: [],           // capped at MAX_CHAOS_HISTORY entries
      announcementsReceived: 0,
      lastAnnouncement: "You have entered the queue. Welcome to nothing.",
      exitedAt: null,
      completedAt: null,
      finalReport: null
    };

    this.sessions.set(sessionId, session);
    this.activeQueue.push(sessionId);

    // Broadcast because roster changed
    this.broadcastQueueUpdate(true);

    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  recordActivity(sessionId, gameName, completed = false) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "WAITING") return null;

    if (!session.activitiesUsed.includes(gameName)) {
      session.activitiesUsed.push(gameName);
    }
    if (completed) {
      session.activitiesCompleted += 1;
    }
    return session;
  }

  exitQueue(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.status === "WAITING") {
      session.status = "FORMER_WAITER";
      session.exitedAt = Date.now();
      const actualTimeWaited = Math.min(
        Math.round((session.exitedAt - session.joinedAt) / 1000),
        session.actualWaitDuration
      );
      session.waitedSeconds = Math.max(1, actualTimeWaited);

      // Remove from active queue
      this.activeQueue = this.activeQueue.filter(id => id !== sessionId);

      // Add to former waiters list (capped at 50)
      this.formerWaiters.unshift({
        id: "fw-" + Date.now(),
        name: session.name,
        waitedSeconds: session.waitedSeconds,
        lastPosition: session.currentPosition,
        personality: session.personality,
        patienceLevel: session.patienceLevel,
        exitedAt: new Date(session.exitedAt).toISOString()
      });
      if (this.formerWaiters.length > 50) this.formerWaiters.pop();

      // Broadcast because roster changed
      this.broadcastQueueUpdate(true);
    }

    return {
      name: session.name,
      sessionId: session.sessionId,
      waitedSeconds: session.waitedSeconds || Math.round((Date.now() - session.joinedAt) / 1000),
      lastPosition: session.currentPosition,
      personality: session.personality,
      patienceLevel: session.patienceLevel
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tick loop — runs once per second
  // Optimisations:
  //   • Only calls broadcastQueueUpdate() ONCE at the end if anything changed.
  //   • Does NOT call broadcastQueueUpdate() inside completeSession().
  //   • Uses a fingerprint to suppress QUEUE_UPDATE when roster is unchanged.
  // ─────────────────────────────────────────────────────────────────────────
  tick() {
    if (this.activeQueue.length === 0) return; // nothing to do

    const now = Date.now();
    const completedSessionIds = [];
    let rosterDirty = false; // true if any position changed this tick

    for (const sessionId of this.activeQueue) {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== "WAITING") continue;

      const elapsed   = Math.floor((now - session.joinedAt) / 1000);
      const remaining = session.actualWaitDuration - elapsed;

      // 1. Patience gradual decline
      const decayRatio = Math.min(1, elapsed / session.actualWaitDuration);
      session.patienceLevel = Math.max(12, Math.round(100 - (decayRatio * 55) - (Math.random() * 6)));
      session.patienceStatus =
        session.patienceLevel >= 80 ? "Completely fine." :
        session.patienceLevel >= 60 ? "Still surprisingly calm." :
        session.patienceLevel >= 40 ? "Mild concern detected." :
                                      "Patience is becoming questionable.";

      // 2. Check for completion
      if (remaining <= 0) {
        completedSessionIds.push(sessionId);
        continue;
      }

      // 3. Fake ETA fluctuation (cosmetic only)
      if (Math.random() < 0.35) {
        const fakeDelta = Math.floor(Math.random() * 15) - 7;
        session.fakeEtaSeconds = Math.max(3, session.fakeEtaSeconds + fakeDelta);
      }

      // 4. Random Queue Chaos Event (~22% chance per tick)
      if (Math.random() < 0.22 && session.currentPosition > 1) {
        const oldPos = session.currentPosition;
        let delta;
        if (remaining <= 5) {
          delta = -Math.max(1, Math.floor(oldPos / 2));
        } else {
          delta = Math.random() < 0.45
            ? (Math.floor(Math.random() * 4) + 1)
            : -(Math.floor(Math.random() * 5) + 1);
        }

        let newPos = Math.max(2, oldPos + delta);
        if (newPos === oldPos) newPos = oldPos > 2 ? oldPos - 1 : oldPos + 1;

        const reason = CHAOS_REASONS[Math.floor(Math.random() * CHAOS_REASONS.length)];
        session.currentPosition = newPos;
        session.chaosEvents += 1;
        session.positionsExperienced.push(newPos);

        // Keep chaosHistory bounded to avoid memory growth over long sessions
        if (session.chaosHistory.length >= MAX_CHAOS_HISTORY) {
          session.chaosHistory.shift();
        }
        session.chaosHistory.push({ from: oldPos, to: newPos, reason, timestamp: now });

        rosterDirty = true; // position changed → roster needs update

        this.broadcastToSession(sessionId, {
          type: "QUEUE_CHAOS",
          position: newPos,
          previousPosition: oldPos,
          reason,
          chaosEvents: session.chaosEvents
        });
      }

      // 5. Random Announcement (~18% chance per tick)
      if (Math.random() < 0.18) {
        const ann = ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)];
        session.announcementsReceived += 1;
        session.lastAnnouncement = ann;
        this.broadcastToSession(sessionId, {
          type: "ANNOUNCEMENT",
          message: ann,
          totalAnnouncements: session.announcementsReceived
        });
      }

      // 6. Per-session heartbeat tick (patience + ETA + position)
      this.broadcastToSession(sessionId, {
        type: "SESSION_TICK",
        currentPosition: session.currentPosition,
        patienceLevel: session.patienceLevel,
        patienceStatus: session.patienceStatus,
        fakeEtaSeconds: session.fakeEtaSeconds,
        elapsedSeconds: elapsed
      });
    }

    // Process completions (they mutate activeQueue, so done after the loop)
    for (const sessionId of completedSessionIds) {
      this.completeSession(sessionId);
      rosterDirty = true;
    }

    // Send ONE QUEUE_UPDATE per tick — only if the roster actually changed
    // (positions changed via chaos OR a session completed).
    // Pass force=false so the fingerprint check can suppress duplicate sends.
    this.broadcastQueueUpdate(rosterDirty);
  }

  completeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "WAITING") return;

    session.status = "COMPLETED";
    session.currentPosition = 1;
    session.positionsExperienced.push(1);
    session.completedAt = Date.now();
    session.actualTimeWaited = Math.round((session.completedAt - session.joinedAt) / 1000);

    // Remove from active queue
    this.activeQueue = this.activeQueue.filter(id => id !== sessionId);

    // Build Final Report & Certificate
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

    // Send SESSION_COMPLETED only to the completed user
    this.broadcastToSession(sessionId, {
      type: "SESSION_COMPLETED",
      session,
      finalReport,
      certificate
    });

    // Note: broadcastQueueUpdate() is NOT called here.
    // The tick() loop calls it once after processing all completions.
  }

  // ─────────────────────────────────────────────────────────────────────────
  // broadcastQueueUpdate
  //
  // force=true  → always send (used on join/exit where we must update immediately)
  // force=false → compare fingerprint; skip if roster hasn't changed this tick
  // ─────────────────────────────────────────────────────────────────────────
  broadcastQueueUpdate(force = false) {
    const activeRoster = this.activeQueue
      .map(id => {
        const s = this.sessions.get(id);
        if (!s) return null;
        return { sessionId: s.sessionId, name: s.name, position: s.currentPosition };
      })
      .filter(Boolean)
      .sort((a, b) => a.position - b.position);

    // Build a cheap fingerprint: "name:pos,name:pos,..."
    const fingerprint = activeRoster.map(r => `${r.sessionId}:${r.position}`).join(",")
      + "|" + this.activeQueue.length
      + "|" + this.formerWaiters.length;

    if (!force && fingerprint === this._lastRosterFingerprint) {
      return; // Nothing changed — suppress redundant broadcast
    }
    this._lastRosterFingerprint = fingerprint;

    this.broadcast({
      type: "QUEUE_UPDATE",
      activeWaitersCount: this.activeQueue.length,
      formerWaitersCount: this.formerWaiters.length,
      recentFormerWaiters: this.formerWaiters.slice(0, 5),
      activeRoster
    });
  }

  broadcastToSession(sessionId, payload) {
    this.broadcast({
      targetSessionId: sessionId,
      ...payload
    });
  }

  getRandomWhyAnswer() {
    return WHY_WAITING_ANSWERS[Math.floor(Math.random() * WHY_WAITING_ANSWERS.length)];
  }

  getFormerWaiters() {
    return this.formerWaiters;
  }
}

module.exports = new QueueManager();

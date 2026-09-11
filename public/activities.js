/**
 * WAITLESS — 17 Useless Activities System
 * All activities run inline in the waiting dashboard.
 * The queue, timer, and session are NEVER affected by activities.
 */

const Activities = (function() {
  let _activeTimer = null;
  let _loadingInterval = null;

  const ACTIVITY_LIST = [
    {
      id: "click100",
      name: "CLICK 100 TIMES",
      desc: "A task of questionable importance.",
      render: renderClick100
    },
    {
      id: "loading",
      name: "WATCH THE LOADING SCREEN",
      desc: "Please continue watching.",
      render: renderLoading
    },
    {
      id: "donotpress",
      name: "DO NOT PRESS",
      desc: "Seriously. Don't.",
      render: renderDoNotPress
    },
    {
      id: "whywaiting",
      name: "WHY AM I WAITING?",
      desc: "The server has answers. Sort of.",
      render: renderWhyWaiting
    },
    {
      id: "calculator",
      name: "USELESS CALCULATOR",
      desc: "Calculations that mean absolutely nothing.",
      render: renderUselessCalculator
    },
    {
      id: "buttonsim",
      name: "BUTTON SIMULATOR",
      desc: "Press buttons. Experience nothing.",
      render: renderButtonSimulator
    },
    {
      id: "randomnumber",
      name: "RANDOM NUMBER GENERATOR",
      desc: "Statistically meaningless. Emotionally rich.",
      render: renderRandomNumber
    },
    {
      id: "waitingsim",
      name: "WAITING SIMULATOR",
      desc: "Wait while you wait. Recursively.",
      render: renderWaitingSimulator
    },
    {
      id: "progressbar",
      name: "PROGRESS BAR OF NOTHING",
      desc: "It moves. It means nothing.",
      render: renderProgressBar
    },
    {
      id: "counter",
      name: "POINTLESS COUNTER",
      desc: "Count. Achieve nothing.",
      render: renderPointlessCounter
    },
    {
      id: "infiniteloading",
      name: "INFINITE LOADING",
      desc: "The load that never completes.",
      render: renderInfiniteLoading
    },
    {
      id: "announcements",
      name: "IMPORTANT ANNOUNCEMENT GENERATOR",
      desc: "Urgent information. Completely useless.",
      render: renderAnnouncementGenerator
    },
    {
      id: "prediction",
      name: "QUEUE PREDICTION",
      desc: "We will guess your future. Inaccurately.",
      render: renderQueuePrediction
    },
    {
      id: "patiencetest",
      name: "PATIENCE TEST",
      desc: "How long can you truly wait?",
      render: renderPatienceTest
    },
    {
      id: "absolutelynothing",
      name: "ABSOLUTELY NOTHING BUTTON",
      desc: "One button. Zero outcomes.",
      render: renderAbsolutelyNothing
    },
    {
      id: "trivia",
      name: "USELESS TRIVIA",
      desc: "Facts you will immediately forget.",
      render: renderUselessTrivia
    },
    {
      id: "timewaster",
      name: "TIME WASTER",
      desc: "Specifically designed to waste time.",
      render: renderTimeWaster
    }
  ];

  function init() {
    // Nothing to initialize globally
  }

  function getById(id) {
    return ACTIVITY_LIST.find(a => a.id === id) || null;
  }

  function renderGrid(container) {
    if (!container) return;
    container.innerHTML = ACTIVITY_LIST.map(a => `
      <button
        onclick="WaitlessApp.openActivity('${a.id}')"
        class="w-full text-left p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl transition group"
      >
        <div class="font-display font-bold text-xs text-zinc-200 group-hover:text-white tracking-wide">${a.name}</div>
        <div class="text-[11px] text-zinc-500 mt-0.5 font-mono italic">${a.desc}</div>
      </button>
    `).join("");
  }

  function renderActivity(id, container) {
    stopActiveActivity();
    const act = getById(id);
    if (!act || !container) return;
    act.render(container);
  }

  function stopActiveActivity() {
    if (_activeTimer) { clearTimeout(_activeTimer); _activeTimer = null; }
    if (_loadingInterval) { clearInterval(_loadingInterval); _loadingInterval = null; }
  }

  // ──────────────────────────────────────────────
  // 1. CLICK 100 TIMES
  // ──────────────────────────────────────────────
  function renderClick100(c) {
    let count = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">Click the button exactly 100 times. Your commitment will be noted and then forgotten.</p>
        <div id="c100-count" class="font-mono text-6xl font-black text-amber-400">0</div>
        <div id="c100-label" class="text-xs text-zinc-500 font-mono">of 100 required clicks</div>
        <button id="c100-btn" class="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-2xl font-display font-bold text-white text-base active:scale-95 transition">
          CLICK
        </button>
        <div id="c100-msg" class="text-xs text-zinc-500 italic h-4"></div>
      </div>
    `;
    const msgs = [
      "That's one.", "You're committed.", "No going back now.", "The queue appreciates this.",
      "Keep going.", "Halfway there? Not quite.", "Your finger is remarkable.", "Almost... not really.",
      "The button acknowledges you.", "You are doing something."
    ];
    document.getElementById("c100-btn").onclick = () => {
      count++;
      document.getElementById("c100-count").innerText = count;
      if (count < 100) {
        document.getElementById("c100-msg").innerText = msgs[count % msgs.length];
      } else {
        document.getElementById("c100-btn").disabled = true;
        document.getElementById("c100-btn").className = "px-8 py-4 bg-zinc-700 border border-zinc-600 rounded-2xl font-display font-bold text-zinc-400 text-base cursor-not-allowed";
        document.getElementById("c100-msg").innerText = "Congratulations. Nothing has changed.";
        document.getElementById("c100-label").innerText = "Task complete. Purpose: still 0%.";
        if (window.WaitlessApp) window.WaitlessApp.recordActivity("click100", true);
      }
    };
  }

  // ──────────────────────────────────────────────
  // 2. WATCH THE LOADING SCREEN
  // ──────────────────────────────────────────────
  function renderLoading(c) {
    let secs = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">A loading screen. It has been loading since you arrived. It will continue to load.</p>
        <div class="relative w-24 h-24">
          <div class="absolute inset-0 rounded-full border-4 border-zinc-700"></div>
          <div class="absolute inset-0 rounded-full border-4 border-t-amber-400 animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-[10px] font-mono text-zinc-500">loading</span>
          </div>
        </div>
        <div id="load-timer" class="font-mono text-sm text-zinc-400">Observed for: <span class="text-amber-400 font-bold">0s</span></div>
        <div id="load-msg" class="text-xs text-zinc-500 italic">Please wait while we prepare nothing.</div>
      </div>
    `;
    const statuses = [
      "Initializing void...", "Connecting to nothing...", "Preparing emptiness...",
      "Loading your patience...", "Synchronizing zero outcomes...", "Calibrating meaninglessness...",
      "Establishing null connection...", "Buffering the absence of progress..."
    ];
    _loadingInterval = setInterval(() => {
      secs++;
      const el = document.getElementById("load-timer");
      const msg = document.getElementById("load-msg");
      if (el) el.innerHTML = `Observed for: <span class="text-amber-400 font-bold">${secs}s</span>`;
      if (msg) msg.innerText = statuses[secs % statuses.length];
      if (secs === 10 && window.WaitlessApp) window.WaitlessApp.recordActivity("loading", true);
    }, 1000);
  }

  // ──────────────────────────────────────────────
  // 3. DO NOT PRESS
  // ──────────────────────────────────────────────
  function renderDoNotPress(c) {
    let pressCount = 0;
    const reactions = [
      "We asked you not to.", "Again? Really?", "This is a formal warning.",
      "The button has filed a complaint.", "We're monitoring the situation.",
      "A note has been added to your permanent record.", "You have been reported to no one.",
      "The button forgives you. Barely.", "This is getting embarrassing.",
      "The queue has noticed. The queue judges.", "Congratulations. You've pressed it enough to qualify for absolutely nothing."
    ];
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">This button does nothing. You were specifically asked not to press it.</p>
        <button id="dnp-btn" class="px-10 py-5 bg-red-900/40 hover:bg-red-900/60 border-2 border-red-700/80 rounded-2xl font-display font-bold text-red-300 text-base active:scale-95 transition">
          DO NOT PRESS
        </button>
        <div id="dnp-count" class="font-mono text-xs text-zinc-500">Violations: 0</div>
        <div id="dnp-msg" class="text-xs text-amber-300/80 italic h-5"></div>
      </div>
    `;
    document.getElementById("dnp-btn").onclick = () => {
      pressCount++;
      document.getElementById("dnp-count").innerText = `Violations: ${pressCount}`;
      const msg = reactions[Math.min(pressCount - 1, reactions.length - 1)];
      document.getElementById("dnp-msg").innerText = msg;
      if (pressCount >= 5 && window.WaitlessApp) window.WaitlessApp.recordActivity("donotpress", true);
    };
  }

  // ──────────────────────────────────────────────
  // 4. WHY AM I WAITING?
  // ──────────────────────────────────────────────
  function renderWhyWaiting(c) {
    const answers = [
      "Because you joined.", "Because the queue exists.",
      "That's an excellent question.", "We don't know either.",
      "To experience the raw essence of the passage of time.",
      "The system requires an active row in its database.",
      "A philosophical inquiry best left unanswered.",
      "Because someone, somewhere, pressed a button.",
      "The queue was lonely.", "Your presence was statistically necessary.",
      "It seemed like a good idea at the time.",
      "The alternative was also nothing."
    ];
    let idx = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">Each answer is equally authoritative and equally useless.</p>
        <div id="why-ans" class="text-lg font-display font-extrabold text-amber-400 italic px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl min-h-14 flex items-center justify-center">
          "${answers[0]}"
        </div>
        <button id="why-btn" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">
          Ask Again
        </button>
        <div id="why-count" class="text-[10px] font-mono text-zinc-600">Answers received: 1</div>
      </div>
    `;
    let count = 1;
    document.getElementById("why-btn").onclick = () => {
      idx = (idx + 1) % answers.length;
      count++;
      document.getElementById("why-ans").innerText = `"${answers[idx]}"`;
      document.getElementById("why-count").innerText = `Answers received: ${count}`;
      if (count >= 5 && window.WaitlessApp) window.WaitlessApp.recordActivity("whywaiting", true);
    };
  }

  // ──────────────────────────────────────────────
  // 5. USELESS CALCULATOR
  // ──────────────────────────────────────────────
  function renderUselessCalculator(c) {
    const ops = [
      (a, b) => `${a} + ${b} = ${a + b} (still meaningless)`,
      (a, b) => `${a} × ${b} = ${a * b} (no real-world applications)`,
      (a, b) => `${a} ÷ ${b || 1} ≈ ${(a / (b || 1)).toFixed(3)} (approximate and irrelevant)`,
      (a, b) => `√(${a}) = ${Math.sqrt(a).toFixed(4)} (completely unnecessary)`,
      (a, b) => `${a}² = ${a * a} (a fact nobody needed)`,
    ];
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-4 py-4 text-center">
        <p class="text-xs text-zinc-400">Enter any numbers. Receive a calculation. Change nothing.</p>
        <div class="flex items-center space-x-2 w-full max-w-xs">
          <input type="number" id="calc-a" placeholder="42" value="42" class="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm text-center outline-none focus:border-amber-400 font-mono" />
          <input type="number" id="calc-b" placeholder="7" value="7" class="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm text-center outline-none focus:border-amber-400 font-mono" />
        </div>
        <button id="calc-btn" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">
          Calculate Uselessly
        </button>
        <div id="calc-result" class="w-full max-w-xs p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400 min-h-10 flex items-center justify-center">
          Awaiting input.
        </div>
      </div>
    `;
    let calcCount = 0;
    document.getElementById("calc-btn").onclick = () => {
      const a = parseFloat(document.getElementById("calc-a").value) || 0;
      const b = parseFloat(document.getElementById("calc-b").value) || 0;
      const op = ops[Math.floor(Math.random() * ops.length)];
      document.getElementById("calc-result").innerText = op(a, b);
      calcCount++;
      if (calcCount >= 3 && window.WaitlessApp) window.WaitlessApp.recordActivity("calculator", true);
    };
  }

  // ──────────────────────────────────────────────
  // 6. BUTTON SIMULATOR
  // ──────────────────────────────────────────────
  function renderButtonSimulator(c) {
    const buttons = [
      { label: "SUBMIT", response: "Submitted. Nothing was received." },
      { label: "CONFIRM", response: "Confirmed. Nothing was confirmed." },
      { label: "PROCEED", response: "Proceeding. Into the void." },
      { label: "APPROVE", response: "Approved. No record of this approval exists." },
      { label: "REFRESH", response: "Refreshed. Status: identical." },
      { label: "SYNC", response: "Synced with zero external systems." },
    ];
    c.innerHTML = `
      <div class="space-y-4 py-2">
        <p class="text-xs text-zinc-400 text-center">Professional-grade buttons. None of them do anything.</p>
        <div class="grid grid-cols-2 gap-2">
          ${buttons.map((btn, i) => `
            <button id="bsim-${i}" class="py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-mono text-xs text-zinc-200 active:scale-95 transition">
              ${btn.label}
            </button>
          `).join("")}
        </div>
        <div id="bsim-msg" class="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400 text-center min-h-9 flex items-center justify-center">
          Select a button to interact with it.
        </div>
      </div>
    `;
    let bCount = 0;
    buttons.forEach((btn, i) => {
      document.getElementById(`bsim-${i}`).onclick = () => {
        document.getElementById("bsim-msg").innerText = btn.response;
        bCount++;
        if (bCount >= 4 && window.WaitlessApp) window.WaitlessApp.recordActivity("buttonsim", true);
      };
    });
  }

  // ──────────────────────────────────────────────
  // 7. RANDOM NUMBER GENERATOR
  // ──────────────────────────────────────────────
  function renderRandomNumber(c) {
    const comments = [
      "A fine number.", "Statistically inevitable.", "The queue approves.",
      "Completely random. Completely irrelevant.", "This number has never mattered.",
      "Significant in no known context.", "Filed under: unnecessary data."
    ];
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">Generate numbers. They will mean nothing to anyone.</p>
        <div id="rng-num" class="font-mono text-7xl font-black text-amber-400">—</div>
        <div id="rng-comment" class="text-xs text-zinc-500 italic h-4"></div>
        <button id="rng-btn" class="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">
          Generate
        </button>
        <div id="rng-count" class="text-[10px] font-mono text-zinc-600">Numbers generated: 0</div>
      </div>
    `;
    let rngCount = 0;
    document.getElementById("rng-btn").onclick = () => {
      const n = Math.floor(Math.random() * 9999) + 1;
      rngCount++;
      document.getElementById("rng-num").innerText = n;
      document.getElementById("rng-comment").innerText = comments[rngCount % comments.length];
      document.getElementById("rng-count").innerText = `Numbers generated: ${rngCount}`;
      if (rngCount >= 5 && window.WaitlessApp) window.WaitlessApp.recordActivity("randomnumber", true);
    };
  }

  // ──────────────────────────────────────────────
  // 8. WAITING SIMULATOR
  // ──────────────────────────────────────────────
  function renderWaitingSimulator(c) {
    let simPos = Math.floor(Math.random() * 20) + 5;
    let simSecs = 0;
    let running = false;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">A simulated queue, inside your real queue. Waiting: recursively.</p>
        <div class="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl w-full space-y-3">
          <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Simulated Queue Position</div>
          <div id="sim-pos" class="font-mono text-5xl font-black text-sky-400">#${simPos}</div>
          <div id="sim-eta" class="text-xs font-mono text-zinc-400">Simulated ETA: calculating...</div>
          <div id="sim-status" class="text-[10px] text-zinc-600 italic">Not started.</div>
        </div>
        <button id="sim-btn" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">
          Join Simulated Queue
        </button>
      </div>
    `;
    document.getElementById("sim-btn").onclick = () => {
      if (running) return;
      running = true;
      document.getElementById("sim-btn").disabled = true;
      document.getElementById("sim-btn").innerText = "Waiting (simulated)...";
      document.getElementById("sim-status").innerText = "Simulation in progress.";
      if (window.WaitlessApp) window.WaitlessApp.recordActivity("waitingsim", false);
      const iv = setInterval(() => {
        simSecs++;
        if (Math.random() < 0.3 && simPos > 1) simPos--;
        document.getElementById("sim-pos").innerText = `#${simPos}`;
        document.getElementById("sim-eta").innerText = `Simulated ETA: ${Math.floor(Math.random() * 60) + 1}s (fake)`;
        if (simPos <= 1 || simSecs >= 30) {
          clearInterval(iv);
          document.getElementById("sim-status").innerText = "Simulation complete. Nothing simulated.";
          document.getElementById("sim-btn").innerText = "Simulation Ended";
          if (window.WaitlessApp) window.WaitlessApp.recordActivity("waitingsim", true);
        }
      }, 1500);
      _activeTimer = iv;
    };
  }

  // ──────────────────────────────────────────────
  // 9. PROGRESS BAR OF NOTHING
  // ──────────────────────────────────────────────
  function renderProgressBar(c) {
    let pct = 0;
    let dir = 1;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">A progress bar. Progress is measured. Progress means nothing.</p>
        <div class="w-full space-y-2">
          <div class="flex justify-between text-xs font-mono">
            <span class="text-zinc-500">Progress</span>
            <span id="pb-pct" class="text-amber-400 font-bold">0%</span>
          </div>
          <div class="w-full bg-zinc-800 h-4 rounded-full border border-zinc-700 overflow-hidden">
            <div id="pb-bar" class="h-full bg-gradient-to-r from-sky-500 to-amber-400 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <div id="pb-status" class="text-xs font-mono text-zinc-500 italic">Awaiting commencement.</div>
        </div>
        <div class="grid grid-cols-2 gap-2 w-full">
          <button id="pb-start" class="py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-mono text-white">Start Progress</button>
          <button id="pb-reset" class="py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-400">Reset</button>
        </div>
      </div>
    `;
    let iv = null;
    const statuses = [
      "Initializing...", "Processing...", "Still processing...", "Almost there (not really)...",
      "Loading...", "Preparing nothing...", "Finalizing emptiness...", "Completing incompletion..."
    ];
    document.getElementById("pb-start").onclick = () => {
      if (iv) return;
      if (window.WaitlessApp) window.WaitlessApp.recordActivity("progressbar", false);
      iv = setInterval(() => {
        pct += dir * (Math.random() * 3 + 0.5);
        if (pct >= 100) { pct = 100; clearInterval(iv); iv = null; if (window.WaitlessApp) window.WaitlessApp.recordActivity("progressbar", true); }
        if (pct < 0) pct = 0;
        document.getElementById("pb-bar").style.width = pct + "%";
        document.getElementById("pb-pct").innerText = Math.round(pct) + "%";
        document.getElementById("pb-status").innerText = pct >= 100 ? "Complete. Nothing was accomplished." : statuses[Math.floor(pct / 13)];
      }, 200);
    };
    document.getElementById("pb-reset").onclick = () => {
      clearInterval(iv); iv = null; pct = 0;
      document.getElementById("pb-bar").style.width = "0%";
      document.getElementById("pb-pct").innerText = "0%";
      document.getElementById("pb-status").innerText = "Reset. Back to nothing.";
    };
  }

  // ──────────────────────────────────────────────
  // 10. POINTLESS COUNTER
  // ──────────────────────────────────────────────
  function renderPointlessCounter(c) {
    let n = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">A counter. It counts. The total is irrelevant.</p>
        <div id="pc-val" class="font-mono text-8xl font-black text-white">0</div>
        <div id="pc-unit" class="text-xs font-mono text-zinc-500">meaningless units</div>
        <div class="flex space-x-3">
          <button id="pc-sub" class="w-14 h-14 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-2xl font-bold active:scale-95 transition">−</button>
          <button id="pc-reset" class="w-14 h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 text-xs font-mono active:scale-95 transition">reset</button>
          <button id="pc-add" class="w-14 h-14 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-2xl font-bold active:scale-95 transition">+</button>
        </div>
        <div id="pc-note" class="text-[10px] text-zinc-600 italic h-4"></div>
      </div>
    `;
    const notes = ["", "Noted.", "Acknowledged.", "Recorded into the void.", "The queue is indifferent."];
    let interact = 0;
    const update = () => {
      document.getElementById("pc-val").innerText = n;
      interact++;
      document.getElementById("pc-note").innerText = notes[interact % notes.length];
      if (interact >= 10 && window.WaitlessApp) window.WaitlessApp.recordActivity("counter", true);
    };
    document.getElementById("pc-add").onclick = () => { n++; update(); };
    document.getElementById("pc-sub").onclick = () => { n--; update(); };
    document.getElementById("pc-reset").onclick = () => { n = 0; document.getElementById("pc-val").innerText = 0; document.getElementById("pc-note").innerText = "Reset to zero. Also meaningless."; };
  }

  // ──────────────────────────────────────────────
  // 11. INFINITE LOADING
  // ──────────────────────────────────────────────
  function renderInfiniteLoading(c) {
    const stages = [
      "Establishing connection to nothing...",
      "Negotiating with the void...",
      "Loading module: emptiness.js...",
      "Requesting data from null endpoint...",
      "Parsing empty response...",
      "Rendering zero content...",
      "Applying meaningless styles...",
      "Finalizing the absence of progress...",
      "Connecting to /dev/null...",
      "Awaiting response that will never arrive..."
    ];
    let si = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">It is loading. It will always be loading. This is its purpose.</p>
        <div class="space-y-3 w-full">
          <div class="flex space-x-1">
            ${[0,1,2,3,4,5,6,7].map(i => `<div class="h-1.5 flex-1 rounded-full bg-zinc-700 overflow-hidden"><div id="il-seg-${i}" class="h-full bg-amber-400 w-0 transition-all duration-300"></div></div>`).join("")}
          </div>
          <div id="il-stage" class="text-xs font-mono text-zinc-400 italic">Initializing...</div>
          <div id="il-pct" class="text-xs font-mono text-zinc-600">0% — (will not increase meaningfully)</div>
        </div>
      </div>
    `;
    let pct = 0;
    let segFill = 0;
    _loadingInterval = setInterval(() => {
      si = (si + 1) % stages.length;
      pct = Math.min(pct + Math.random() * 8, 94); // never reaches 100
      segFill = Math.min(Math.floor(pct / 12.5), 7);
      document.getElementById("il-stage").innerText = stages[si];
      document.getElementById("il-pct").innerText = `${Math.round(pct)}% — (will not increase meaningfully)`;
      for (let i = 0; i <= 7; i++) {
        const seg = document.getElementById(`il-seg-${i}`);
        if (seg) seg.style.width = i <= segFill ? "100%" : "0%";
      }
      if (si === 5 && window.WaitlessApp) window.WaitlessApp.recordActivity("infiniteloading", true);
    }, 1400);
  }

  // ──────────────────────────────────────────────
  // 12. IMPORTANT ANNOUNCEMENT GENERATOR
  // ──────────────────────────────────────────────
  function renderAnnouncementGenerator(c) {
    const anns = [
      "ATTENTION: The queue has been updated. No changes have been made.",
      "URGENT: All waiters are reminded that waiting is mandatory.",
      "NOTICE: Queue position changes may occur. They are unrelated to merit.",
      "ADVISORY: The system is operating at maximum efficiency (0%).",
      "ALERT: A waiter has been observed breathing. This has been noted.",
      "BULLETIN: Your patience has been received and will not be rewarded.",
      "UPDATE: The estimated wait time has been recalculated. It is still wrong.",
      "MEMO: Leaving the queue will not improve your situation.",
      "ANNOUNCEMENT: Nothing has happened. Please continue not doing anything.",
      "OFFICIAL NOTICE: The queue exists. Your participation is noted."
    ];
    let annCount = 0;
    c.innerHTML = `
      <div class="space-y-4 py-2">
        <p class="text-xs text-zinc-400 text-center">Generate official-grade announcements. All are equally irrelevant.</p>
        <div id="ann-box" class="p-4 bg-amber-400/5 border border-amber-400/20 rounded-xl text-xs font-mono text-amber-300 min-h-16 flex items-center justify-center text-center leading-relaxed">
          Press the button to receive an announcement.
        </div>
        <button id="ann-btn" class="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">
          Generate Announcement
        </button>
        <div id="ann-count" class="text-[10px] font-mono text-zinc-600 text-center">Announcements received: 0</div>
      </div>
    `;
    document.getElementById("ann-btn").onclick = () => {
      annCount++;
      document.getElementById("ann-box").innerText = anns[(annCount - 1) % anns.length];
      document.getElementById("ann-count").innerText = `Announcements received: ${annCount}`;
      if (annCount >= 5 && window.WaitlessApp) window.WaitlessApp.recordActivity("announcements", true);
    };
  }

  // ──────────────────────────────────────────────
  // 13. QUEUE PREDICTION
  // ──────────────────────────────────────────────
  function renderQueuePrediction(c) {
    const predictions = [
      "You will be at #1 in exactly 14 seconds. (This is not accurate.)",
      "Our models suggest you will reach #1 during a Tuesday. The year is unknown.",
      "Based on current queue velocity, your wait time is: yes.",
      "Prediction: You will remain in the queue for the optimal duration.",
      "Analysis indicates a 73% chance of something happening.",
      "Our AI predicts your position will improve. Or worsen. Confidence: 50%.",
      "According to our proprietary algorithm: soon™.",
      "The queue oracle says: 'Have you tried waiting harder?'",
      "Projected ETA: before the heat death of the universe. Probably."
    ];
    let pIdx = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">Our prediction engine analyzes the queue. It is never right.</p>
        <div id="pred-box" class="w-full p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl text-sm font-display font-bold text-sky-300 min-h-16 flex items-center justify-center text-center leading-relaxed">
          Tap below to receive a prediction.
        </div>
        <div id="pred-conf" class="text-[10px] font-mono text-zinc-600 italic">Confidence: unknown</div>
        <button id="pred-btn" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">
          Predict My Future
        </button>
      </div>
    `;
    document.getElementById("pred-btn").onclick = () => {
      pIdx = (pIdx + 1) % predictions.length;
      document.getElementById("pred-box").innerText = predictions[pIdx];
      document.getElementById("pred-conf").innerText = `Confidence: ${Math.floor(Math.random() * 40 + 10)}% (self-assessed)`;
      if (pIdx >= 3 && window.WaitlessApp) window.WaitlessApp.recordActivity("prediction", true);
    };
  }

  // ──────────────────────────────────────────────
  // 14. PATIENCE TEST
  // ──────────────────────────────────────────────
  function renderPatienceTest(c) {
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">Hold the button for as long as possible without releasing. This measures your patience. It has no other function.</p>
        <div id="pt-display" class="font-mono text-6xl font-black text-white">0.0s</div>
        <div id="pt-rating" class="text-xs text-zinc-500 italic h-4">Press and hold to begin.</div>
        <button id="pt-btn"
          class="px-10 py-6 bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-600 rounded-2xl font-display font-bold text-white text-base select-none touch-none"
          style="user-select: none;"
        >
          HOLD
        </button>
      </div>
    `;
    let startTime = null;
    let iv = null;
    const ratings = [
      [0, "Immediate failure."], [1, "Minimal patience detected."], [3, "Acceptable."],
      [6, "Commendable restraint."], [10, "Remarkable."], [20, "Bordering on concerning."], [30, "Please stop. Or don't."]
    ];
    const btn = document.getElementById("pt-btn");
    const display = document.getElementById("pt-display");
    const rating = document.getElementById("pt-rating");
    const start = () => {
      if (startTime) return;
      startTime = Date.now();
      btn.className = btn.className.replace("bg-zinc-800", "bg-amber-500/20").replace("border-zinc-600", "border-amber-400");
      iv = setInterval(() => {
        const held = (Date.now() - startTime) / 1000;
        display.innerText = held.toFixed(1) + "s";
        const r = [...ratings].reverse().find(([t]) => held >= t);
        if (r) rating.innerText = r[1];
      }, 50);
    };
    const stop = () => {
      if (!startTime) return;
      clearInterval(iv);
      const held = (Date.now() - startTime) / 1000;
      startTime = null;
      btn.className = btn.className.replace("bg-amber-500/20", "bg-zinc-800").replace("border-amber-400", "border-zinc-600");
      rating.innerText = `Final: ${held.toFixed(2)}s — ` + ([...ratings].reverse().find(([t]) => held >= t) || ratings[0])[1];
      if (held >= 3 && window.WaitlessApp) window.WaitlessApp.recordActivity("patiencetest", true);
    };
    btn.addEventListener("mousedown", start);
    btn.addEventListener("touchstart", start, { passive: true });
    btn.addEventListener("mouseup", stop);
    btn.addEventListener("mouseleave", stop);
    btn.addEventListener("touchend", stop);
  }

  // ──────────────────────────────────────────────
  // 15. ABSOLUTELY NOTHING BUTTON
  // ──────────────────────────────────────────────
  function renderAbsolutelyNothing(c) {
    const feedbacks = [
      "Nothing happened.", "Still nothing.", "The button has no effect.",
      "You pressed it. It did not press back.", "Outcome: null.",
      "Event recorded. Consequence: none.", "Action logged. Result: absence of result.",
      "The button exists. That is all.", "This interaction has been archived in /dev/null."
    ];
    let nCount = 0;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">One button. Infinite nothing. Press it anyway.</p>
        <button id="nothing-btn" class="w-48 h-48 rounded-full bg-zinc-900 hover:bg-zinc-800 border-4 border-zinc-700 hover:border-zinc-500 font-display font-bold text-white text-base active:scale-95 transition shadow-xl">
          NOTHING
        </button>
        <div id="nothing-fb" class="text-xs font-mono text-zinc-500 italic h-4"></div>
        <div id="nothing-count" class="text-[10px] font-mono text-zinc-700">Attempts: 0</div>
      </div>
    `;
    document.getElementById("nothing-btn").onclick = () => {
      nCount++;
      document.getElementById("nothing-fb").innerText = feedbacks[nCount % feedbacks.length];
      document.getElementById("nothing-count").innerText = `Attempts: ${nCount}`;
      if (nCount >= 5 && window.WaitlessApp) window.WaitlessApp.recordActivity("absolutelynothing", true);
    };
  }

  // ──────────────────────────────────────────────
  // 16. USELESS TRIVIA
  // ──────────────────────────────────────────────
  function renderUselessTrivia(c) {
    const trivia = [
      { q: "How many times has this queue updated since you joined?", a: "Continuously. The count is irrelevant." },
      { q: "What is the average wait time in this queue?", a: "Somewhere between 1 and 120 seconds. We are extremely precise." },
      { q: "How many former waiters have reached #1?", a: "All of them, eventually. It did not help." },
      { q: "What percentage of users found the queue useful?", a: "0%. We are very proud of this statistic." },
      { q: "Why does this queue exist?", a: "An excellent question with no satisfactory answer." },
      { q: "Can you leave the queue at any time?", a: "Yes. We will remember you left." },
      { q: "Does reaching #1 accomplish anything?", a: "Philosophically: potentially. Practically: no." },
      { q: "What is the purpose of the Patience Level?", a: "Measurement. Not intervention." },
    ];
    let tIdx = 0;
    c.innerHTML = `
      <div class="space-y-4 py-2">
        <p class="text-xs text-zinc-400 text-center">Important facts. None will improve your situation.</p>
        <div class="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
          <div class="text-xs font-display font-bold text-zinc-200" id="trivia-q">${trivia[0].q}</div>
          <div id="trivia-a" class="hidden text-xs font-mono text-amber-400 italic">${trivia[0].a}</div>
        </div>
        <div class="flex space-x-2">
          <button id="trivia-reveal" class="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-mono text-white">Reveal Answer</button>
          <button id="trivia-next" class="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-400">Next Fact</button>
        </div>
        <div id="trivia-count" class="text-[10px] font-mono text-zinc-700 text-center">Fact 1 of ${trivia.length}</div>
      </div>
    `;
    let triviaInteract = 0;
    document.getElementById("trivia-reveal").onclick = () => {
      document.getElementById("trivia-a").classList.remove("hidden");
      triviaInteract++;
      if (triviaInteract >= 3 && window.WaitlessApp) window.WaitlessApp.recordActivity("trivia", true);
    };
    document.getElementById("trivia-next").onclick = () => {
      tIdx = (tIdx + 1) % trivia.length;
      document.getElementById("trivia-q").innerText = trivia[tIdx].q;
      document.getElementById("trivia-a").innerText = trivia[tIdx].a;
      document.getElementById("trivia-a").classList.add("hidden");
      document.getElementById("trivia-count").innerText = `Fact ${tIdx + 1} of ${trivia.length}`;
    };
  }

  // ──────────────────────────────────────────────
  // 17. TIME WASTER
  // ──────────────────────────────────────────────
  function renderTimeWaster(c) {
    let wastedMs = 0;
    let running = false;
    c.innerHTML = `
      <div class="flex flex-col items-center space-y-5 py-4 text-center">
        <p class="text-xs text-zinc-400">Precisely engineered to consume time. No other function is present.</p>
        <div class="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl w-full space-y-3">
          <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Time Wasted</div>
          <div id="tw-display" class="font-mono text-4xl font-black text-white">00:00.0</div>
          <div id="tw-verdict" class="text-xs font-mono text-zinc-500 italic">Not started.</div>
        </div>
        <div class="flex space-x-2 w-full">
          <button id="tw-start" class="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-white text-sm active:scale-95 transition">Start Wasting</button>
          <button id="tw-stop" class="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl font-display font-bold text-zinc-500 text-sm active:scale-95 transition">Stop</button>
        </div>
        <div id="tw-milestones" class="text-[10px] font-mono text-zinc-700 italic h-4"></div>
      </div>
    `;
    const milestones = [
      [5000, "5 seconds. A respectable start."], [15000, "15 seconds. Deeply committed."],
      [30000, "30 seconds. This was preventable."], [60000, "One minute. You have truly wasted time."]
    ];
    let iv = null;
    const start = Date.now();
    document.getElementById("tw-start").onclick = () => {
      if (running) return;
      running = true;
      const t0 = Date.now();
      document.getElementById("tw-verdict").innerText = "Wasting time...";
      if (window.WaitlessApp) window.WaitlessApp.recordActivity("timewaster", false);
      iv = setInterval(() => {
        wastedMs = Date.now() - t0;
        const m = Math.floor(wastedMs / 60000);
        const s = Math.floor((wastedMs % 60000) / 1000);
        const ds = Math.floor((wastedMs % 1000) / 100);
        document.getElementById("tw-display").innerText = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${ds}`;
        const reached = milestones.filter(([ms]) => wastedMs >= ms);
        if (reached.length > 0) {
          document.getElementById("tw-milestones").innerText = reached[reached.length - 1][1];
        }
        if (wastedMs >= 15000 && window.WaitlessApp) window.WaitlessApp.recordActivity("timewaster", true);
      }, 100);
      _activeTimer = iv;
    };
    document.getElementById("tw-stop").onclick = () => {
      if (!running) return;
      clearInterval(iv); iv = null; running = false;
      document.getElementById("tw-verdict").innerText = `Stopped at ${(wastedMs / 1000).toFixed(1)}s. Time successfully wasted.`;
    };
  }

  return { init, getById, renderGrid, renderActivity, stopActiveActivity };
})();

window.Activities = Activities;

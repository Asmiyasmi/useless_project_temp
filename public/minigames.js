/**
 * WAITLESS - 14 Satirical Mini-Games
 * These games are purely for entertainment while waiting.
 * They never pause the queue, extend wait time, or alter completion.
 */

const MiniGames = {
  activeGame: null,
  container: null,

  init(containerEl) {
    this.container = containerEl;
  },

  gamesList: [
    { id: "click100", name: "Click 100 Times", icon: "??", desc: "Click the button 100 times. Why? No reason." },
    { id: "loadingCircle", name: "Loading Circle", icon: "??", desc: "Watch a circle load nothing with high precision." },
    { id: "doNotPress", name: "Do Not Press", icon: "??", desc: "A button that insists it should not be touched." },
    { id: "randomNumber", name: "Random Number", icon: "??", desc: "Generate numbers that mean absolutely nothing." },
    { id: "coinFlip", name: "Coin Flip", icon: "??", desc: "Leave meaningless choices to a 50/50 virtual coin." },
    { id: "diceRoll", name: "Dice Roll", icon: "??", desc: "Roll a virtual d6 with zero stakes." },
    { id: "movingButton", name: "Moving Button", icon: "??", desc: "Try to click a button that refuses to be clicked." },
    { id: "rps", name: "Rock Paper Scissors", icon: "??", desc: "Play against an indifferent machine." },
    { id: "guessNumber", name: "Guess the Number", icon: "?", desc: "Guess a number between 1 and 50." },
    { id: "reactionTest", name: "Reaction Test", icon: "?", desc: "Test how fast you can respond to green." },
    { id: "tapDot", name: "Tap the Dot", icon: "??", desc: "Tap the evasive dot 5 times." },
    { id: "memoryButton", name: "Memory Button", icon: "??", desc: "Remember the 4-color flashing sequence." },
    { id: "randomYesNo", name: "Random Yes / No", icon: "??", desc: "Consult the oracle for trivial decisions." },
    { id: "uselessCounter", name: "Useless Counter", icon: "?", desc: "Increment and decrement with zero purpose." }
  ],

  renderGameSelector(onSelectGame) {
    let html = `
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2">
    `;
    this.gamesList.forEach(g => {
      html += `
        <button onclick="MiniGames.launchGame('${g.id}')" class="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 rounded-xl flex flex-col items-center text-center transition-all duration-200 group">
          <span class="text-3xl mb-1 group-hover:scale-110 transition-transform">${g.icon}</span>
          <span class="font-semibold text-zinc-200 text-xs sm:text-sm line-clamp-1">${g.name}</span>
          <span class="text-[10px] text-zinc-400 mt-1 line-clamp-2">${g.desc}</span>
        </button>
      `;
    });
    html += `</div>`;
    return html;
  },

  launchGame(gameId) {
    this.activeGame = gameId;
    if (window.WaitlessApp) {
      window.WaitlessApp.recordActivity(gameId, false);
    }
    const target = document.getElementById("minigame-view");
    if (!target) return;

    document.getElementById("minigame-list").classList.add("hidden");
    target.classList.remove("hidden");

    switch(gameId) {
      case "click100": this.renderClick100(target); break;
      case "loadingCircle": this.renderLoadingCircle(target); break;
      case "doNotPress": this.renderDoNotPress(target); break;
      case "randomNumber": this.renderRandomNumber(target); break;
      case "coinFlip": this.renderCoinFlip(target); break;
      case "diceRoll": this.renderDiceRoll(target); break;
      case "movingButton": this.renderMovingButton(target); break;
      case "rps": this.renderRPS(target); break;
      case "guessNumber": this.renderGuessNumber(target); break;
      case "reactionTest": this.renderReactionTest(target); break;
      case "tapDot": this.renderTapDot(target); break;
      case "memoryButton": this.renderMemoryButton(target); break;
      case "randomYesNo": this.renderRandomYesNo(target); break;
      case "uselessCounter": this.renderUselessCounter(target); break;
      default: target.innerHTML = "<p>Game not found.</p>";
    }
  },

  closeActiveGame() {
    this.activeGame = null;
    const view = document.getElementById("minigame-view");
    const list = document.getElementById("minigame-list");
    if (view) view.classList.add("hidden");
    if (list) list.classList.remove("hidden");
  },

  notifyComplete(gameId) {
    if (window.WaitlessApp) {
      window.WaitlessApp.recordActivity(gameId, true);
    }
  },

  // 1. Click 100 Times
  renderClick100(container) {
    let clicks = 0;
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Click 100 Times</h3>
        <p class="text-xs text-zinc-400">Target: Reach 100 clicks. Reward: Nothing.</p>
        <div class="w-full bg-zinc-800 rounded-full h-4 overflow-hidden border border-zinc-700">
          <div id="c100-bar" class="bg-amber-400 h-full transition-all duration-100" style="width: 0%"></div>
        </div>
        <div id="c100-count" class="text-4xl font-mono font-black text-white">0 / 100</div>
        <button id="c100-btn" class="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-2xl text-lg shadow-lg active:scale-95 transition-transform">
          CLICK ME!
        </button>
        <div id="c100-msg" class="text-sm text-zinc-400 h-6">Waiting for click #1...</div>
      </div>
    `;
    const btn = document.getElementById("c100-btn");
    const countEl = document.getElementById("c100-count");
    const barEl = document.getElementById("c100-bar");
    const msgEl = document.getElementById("c100-msg");

    const milestones = {
      10: "You're 10% closer to the exact same place.",
      25: "A quarter of the way through nothingness.",
      50: "Halfway mark! Your finger must be questioning life.",
      75: "Almost there! Brace for zero rewards.",
      100: "CONGRATULATIONS! You clicked 100 times. Nothing happened."
    };

    btn.onclick = () => {
      clicks++;
      countEl.innerText = `${clicks} / 100`;
      barEl.style.width = `${clicks}%`;
      if (milestones[clicks]) {
        msgEl.innerText = milestones[clicks];
      }
      if (clicks >= 100) {
        btn.disabled = true;
        btn.innerText = "DONE (0% GAINED)";
        btn.classList.replace("bg-amber-500", "bg-zinc-700");
        this.notifyComplete("click100");
      }
    };
  },

  // 2. Loading Circle
  renderLoadingCircle(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">The Infinite Spinner</h3>
        <p class="text-xs text-zinc-400">Calibrating nothingness in real time...</p>
        <div class="relative w-28 h-28 flex items-center justify-center">
          <div id="loading-spinner" class="w-24 h-24 border-4 border-zinc-700 border-t-amber-400 rounded-full animate-spin"></div>
          <span id="loading-pct" class="absolute text-sm font-mono font-bold text-white">42%</span>
        </div>
        <div class="text-xs font-mono text-zinc-400" id="loading-task">Buffering empty packets...</div>
        <div class="flex space-x-2">
          <button onclick="MiniGames.cycleLoadingSpeed(this)" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300">
            Speed: Normal
          </button>
        </div>
      </div>
    `;
    const pctEl = document.getElementById("loading-pct");
    const taskEl = document.getElementById("loading-task");
    const tasks = [
      "Downloading absence...", "Defragmenting empty memory...", "Calculating queue friction...",
      "Simulating progress...", "Optimizing uselessness...", "Verifying nothing changed..."
    ];
    let pct = 0;
    const interval = setInterval(() => {
      if (this.activeGame !== "loadingCircle") {
        clearInterval(interval);
        return;
      }
      pct = (pct + 1) % 101;
      pctEl.innerText = pct + "%";
      if (pct % 20 === 0) {
        taskEl.innerText = tasks[Math.floor(Math.random() * tasks.length)];
      }
    }, 120);
  },

  cycleLoadingSpeed(btn) {
    const spinner = document.getElementById("loading-spinner");
    if (!spinner) return;
    if (spinner.classList.contains("animate-spin")) {
      spinner.style.animationDuration = "0.2s";
      btn.innerText = "Speed: Ludicrous";
    } else {
      spinner.style.animationDuration = "1s";
      btn.innerText = "Speed: Normal";
    }
  },

  // 3. Do Not Press
  renderDoNotPress(container) {
    let pressCount = 0;
    const sassyResponses = [
      "I clearly said DO NOT PRESS.",
      "Are you proud of disobeying a CSS rectangle?",
      "Every click adds zero seconds of productivity.",
      "Stop it.",
      "Seriously, there are no easter eggs here.",
      "The queue doesn't care about your rebellion.",
      "You pressed it 7 times now. Happy?",
      "A black hole was not created, but you still wasted time.",
      "Keep clicking. See if I care."
    ];
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-red-500">Hazard Warning</h3>
        <p class="text-xs text-zinc-400">Do not touch the button below under any circumstances.</p>
        <button id="dnp-btn" class="w-36 h-36 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-2xl border-4 border-red-800 active:scale-90 transition-transform">
          DO NOT<br>PRESS
        </button>
        <p id="dnp-msg" class="text-sm font-semibold text-zinc-300 h-10 px-4">Resistance is recommended.</p>
      </div>
    `;
    const btn = document.getElementById("dnp-btn");
    const msg = document.getElementById("dnp-msg");
    btn.onclick = () => {
      pressCount++;
      const text = sassyResponses[(pressCount - 1) % sassyResponses.length];
      msg.innerText = text;
      if (pressCount >= 5) this.notifyComplete("doNotPress");
    };
  },

  // 4. Random Number
  renderRandomNumber(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Meaningless Number Oracle</h3>
        <p class="text-xs text-zinc-400">Guaranteed to not be your queue position.</p>
        <div id="rn-num" class="text-6xl font-mono font-black text-amber-400 py-4">???</div>
        <p id="rn-comment" class="text-xs text-zinc-400 h-6">Click below to generate an integer.</p>
        <button id="rn-btn" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-semibold rounded-xl text-sm transition">
          Generate Number
        </button>
      </div>
    `;
    const numEl = document.getElementById("rn-num");
    const cmtEl = document.getElementById("rn-comment");
    const comments = [
      "This number will not improve your wait.",
      "Mathematically indisputable, practically worthless.",
      "Calculated via quantum indecision.",
      "Statistically irrelevant to everything.",
      "Scientists agree: this is indeed a number."
    ];
    document.getElementById("rn-btn").onclick = () => {
      const val = Math.floor(Math.random() * 999999);
      numEl.innerText = val.toLocaleString();
      cmtEl.innerText = comments[Math.floor(Math.random() * comments.length)];
      this.notifyComplete("randomNumber");
    };
  },

  // 5. Coin Flip
  renderCoinFlip(container) {
    let heads = 0, tails = 0;
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">50/50 Coin Flipper</h3>
        <div id="coin-disc" class="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-amber-500 shadow-xl flex items-center justify-center text-3xl font-black text-zinc-900 transition-all duration-500">
          ?
        </div>
        <div class="flex space-x-6 text-sm font-mono text-zinc-300">
          <div>Heads: <span id="cf-h">0</span></div>
          <div>Tails: <span id="cf-t">0</span></div>
        </div>
        <button id="cf-btn" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm active:scale-95 transition-transform">
          Flip Coin
        </button>
      </div>
    `;
    const coin = document.getElementById("coin-disc");
    const hEl = document.getElementById("cf-h");
    const tEl = document.getElementById("cf-t");
    const btn = document.getElementById("cf-btn");

    btn.onclick = () => {
      btn.disabled = true;
      coin.classList.add("rotate-[720deg]", "scale-110");
      setTimeout(() => {
        coin.classList.remove("rotate-[720deg]", "scale-110");
        const isHeads = Math.random() < 0.5;
        if (isHeads) {
          heads++;
          coin.innerText = "H";
          hEl.innerText = heads;
        } else {
          tails++;
          coin.innerText = "T";
          tEl.innerText = tails;
        }
        btn.disabled = false;
        this.notifyComplete("coinFlip");
      }, 500);
    };
  },

  // 6. Dice Roll
  renderDiceRoll(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Virtual Die</h3>
        <div id="dice-cube" class="w-24 h-24 bg-zinc-800 border-2 border-zinc-600 rounded-2xl shadow-xl flex items-center justify-center text-5xl font-black text-amber-400 transition-all duration-300">
          ?
        </div>
        <button id="dice-btn" class="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-semibold rounded-xl text-sm transition active:scale-95">
          Roll Die
        </button>
      </div>
    `;
    const diceFaces = ["?", "?", "?", "?", "?", "?"];
    const cube = document.getElementById("dice-cube");
    const btn = document.getElementById("dice-btn");

    btn.onclick = () => {
      cube.classList.add("scale-90", "rotate-45");
      setTimeout(() => {
        cube.classList.remove("scale-90", "rotate-45");
        const roll = Math.floor(Math.random() * 6);
        cube.innerText = diceFaces[roll];
        this.notifyComplete("diceRoll");
      }, 200);
    };
  },

  // 7. Moving Button
  renderMovingButton(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Moving Button</h3>
        <p class="text-xs text-zinc-400">Catch it if you can.</p>
        <div id="mb-arena" class="relative w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button id="mb-btn" class="absolute top-16 left-28 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all duration-150">
            Click Me!
          </button>
        </div>
        <p id="mb-status" class="text-xs text-zinc-500">Dodged: 0 times</p>
      </div>
    `;
    const btn = document.getElementById("mb-btn");
    const arena = document.getElementById("mb-arena");
    const status = document.getElementById("mb-status");
    let dodges = 0;

    btn.onmouseenter = () => {
      dodges++;
      const maxW = arena.clientWidth - 100;
      const maxH = arena.clientHeight - 40;
      const randX = Math.max(10, Math.floor(Math.random() * maxW));
      const randY = Math.max(10, Math.floor(Math.random() * maxH));
      btn.style.left = randX + "px";
      btn.style.top = randY + "px";
      status.innerText = `Dodged: ${dodges} times`;
    };

    btn.onclick = () => {
      status.innerText = "IMPOSSIBLE! You caught the moving button!";
      btn.classList.replace("bg-emerald-500", "bg-amber-400");
      this.notifyComplete("movingButton");
    };
  },

  // 8. Rock Paper Scissors
  renderRPS(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Rock Paper Scissors</h3>
        <p class="text-xs text-zinc-400">Play against a disinterested server.</p>
        <div class="flex justify-center space-x-3">
          <button onclick="MiniGames.playRPS('?? Rock')" class="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-2xl">??</button>
          <button onclick="MiniGames.playRPS('?? Paper')" class="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-2xl">??</button>
          <button onclick="MiniGames.playRPS('?? Scissors')" class="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-2xl">??</button>
        </div>
        <div id="rps-result" class="text-sm font-semibold text-zinc-300 h-8">Make your choice.</div>
      </div>
    `;
  },

  playRPS(userChoice) {
    const options = ["?? Rock", "?? Paper", "?? Scissors"];
    const compChoice = options[Math.floor(Math.random() * options.length)];
    const el = document.getElementById("rps-result");
    if (!el) return;

    if (userChoice === compChoice) {
      el.innerText = `Tie! Both chose ${userChoice}.`;
    } else if (
      (userChoice.includes("Rock") && compChoice.includes("Scissors")) ||
      (userChoice.includes("Paper") && compChoice.includes("Rock")) ||
      (userChoice.includes("Scissors") && compChoice.includes("Paper"))
    ) {
      el.innerText = `You won! ${userChoice} beats ${compChoice}.`;
    } else {
      el.innerText = `You lost! ${compChoice} beats ${userChoice}.`;
    }
    this.notifyComplete("rps");
  },

  // 9. Guess the Number
  renderGuessNumber(container) {
    const targetNum = Math.floor(Math.random() * 50) + 1;
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Guess The Number</h3>
        <p class="text-xs text-zinc-400">Guess a secret number between 1 and 50.</p>
        <div class="flex items-center space-x-2">
          <input id="gn-input" type="number" min="1" max="50" placeholder="1-50" class="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-center focus:border-amber-400 outline-none" />
          <button id="gn-btn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm">
            Guess
          </button>
        </div>
        <div id="gn-msg" class="text-xs text-zinc-300 h-6">Enter a number and click Guess.</div>
      </div>
    `;
    const input = document.getElementById("gn-input");
    const btn = document.getElementById("gn-btn");
    const msg = document.getElementById("gn-msg");

    btn.onclick = () => {
      const val = parseInt(input.value);
      if (isNaN(val)) return;
      if (val === targetNum) {
        msg.innerText = `?? CORRECT! It was ${targetNum}. Zero points awarded.`;
        msg.classList.add("text-emerald-400");
        this.notifyComplete("guessNumber");
      } else if (val < targetNum) {
        msg.innerText = `${val} is TOO LOW. Try higher.`;
      } else {
        msg.innerText = `${val} is TOO HIGH. Try lower.`;
      }
    };
  },

  // 10. Reaction Test
  renderReactionTest(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Reaction Test</h3>
        <p class="text-xs text-zinc-400">Click the box as soon as it turns GREEN.</p>
        <div id="rx-box" class="w-full h-36 rounded-2xl bg-red-600/80 hover:cursor-pointer flex items-center justify-center text-white font-extrabold text-lg select-none transition-colors duration-200">
          Click to Start
        </div>
        <div id="rx-time" class="text-sm font-mono text-zinc-400 h-6"></div>
      </div>
    `;
    const box = document.getElementById("rx-box");
    const timeEl = document.getElementById("rx-time");
    let state = "idle"; // idle, waiting, green
    let startTime = 0;
    let timer = null;

    box.onclick = () => {
      if (state === "idle") {
        state = "waiting";
        box.innerText = "WAIT FOR GREEN...";
        box.className = "w-full h-36 rounded-2xl bg-amber-600/80 hover:cursor-pointer flex items-center justify-center text-white font-extrabold text-lg select-none";
        timeEl.innerText = "";
        const delay = Math.floor(Math.random() * 2500) + 1500;
        timer = setTimeout(() => {
          state = "green";
          startTime = Date.now();
          box.innerText = "CLICK NOW!";
          box.className = "w-full h-36 rounded-2xl bg-emerald-500 hover:cursor-pointer flex items-center justify-center text-black font-extrabold text-xl select-none";
        }, delay);
      } else if (state === "waiting") {
        clearTimeout(timer);
        state = "idle";
        box.innerText = "TOO EARLY! Click to retry";
        box.className = "w-full h-36 rounded-2xl bg-red-600 hover:cursor-pointer flex items-center justify-center text-white font-extrabold text-sm select-none";
      } else if (state === "green") {
        const ms = Date.now() - startTime;
        state = "idle";
        box.innerText = `${ms} ms! Click to try again`;
        box.className = "w-full h-36 rounded-2xl bg-zinc-800 hover:cursor-pointer flex items-center justify-center text-amber-400 font-extrabold text-lg select-none border border-zinc-700";
        timeEl.innerText = `Reaction Speed: ${ms}ms`;
        this.notifyComplete("reactionTest");
      }
    };
  },

  // 11. Tap the Dot
  renderTapDot(container) {
    let taps = 0;
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Tap The Dot</h3>
        <p class="text-xs text-zinc-400">Tap the dot 5 times to finish.</p>
        <div id="td-arena" class="relative w-full h-44 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div id="td-dot" class="absolute w-8 h-8 rounded-full bg-amber-400 shadow-lg cursor-pointer flex items-center justify-center text-black font-bold text-xs top-16 left-28">
            •
          </div>
        </div>
        <div id="td-score" class="text-xs text-zinc-400">Taps: 0 / 5</div>
      </div>
    `;
    const dot = document.getElementById("td-dot");
    const arena = document.getElementById("td-arena");
    const score = document.getElementById("td-score");

    const moveDot = () => {
      const maxW = arena.clientWidth - 40;
      const maxH = arena.clientHeight - 40;
      dot.style.left = Math.max(10, Math.floor(Math.random() * maxW)) + "px";
      dot.style.top = Math.max(10, Math.floor(Math.random() * maxH)) + "px";
    };

    dot.onclick = () => {
      taps++;
      score.innerText = `Taps: ${taps} / 5`;
      moveDot();
      if (taps >= 5) {
        score.innerText = "Completed! 5 dots squashed.";
        dot.style.display = "none";
        this.notifyComplete("tapDot");
      }
    };
  },

  // 12. Memory Button
  renderMemoryButton(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Memory Quad</h3>
        <p class="text-xs text-zinc-400">Memorize and repeat the flashing order.</p>
        <div class="grid grid-cols-2 gap-3 w-44 h-44">
          <button id="mem-0" onclick="MiniGames.handleMemInput(0)" class="rounded-xl bg-red-600 opacity-60 transition-opacity"></button>
          <button id="mem-1" onclick="MiniGames.handleMemInput(1)" class="rounded-xl bg-blue-600 opacity-60 transition-opacity"></button>
          <button id="mem-2" onclick="MiniGames.handleMemInput(2)" class="rounded-xl bg-green-600 opacity-60 transition-opacity"></button>
          <button id="mem-3" onclick="MiniGames.handleMemInput(3)" class="rounded-xl bg-yellow-500 opacity-60 transition-opacity"></button>
        </div>
        <button id="mem-start" onclick="MiniGames.startMemoryGame()" class="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-xs">
          Start Sequence
        </button>
        <div id="mem-status" class="text-xs text-zinc-400 h-4">Press start to begin.</div>
      </div>
    `;
    this.memSeq = [];
    this.memUserIdx = 0;
  },

  startMemoryGame() {
    this.memSeq = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    this.memUserIdx = 0;
    const status = document.getElementById("mem-status");
    status.innerText = "Watch the sequence...";
    
    this.memSeq.forEach((val, i) => {
      setTimeout(() => {
        const btn = document.getElementById(`mem-${val}`);
        if (btn) {
          btn.classList.add("opacity-100", "scale-105");
          setTimeout(() => btn.classList.remove("opacity-100", "scale-105"), 400);
        }
      }, (i + 1) * 600);
    });

    setTimeout(() => {
      status.innerText = "Your turn! Repeat the pattern.";
    }, (this.memSeq.length + 1) * 600);
  },

  handleMemInput(val) {
    if (!this.memSeq || this.memSeq.length === 0) return;
    const status = document.getElementById("mem-status");
    if (this.memSeq[this.memUserIdx] === val) {
      this.memUserIdx++;
      if (this.memUserIdx === this.memSeq.length) {
        status.innerText = "Pattern correct! Master of useless recall.";
        this.notifyComplete("memoryButton");
        this.memSeq = [];
      }
    } else {
      status.innerText = "Wrong! Memory erased.";
      this.memSeq = [];
    }
  },

  // 13. Random Yes / No
  renderRandomYesNo(container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">Existential Yes / No</h3>
        <p class="text-xs text-zinc-400">Ask any dilemma; receive an indifferent verdict.</p>
        <input type="text" id="yn-q" placeholder="Should I keep waiting?" class="w-full max-w-xs px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white text-center outline-none focus:border-amber-400" />
        <div id="yn-answer" class="text-4xl font-black text-white font-mono py-2">???</div>
        <button id="yn-btn" class="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-semibold rounded-xl text-xs">
          Consult Oracle
        </button>
      </div>
    `;
    const answers = [
      "YES", "NO", "ABSOLUTELY NOT", "PERHAPS", "UNCLEAR", "ASK AGAIN NEVER", "WHO CARES"
    ];
    document.getElementById("yn-btn").onclick = () => {
      const a = answers[Math.floor(Math.random() * answers.length)];
      const el = document.getElementById("yn-answer");
      el.innerText = a;
      if (a.includes("YES")) el.className = "text-4xl font-black text-emerald-400 font-mono py-2";
      else if (a.includes("NO")) el.className = "text-4xl font-black text-red-500 font-mono py-2";
      else el.className = "text-4xl font-black text-amber-400 font-mono py-2";
      this.notifyComplete("randomYesNo");
    };
  },

  // 14. Useless Counter
  renderUselessCounter(container) {
    let count = 0;
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h3 class="text-xl font-bold text-amber-400">The Useless Counter</h3>
        <p class="text-xs text-zinc-400">Add or subtract numbers with zero impact on anything.</p>
        <div id="uc-val" class="text-6xl font-mono font-black text-white">0</div>
        <div class="flex space-x-3">
          <button id="uc-sub" class="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-2xl font-bold">-</button>
          <button id="uc-add" class="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-2xl font-bold">+</button>
        </div>
      </div>
    `;
    const valEl = document.getElementById("uc-val");
    document.getElementById("uc-sub").onclick = () => {
      count--;
      valEl.innerText = count;
      this.notifyComplete("uselessCounter");
    };
    document.getElementById("uc-add").onclick = () => {
      count++;
      valEl.innerText = count;
      this.notifyComplete("uselessCounter");
    };
  }
};

window.MiniGames = MiniGames;

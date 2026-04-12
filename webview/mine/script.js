// --- DOM ---
const board = document.getElementById("game-board");
const flagsDisplay = document.getElementById("flags");
const restartBtn = document.getElementById("restart-btn");
const winScreen = document.getElementById("win-screen");
const modeSelect = document.getElementById("mode-select");
const timerDisplay = document.getElementById("timer");
const bestDisplay = document.getElementById("best");

// --- SETTINGS ---
let SIZE = 6;
let MINES = 6;
let CELL_SIZE = 60;

// --- STATE ---
let cells = [];
let flags = 0;
let revealedCount = 0;
let minesPlaced = false;
let gameOver = false;

// --- TIMER ---
let timer = 0;
let timerInterval = null;

// --- MODE ---
function setMode(mode) {
  if (mode === "easy") { SIZE = 5; MINES = 5; CELL_SIZE = 80; }
  else if (mode === "normal") { SIZE = 6; MINES = 6; CELL_SIZE = 70; }
  else if (mode === "hard") { SIZE = 8; MINES = 12; CELL_SIZE = 50; }
}

// --- INIT ---
function initGame() {
  setMode(modeSelect.value);

  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${SIZE}, ${CELL_SIZE}px)`;

  winScreen.classList.add("hidden");

  cells = [];
  flags = 0;
  revealedCount = 0;
  minesPlaced = false;
  gameOver = false;

  flagsDisplay.textContent = "Flags: 0";

  // Timer reset
  clearInterval(timerInterval);
  timer = 0;
  timerDisplay.textContent = "Time: 0";

  loadBestScore();

  for (let y = 0; y < SIZE; y++) {
    cells[y] = [];
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.width = `${CELL_SIZE}px`;
      cell.style.height = `${CELL_SIZE}px`;

      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.dataset.mine = "false";
      cell.dataset.revealed = "false";
      cell.dataset.flagged = "false";

      cell.addEventListener("click", handleFirstClick);
      cell.addEventListener("contextmenu", toggleFlag);

      board.appendChild(cell);
      cells[y][x] = cell;
    }
  }
}

// --- TIMER START ---
function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.textContent = `Time: ${timer}`;
  }, 1000);
}

// --- BEST SCORE ---
function getBestKey() {
  return `minesweeper-best-${SIZE}-${MINES}`;
}

function loadBestScore() {
  const best = localStorage.getItem(getBestKey());
  bestDisplay.textContent = best ? `Best: ${best}s` : "Best: --";
}

function saveBestScore() {
  const key = getBestKey();
  const best = localStorage.getItem(key);
  if (!best || timer < best) {
    localStorage.setItem(key, timer);
  }
}

// --- FIRST CLICK ---
function handleFirstClick(e) {
  if (gameOver) return;

  const cell = e.currentTarget;
  if (cell.dataset.flagged === "true") return;

  if (!minesPlaced) {
    placeMinesAvoiding(+cell.dataset.x, +cell.dataset.y);
    minesPlaced = true;
    startTimer();

    for (let row of cells) {
      for (let c of row) {
        c.removeEventListener("click", handleFirstClick);
        c.addEventListener("click", revealCell);
      }
    }
  }

  revealCell(e);
}

// --- MINE PLACEMENT ---
function placeMinesAvoiding(xAvoid, yAvoid) {
  const positions = [];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (Math.abs(x - xAvoid) <= 1 && Math.abs(y - yAvoid) <= 1) continue;
      positions.push({ x, y });
    }
  }

  shuffle(positions);

  for (let i = 0; i < MINES; i++) {
    const p = positions[i];
    cells[p.y][p.x].dataset.mine = "true";
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// --- REVEAL ---
function revealCell(e) {
  if (gameOver) return;

  const cell = e.currentTarget;
  if (cell.dataset.revealed === "true" || cell.dataset.flagged === "true") return;

  cell.dataset.revealed = "true";
  cell.classList.add("revealed");

  if (cell.dataset.mine === "true") {
    triggerExplosion(cell);
    return;
  }

  revealedCount++;

  const count = countMines(cell);
  if (count > 0) {
    cell.dataset.number = count;
    cell.textContent = count;
  } else {
    revealNeighbors(cell);
  }

  checkWin();
}

// --- REVEAL NEIGHBORS ---
function revealNeighbors(cell) {
  const x = +cell.dataset.x;
  const y = +cell.dataset.y;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
        const n = cells[ny][nx];
        if (n.dataset.revealed === "false" && n.dataset.flagged === "false") {
          revealCell({ currentTarget: n });
        }
      }
    }
  }
}

// --- COUNT ---
function countMines(cell) {
  const x = +cell.dataset.x;
  const y = +cell.dataset.y;
  let count = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) {
        if (cells[ny][nx].dataset.mine === "true") count++;
      }
    }
  }
  return count;
}

// --- FLAGS ---
function toggleFlag(e) {
  e.preventDefault();
  if (gameOver) return;

  const cell = e.currentTarget;
  if (cell.dataset.revealed === "true") return;

  if (cell.dataset.flagged === "true") {
    cell.dataset.flagged = "false";
    cell.classList.remove("flagged");
    cell.textContent = "";
    flags--;
  } else {
    cell.dataset.flagged = "true";
    cell.classList.add("flagged");
    cell.textContent = "🚩";
    flags++;
  }

  flagsDisplay.textContent = `Flags: ${flags}`;
}

// --- EXPLOSION (CHAIN EFFECT) ---

function createParticles(x, y) {
  const particleCount = 18;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;

    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;

    p.style.setProperty("--dx", dx);
    p.style.setProperty("--dy", dy);

    p.style.background = `hsl(${Math.random()*30}, 100%, 50%)`; // fiery colors

    document.body.appendChild(p);

    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 300);

    setTimeout(() => p.remove(), 600);
  }
}

function explodeCell(cell) {
  const rect = cell.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  cell.classList.add("boom");

  createParticles(centerX, centerY);
}

function triggerExplosion(startCell) {
  gameOver = true;
  clearInterval(timerInterval);

  const bombs = [];

  for (let row of cells) {
    for (let c of row) {
      if (c.dataset.mine === "true") bombs.push(c);
    }
  }

  bombs.sort((a, b) => {
    const dx1 = a.dataset.x - startCell.dataset.x;
    const dy1 = a.dataset.y - startCell.dataset.y;
    const dx2 = b.dataset.x - startCell.dataset.x;
    const dy2 = b.dataset.y - startCell.dataset.y;
    return (dx1*dx1 + dy1*dy1) - (dx2*dx2 + dy2*dy2);
  });

  bombs.forEach((b, i) => {
    setTimeout(() => explodeCell(b), i * 80);
  });

  setTimeout(() => {
    showEndScreen("💥 Game Over! 💥");
  }, bombs.length * 80 + 400);
}

// --- WIN ---
function checkWin() {
  if (revealedCount === SIZE * SIZE - MINES) {
    gameOver = true;
    clearInterval(timerInterval);
    saveBestScore();
    showConfetti();
    showEndScreen("🎉 You Win! 🎉");
  }
}

// --- END SCREEN ---
function showEndScreen(text) {
  winScreen.innerHTML = "";

  const msg = document.createElement("div");
  msg.textContent = text;
  msg.style.marginBottom = "20px";

  const btn = document.createElement("button");
  btn.textContent = "Play Again";
  btn.onclick = initGame;

  winScreen.appendChild(msg);
  winScreen.appendChild(btn);
  winScreen.classList.remove("hidden");
}

// --- CONFETTI ---
function showConfetti() {
  for (let i = 0; i < 120; i++) {
    const conf = document.createElement("div");
    conf.classList.add("confetti");

    conf.style.left = Math.random() * 100 + "vw";
    conf.style.backgroundColor = `hsl(${Math.random()*360},100%,50%)`;
    conf.style.animationDuration = (Math.random()*2 + 2) + "s";

    document.body.appendChild(conf);

    setTimeout(() => conf.remove(), 3000);
  }
}

// --- EVENTS ---
restartBtn.addEventListener("click", initGame);
modeSelect.addEventListener("change", initGame);

// --- START ---
initGame();
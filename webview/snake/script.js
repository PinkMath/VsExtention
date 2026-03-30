const vscode = acquireVsCodeApi();

// ---------- DOM ELEMENTS ---------- //
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: true });
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("high");
const overlay = document.getElementById("overlay");

// ---------- CONSTANTS ---------- //
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// ---------- STATE ---------- //
const state = {
  snake: [{ x: 10, y: 10 }],
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  food: null,
  bonusFood: null,
  score: 0,
  running: false,
  particles: [],
  speed: 90,
  lastUpdate: 0,
};

// ---------- CONFIGURATION ---------- //
const speeds = {
  slow: 140,
  normal: 90,
  fast: 60,
  insane: 35,
};

let selectedSpeed = localStorage.getItem("snakeSpeed") || "normal";
let currentSkin = localStorage.getItem("snakeSkin") || "classic";
let highScore = Number(localStorage.getItem("snakeHigh")) || 0;

highEl.textContent = highScore;

// ---------- SKINS ---------- //
const skins = {
  classic: { head: "#4ade80", body: "#22c55e", food: "#ef4444" },
  neon: { head: "#00ffff", body: "#00ffcc", food: "#ff00ff" },
  fire: { head: "#f97316", body: "#ef4444", food: "#fde047" },
  purple: { head: "#c084fc", body: "#a855f7", food: "#f472b6" },
  rainbow: { head: "#ffffff", body: "rainbow", food: "#ffffff" },
};

// ---------- AUDIO ---------- //
const eatSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
);
const dieSound = new Audio(
  "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
);

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  eatSound
    .play()
    .then(() => eatSound.pause())
    .catch(() => {});
  dieSound
    .play()
    .then(() => dieSound.pause())
    .catch(() => {});
}

// Unlock audio on first user interaction
["click", "keydown", "touchstart"].forEach((event) => {
  window.addEventListener(event, unlockAudio, { once: true });
});

// ---------- GAME LOGIC ---------- //
function startGame() {
  let count = 3;

  state.running = false;
  overlay.innerHTML = `<h1>${count}</h1>`;

  const countdown = setInterval(() => {
    count--;

    if (count > 0) {
      overlay.innerHTML = `<h1>${count}</h1>`;
    } else {
      clearInterval(countdown);
      overlay.innerHTML = "";
      initGame();
    }
  }, 1000);
}

function initGame() {
  state.snake = [{ x: 10, y: 10 }];
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  state.food = spawnFood();
  state.bonusFood = null;
  state.score = 0;
  state.particles = [];
  state.running = true;
  state.speed = speeds[selectedSpeed];
  state.lastUpdate = performance.now();

  scoreEl.textContent = "0";
  overlay.innerHTML = "";

  requestAnimationFrame(gameLoop);
}

function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    state.snake.some((segment) => segment.x === pos.x && segment.y === pos.y)
  );

  return pos;
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      life: 28,
      maxLife: 28,
      color,
    });
  }
}

// ---------- INPUT HANDLING ---------- //
document.addEventListener("keydown", (e) => {
  if (!state.running && e.key === "Enter") {
    startGame();
    return;
  }

  if (e.key === "Escape") {
    vscode.postMessage({ command: "close" });
    return;
  }

  const d = state.nextDir;

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      if (d.y !== 1) state.nextDir = { x: 0, y: -1 };
      break;
    case "ArrowDown":
    case "s":
    case "S":
      if (d.y !== -1) state.nextDir = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      if (d.x !== 1) state.nextDir = { x: -1, y: 0 };
      break;
    case "ArrowRight":
    case "d":
    case "D":
      if (d.x !== -1) state.nextDir = { x: 1, y: 0 };
      break;
  }
});

// ---------- MAIN GAME LOOP ---------- //
function gameLoop(timestamp) {
  if (!state.running) return;

  if (timestamp - state.lastUpdate > state.speed) {
    update();
    state.lastUpdate = timestamp;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// ---------- UPDATE LOGIC ---------- //
function update() {
  state.dir = { ...state.nextDir }; // prevent reference issues

  const head = {
    x: state.snake[0].x + state.dir.x,
    y: state.snake[0].y + state.dir.y,
  };

  // Collision detection
  if (
    head.x < 0 ||
    head.x >= GRID_SIZE ||
    head.y < 0 ||
    head.y >= GRID_SIZE ||
    state.snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    dieSound.play().catch(() => {});
    gameOver();
    return;
  }

  state.snake.unshift(head);

  const skin = skins[currentSkin];

  // Check normal food
  if (head.x === state.food.x && head.y === state.food.y) {
    eatSound.play().catch(() => {});
    spawnParticles(head.x, head.y, skin.body);

    state.score++;
    scoreEl.textContent = state.score;

    state.food = spawnFood();

    // 30% chance for bonus food
    if (Math.random() < 0.3 && !state.bonusFood) {
      state.bonusFood = spawnFood();
    }
  }
  // Check bonus food
  else if (
    state.bonusFood &&
    head.x === state.bonusFood.x &&
    head.y === state.bonusFood.y
  ) {
    eatSound.play().catch(() => {});
    spawnParticles(head.x, head.y, "#fbbf24");

    state.score += 5;
    scoreEl.textContent = state.score;
    state.bonusFood = null;
  } else {
    state.snake.pop();
  }
}

// ---------- RENDERING ---------- //
function draw() {
  // Background
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawGrid();
  drawFood();
  drawSnake();
  drawParticles();
}

function drawGrid() {
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_SIZE, pos);
    ctx.stroke();
  }
}

function drawSquare(x, y, color, shadowBlur = 15) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = shadowBlur;
  ctx.fillRect(
    x * CELL_SIZE + 1,
    y * CELL_SIZE + 1,
    CELL_SIZE - 2,
    CELL_SIZE - 2,
  );
  ctx.shadowBlur = 0;
}

function drawFood() {
  const skin = skins[currentSkin];
  drawSquare(state.food.x, state.food.y, skin.food, 18);

  if (state.bonusFood) {
    drawSquare(state.bonusFood.x, state.bonusFood.y, "#fbbf24", 20);
  }
}

function drawSnake() {
  const skin = skins[currentSkin];

  state.snake.forEach((segment, i) => {
    let color;

    if (i === 0) {
      color = skin.head;
    } else if (skin.body === "rainbow") {
      const hue = (Date.now() / 8 + i * 25) % 360;
      color = `hsl(${hue}, 100%, 60%)`;
    } else {
      color = skin.body;
    }

    drawSquare(segment.x, segment.y, color, i === 0 ? 18 : 8);
  });
}

function drawParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];

    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = p.color;

    const size = 5 * (p.life / p.maxLife);
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);

    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    p.dx *= 0.98; // friction
    p.dy *= 0.98;

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- GAME OVER & MENU ---------- //
function gameOver() {
  state.running = false;

  if (state.score > highScore) {
    highScore = state.score;
    localStorage.setItem("snakeHigh", highScore);
    highEl.textContent = highScore;
  }

  overlay.innerHTML = `
    <h2>Game Over</h2>
    <div class="score">Score: <strong>${state.score}</strong></div>
    <button onclick="startGame()">Play Again</button>
    <button onclick="renderMenu()">Main Menu</button>
  `;
}

function renderMenu() {
  overlay.innerHTML = `
    <h2>Snake <span style="font-size:1.2em">🐍</span></h2>
    
    <div class="menu-section">
      <div class="label">Speed</div>
      <div id="speed-options" class="options"></div>
    </div>

    <div class="menu-section">
      <div class="label">Skin</div>
      <div id="skin-options" class="options"></div>
    </div>

    <button onclick="startGame()" class="start-btn">Start Game</button>
  `;

  // Render speed buttons
  const speedContainer = document.getElementById("speed-options");
  speedContainer.innerHTML = Object.keys(speeds)
    .map(
      (speed) => `
    <button onclick="selectSpeed('${speed}')" 
            class="option-btn ${selectedSpeed === speed ? "active" : ""}">
      ${speed}
    </button>
  `,
    )
    .join("");

  // Render skin buttons
  const skinContainer = document.getElementById("skin-options");
  skinContainer.innerHTML = Object.keys(skins)
    .map((name) => {
      const skin = skins[name];
      const bg =
        skin.body === "rainbow"
          ? "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #ff00ff)"
          : skin.body;
      return `
      <button onclick="selectSkin('${name}')" 
              class="skin-btn ${currentSkin === name ? "active" : ""}"
              style="background: ${bg};">
        ${name}
      </button>
    `;
    })
    .join("");
}

function selectSpeed(speed) {
  selectedSpeed = speed;
  localStorage.setItem("snakeSpeed", speed);
  renderMenu();
}

function selectSkin(name) {
  currentSkin = name;
  localStorage.setItem("snakeSkin", name);
  renderMenu();
}

// ---------- INITIALIZATION ---------- //
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

renderMenu();

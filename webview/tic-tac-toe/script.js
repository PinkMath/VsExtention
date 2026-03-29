const vscode = acquireVsCodeApi();

// ---------- DOM ---------- //
const el = {
  board: document.getElementById('board'),
  info: document.getElementById('info'),
  overlay: document.getElementById('overlay'),
  restart: document.getElementById('restart')
};

// ---------- STATE ---------- //
let state = {
  board: Array.from({ length: 3 }, () => Array(3).fill('')),
  currentPlayer: 'X',
  human: 'X',
  ai: 'O',
  mode: null,
  gameOver: false
};

// ---------- CONSTANTS ---------- //
const WIN_LINES = [
  [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
  [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
  [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
];

// ---------- UI ---------- //
function drawBoard(lastMove = null) {
  el.board.innerHTML = '';

  state.board.forEach((row, r) => {
    row.forEach((val, c) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = val;

      if (lastMove && lastMove[0] === r && lastMove[1] === c) {
        cell.classList.add('pop');
      }

      el.board.appendChild(cell);
    });
  });

  if (!state.gameOver) {
    if (state.mode === '1v1') {
      el.info.textContent = `Player ${state.currentPlayer}'s turn`;
    } else {
      el.info.textContent =
        state.currentPlayer === state.human
          ? "Your turn"
          : "AI thinking... 🤔";
    }
  }
}

function highlight(line) {
  line.forEach(([r, c]) => {
    document
      .querySelector(`.cell[data-row="${r}"][data-col="${c}"]`)
      ?.classList.add('winning-cell');
  });
}

// ---------- GAME LOGIC ---------- //
function isWinner(board, player) {
  return WIN_LINES.some(line =>
    line.every(([r, c]) => board[r][c] === player)
  );
}

function getEmpty(board) {
  const arr = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!board[r][c]) arr.push([r, c]);
    }
  }
  return arr;
}

function checkGame() {
  for (const line of WIN_LINES) {
    const [[r,c]] = line;
    const val = state.board[r][c];

    if (val && line.every(([r,c]) => state.board[r][c] === val)) {
      state.gameOver = true;
      highlight(line);

      if (state.mode === '1v1') {
        el.info.textContent = `Player ${val} wins! 🎉`;
      } else {
        el.info.textContent =
          val === state.human ? "You win! 🎉" : "AI wins! 🤖";
      }

      showButtons();
      return true;
    }
  }

  if (state.board.flat().every(Boolean)) {
    state.gameOver = true;
    el.info.textContent = "Draw 🤝";
    showButtons();
    return true;
  }

  return false;
}

// ---------- AI ---------- //
function aiEasy() {
  const empty = getEmpty(state.board);
  const move = empty[Math.floor(Math.random() * empty.length)];
  makeMove(move);
}

function aiNormal() {
  const empty = getEmpty(state.board);

  // Win
  for (const [r,c] of empty) {
    state.board[r][c] = state.ai;
    if (isWinner(state.board, state.ai)) {
      state.board[r][c] = '';
      return makeMove([r,c]);
    }
    state.board[r][c] = '';
  }

  // Block
  for (const [r,c] of empty) {
    state.board[r][c] = state.human;
    if (isWinner(state.board, state.human)) {
      state.board[r][c] = '';
      return makeMove([r,c]);
    }
    state.board[r][c] = '';
  }

  if (Math.random() < 0.5) return aiEasy();
  aiHard();
}

function minimax(board, depth, isMax, alpha, beta) {
  if (isWinner(board, state.ai)) return 10 - depth;
  if (isWinner(board, state.human)) return depth - 10;
  if (!getEmpty(board).length) return 0;

  if (isMax) {
    let best = -Infinity;
    for (const [r,c] of getEmpty(board)) {
      board[r][c] = state.ai;
      best = Math.max(best, minimax(board, depth+1, false, alpha, beta));
      board[r][c] = '';
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const [r,c] of getEmpty(board)) {
      board[r][c] = state.human;
      best = Math.min(best, minimax(board, depth+1, true, alpha, beta));
      board[r][c] = '';
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function aiHard() {
  let bestScore = -Infinity;
  let move;

  for (const [r,c] of getEmpty(state.board)) {
    state.board[r][c] = state.ai;
    const score = minimax(state.board, 0, false, -Infinity, Infinity);
    state.board[r][c] = '';

    if (score > bestScore) {
      bestScore = score;
      move = [r,c];
    }
  }

  makeMove(move);
}

function aiMove() {
  if (state.gameOver) return;

  el.info.textContent = "AI thinking... 🤔";

  setTimeout(() => {
    if (state.mode === 'easy') aiEasy();
    else if (state.mode === 'normal') aiNormal();
    else if (state.mode === 'hard') aiHard();
  }, 500 + Math.random()*500);
}

// ---------- FLOW ---------- //
function makeMove([r,c]) {
  state.board[r][c] = state.currentPlayer;
  drawBoard([r,c]);

  setTimeout(() => {
    if (!checkGame()) {
      state.currentPlayer =
        state.currentPlayer === 'X' ? 'O' : 'X';

      drawBoard();

      if (
        state.mode !== '1v1' &&
        state.currentPlayer === state.ai
      ) {
        aiMove();
      }
    }
  }, 200);
}

// ---------- EVENTS ---------- //
el.board.addEventListener('click', e => {
  if (state.gameOver) return;
  if (!e.target.classList.contains('cell')) return;

  const r = +e.target.dataset.row;
  const c = +e.target.dataset.col;

  if (state.board[r][c]) return;

  // Allow both players in 1v1
  if (state.mode !== '1v1' && state.currentPlayer !== state.human) return;

  makeMove([r,c]);
});

el.restart.onclick = resetGame;

// ---------- BUTTONS ---------- //
const changeModeBtn = document.createElement('button');
changeModeBtn.textContent = 'Change Mode';
changeModeBtn.style.display = 'none';
document.body.appendChild(changeModeBtn);

function showButtons() {
  el.restart.style.display = 'inline-block';
  changeModeBtn.style.display = 'inline-block';
}

// ---------- RESET ---------- //
function resetGame() {
  state.board = Array.from({ length: 3 }, () => Array(3).fill(''));
  state.currentPlayer = 'X';
  state.gameOver = false;

  el.restart.style.display = 'none';
  changeModeBtn.style.display = 'none';

  drawBoard();

  if (state.mode !== '1v1' && state.currentPlayer === state.ai) {
    aiMove();
  }
}

// ---------- MODE MENU ---------- //
function renderMenu() {
  el.overlay.innerHTML = `
    <h2>Select Mode</h2>
    <div id="mode-buttons">
      <button data-mode="easy">Easy</button>
      <button data-mode="normal">Normal</button>
      <button data-mode="hard">Hard</button>
      <button data-mode="1v1">1v1</button>
    </div>

    <h3 style="margin-top:15px;">Choose Symbol</h3>
    <button data-symbol="X">Play as X</button>
    <button data-symbol="O">Play as O</button>
  `;

  el.overlay.style.display = 'flex';

  let selectedMode = null;

  const modeButtons = el.overlay.querySelectorAll('[data-mode]');

  modeButtons.forEach(btn => {
    btn.onclick = () => {
      selectedMode = btn.dataset.mode;

      modeButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    };
  });

  el.overlay.querySelectorAll('[data-symbol]').forEach(btn => {
    btn.onclick = () => {
      state.mode = selectedMode || 'easy';
      state.human = btn.dataset.symbol;
      state.ai = state.human === 'X' ? 'O' : 'X';

      el.overlay.style.display = 'none';
      resetGame();
    };
  });
}

changeModeBtn.onclick = () => {
  renderMenu();
  changeModeBtn.style.display = 'none';
  el.restart.style.display = 'none';
};

// ---------- INIT ---------- //
renderMenu();
drawBoard();
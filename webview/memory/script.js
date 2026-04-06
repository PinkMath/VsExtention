const board = document.getElementById("game-board");
const movesDisplay = document.getElementById("moves");
const winScreen = document.getElementById("win-screen");
const restartBtn = document.getElementById("restart-btn");

const icons = ["🐶","🐱","🦊","🐻","🐼","🐸","🦁","🐵"];
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;

function initGame() {
  winScreen.classList.add("hidden");
  board.innerHTML = "";
  moves = 0;
  movesDisplay.textContent = "Moves: 0";
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  const cardValues = [...icons, ...icons];
  shuffle(cardValues);

  cards = cardValues.map(icon => {
    const card = document.createElement("div");
    card.classList.add("card");

    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");

    const back = document.createElement("div");
    back.classList.add("card-back");
    back.textContent = icon;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", flipCard);
    board.appendChild(card);
    return card;
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function flipCard() {
  // Don't allow flipping if the board is locked or card is already matched
  if (lockBoard || this.classList.contains("matched")) return;
  if (this === firstCard) return;

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;
  moves++;
  movesDisplay.textContent = `Moves: ${moves}`;

  checkMatch();
}

function checkMatch() {
  const icon1 = firstCard.querySelector(".card-back").textContent;
  const icon2 = secondCard.querySelector(".card-back").textContent;

  if (icon1 === icon2) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    resetTurn();
    checkWin();
  } else {
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 800);
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function checkWin() {
  if (cards.every(card => card.classList.contains("matched"))) {
    winScreen.classList.remove("hidden");
  }
}

restartBtn.addEventListener("click", initGame);
initGame();
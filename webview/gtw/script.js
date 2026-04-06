// --- Word Lists ---
const words = {
    EN: ["APPLE","HOUSE","PLANT","BRAVE","LIGHT","WORLD","NIGHT","WATER","MONEY","SMART","TRAIN","FRUIT","GREEN","STORM","SOUND","BREAD","CHAIR","DRINK","SWEET","TABLE","HEART","RIVER","CLOUD","STONE","MUSIC","PARTY","FIGHT","EARTH","PLANE","SHEEP","GRASS","BRICK","SMILE","LAUGH","DREAM","SLEEP","POWER","SHINE","FLAME","GLASS","CROWN","SWORD","QUEST","MAGIC","OCEAN","BEACH","SHELL","WHEEL","TRACK","SPEED","SCORE","LEVEL","MATCH","GUESS","WORDS","INPUT","CLICK","PRESS","START","RESET"],
    PT: ["CASAS","LIVRO","PLANO","FORTE","LUZES","MUNDO","NOITE","AGUAS","SABER","FALAR","TRENO","FRUTA","VERDE","TEMPO","SONHO","PAOES","CADEI","BEBER","DOCES","MESAS","CORAC","RIOES","NUVEM","PEDRA","MUSCA","FESTA","LUTAR","TERRA","PRAIA","AREIA","MARTE","VENUS","PLUTO","ESTRE","BRISA","VENTO","CHUVA","NEVAR","GELO","CALOR","AMIGO","AMIGA","FAMIL","FILHO","FILHA","JOGAR","GANHO","PERDA","NIVEL","PONTO","DADOS","TEXTO","LETRA","PALAV","DIGIT","CLICA","BOTAO","INICI","RESET"]
};

// --- Variables ---
let language = "EN";
let answer = "";
let currentRow = 0;
let currentCol = 0;
let gameOver = false;

// DOM Elements
const board = document.getElementById("game-board");
const message = document.getElementById("message");
const langSelector = document.getElementById("lang");
const resetBtn = document.getElementById("reset-btn");
const keyboardContainer = document.getElementById("keyboard");

// --- Initialize Board ---
function initBoard() {
    board.innerHTML = "";
    keyboardContainer.innerHTML = "";
    currentRow = 0;
    currentCol = 0;
    gameOver = false;
    message.textContent = "";
    resetBtn.style.display = "none";

    answer = words[language][Math.floor(Math.random() * words[language].length)];
    const rows = 6;
    const cols = answer.length;

    board.style.gridTemplateColumns = `repeat(${cols}, 90px)`;

    // create cells
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.setAttribute("id", `cell-${i}-${j}`);
            board.appendChild(cell);
        }
    }

    // create on-screen keyboard
    createKeyboard();

    updateFocus();
}

// --- Update Focus ---
function updateFocus() {
    document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("focus"));
    if (!gameOver) {
        const currentCell = document.getElementById(`cell-${currentRow}-${currentCol}`);
        if (currentCell) currentCell.classList.add("focus");
    }
}

// --- Handle Keyboard Input ---
function handleInput(letter) {
    if (gameOver) return;
    const cols = answer.length;
    if (letter === "BACK") {
        if (currentCol > 0) {
            currentCol--;
            document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = "";
            updateFocus();
        }
    } else if (letter === "ENTER") {
        if (currentCol === cols) submitGuess();
    } else if (/^[A-Z]$/.test(letter)) {
        if (currentCol < cols) {
            document.getElementById(`cell-${currentRow}-${currentCol}`).textContent = letter;
            currentCol++;
            updateFocus();
        }
    }
}

// --- On-Screen Keyboard ---
function createKeyboard() {
    const layout = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ENTERZXCVBNMBACK"
    ];

    layout.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("keyboard-row");

        let i = 0;
        while (i < row.length) {
            let key;

            if (row.startsWith("ENTER", i)) {
                key = "ENTER";
                i += 5;
            } else if (row.startsWith("BACK", i)) {
                key = "BACK";
                i += 4;
            } else {
                key = row[i];
                i++;
            }

            const button = document.createElement("button");
            button.textContent = key === "BACK" ? "⌫" : key;
            button.classList.add("key");
            button.setAttribute("data-key", key);

            button.addEventListener("click", () => handleInput(key));
            rowDiv.appendChild(button);
        }

        keyboardContainer.appendChild(rowDiv);
    });
}

function updateKeyboard(letter, status) {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (!key) return;

    // Priority: correct > present > absent
    if (key.classList.contains("correct")) return;

    if (status === "correct") {
        key.classList.remove("present", "absent");
        key.classList.add("correct");
    } else if (status === "present") {
        if (!key.classList.contains("correct")) {
            key.classList.remove("absent");
            key.classList.add("present");
        }
    } else if (status === "absent") {
        if (!key.classList.contains("correct") && !key.classList.contains("present")) {
            key.classList.add("absent");
        }
    }
}

// --- Submit Guess ---
function submitGuess() {
    const guess = [];
    const cols = answer.length;
    for (let i = 0; i < cols; i++) {
        guess.push(document.getElementById(`cell-${currentRow}-${i}`).textContent);
    }
    const guessStr = guess.join("");
    if (guessStr.length !== cols) return;

    // flip animation + color
    for (let i = 0; i < cols; i++) {
    const cell = document.getElementById(`cell-${currentRow}-${i}`);

    setTimeout(() => {
        cell.classList.add("flip");

        setTimeout(() => {
            let status;

            if (guess[i] === answer[i]) {
                status = "correct";
                cell.classList.add("correct");
            } else if (answer.includes(guess[i])) {
                status = "present";
                cell.classList.add("present");
            } else {
                status = "absent";
                cell.classList.add("absent");
            }

                updateKeyboard(guess[i], status);
    
                cell.classList.remove("flip");
            }, 150);
    
        }, i * 200);
    }

    setTimeout(() => {
        if (guessStr === answer) {
            message.textContent = language === "EN" ? "🎉 You guessed it!" : "🎉 Você acertou!";
            endGame();
        } else if (currentRow === 5) {
            message.textContent = language === "EN" ? `Game over! The word was ${answer}` : `Fim de jogo! A palavra era ${answer}`;
            endGame();
        } else {
            currentRow++;
            currentCol = 0;
            updateFocus();
        }
    }, cols * 200 + 200);
}

// --- End Game ---
function endGame() {
    gameOver = true;
    resetBtn.style.display = "inline-block";
}

// --- Event Listeners ---
resetBtn.addEventListener("click", initBoard);
langSelector.addEventListener("change", e => {
    language = e.target.value;
    initBoard();
});
document.addEventListener("keydown", (e) => {
    if (/^[a-zA-Z]$/.test(e.key)) handleInput(e.key.toUpperCase());
    else if (e.key === "Enter") handleInput("ENTER");
    else if (e.key === "Backspace") handleInput("BACK");
});

// --- Start Game ---
initBoard();
// --- GOOGLE SHEETS CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwzgNsTphikqF9QNSYtEy5J1tAxyvdaRwXhcdiCNnw6eesMmzm2IBmANdiqV8fWxG-W/exec";
const MAX_NAME_LENGTH = 20;
const LEADERBOARD_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 10000;

const quizQuestions = [
    { q: "Which programming language makes websites interactive? ✨", options: ["HTML", "CSS", "JavaScript", "SQL"], correct: 2 },
    { q: "What animal is the official mascot for Linux?", options: ["A friendly cat", "A chubby penguin", "An adorable puppy", "A swift fox"], correct: 1 },
    { q: "What does CSS stand for? 🎨", options: ["Creative Style Sheets", "Computer Style Systems", "Cascading Style Sheets", "Colorful Style System"], correct: 2 },
    { q: "Which of these is NOT a real cloud provider name?", options: ["Google Cloud", "Amazon Web Services", "Microsoft Azure", "Nimbus Sky Hub"], correct: 3 },
    { q: "What is the common nickname for software bugs? 🐛", options: ["Glitchy Gremlins", "Feature Flakes", "Bugs", "Byte Bites"], correct: 2 }
];

let currentQuestionIndex = 0;
let score = 0;
let submittedName = "";
let questions = [];

// Screens
const quizScreen = document.getElementById("quiz-screen");
const submissionScreen = document.getElementById("submission-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");

// Elements
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const finalScoreSpan = document.getElementById("final-score");
const totalSpan = document.getElementById("total-questions");
const submitScoreBtn = document.getElementById("submit-score-btn");
const usernameInput = document.getElementById("username");
const statusMsg = document.getElementById("status-msg");
const leaderboardRows = document.getElementById("leaderboard-rows");
const restartBtn = document.getElementById("restart-btn");

// ---------- Helpers ----------

// Shuffle options each game so the answer position isn't predictable.
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildQuestions() {
    return shuffle(quizQuestions).map(item => {
        const correctText = item.options[item.correct];
        const options = shuffle(item.options);
        return { q: item.q, options, correct: options.indexOf(correctText) };
    });
}

function showScreen(screen) {
    [quizScreen, submissionScreen, leaderboardScreen].forEach(s => (s.style.display = "none"));
    screen.style.display = "block";
}

function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function setStatus(message) {
    statusMsg.textContent = message || "";
}

// ---------- Quiz flow ----------

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    submittedName = "";
    questions = buildQuestions();
    usernameInput.value = "";
    setStatus("");
    submitScoreBtn.disabled = false;
    submitScoreBtn.textContent = "Enter Gateway ➔";
    totalSpan.textContent = questions.length;
    showScreen(quizScreen);
    loadQuestion();
}

function loadQuestion() {
    resetState();
    const current = questions[currentQuestionIndex];
    questionText.textContent = current.q;
    progressBar.style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
    nextBtn.textContent = currentQuestionIndex === questions.length - 1 ? "See Results 🎉" : "Next ✨";

    current.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option;
        button.classList.add("option-btn");
        button.addEventListener("click", () => selectOption(index, current.correct));
        optionsContainer.appendChild(button);
    });
}

function resetState() {
    nextBtn.style.display = "none";
    optionsContainer.innerHTML = "";
}

function selectOption(selectedIndex, correctIndex) {
    const allButtons = optionsContainer.querySelectorAll(".option-btn");

    if (selectedIndex === correctIndex) {
        score++;
        allButtons[selectedIndex].classList.add("correct-choice");
    } else {
        allButtons[selectedIndex].classList.add("wrong-choice");
        allButtons[correctIndex].classList.add("correct-choice");
    }

    allButtons.forEach(btn => (btn.disabled = true));
    nextBtn.style.display = "block";
    nextBtn.focus();
}

nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        progressBar.style.width = "100%";
        finalScoreSpan.textContent = score;
        showScreen(submissionScreen);
        usernameInput.focus();
    }
});

// ---------- Google Sheets ----------

async function submitScore() {
    const name = usernameInput.value.trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
        setStatus("✨ Please type your magic hero name first!");
        usernameInput.focus();
        return;
    }

    submitScoreBtn.disabled = true; // stays disabled until the request finishes
    submitScoreBtn.textContent = "Submitting...";
    setStatus("");

    try {
        // no-cors responses are opaque, but awaiting still tells us the request
        // reached the server (it rejects on network failure/timeout). Using
        // text/plain keeps it a "simple" request that Apps Script accepts.
        await fetchWithTimeout(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ name, score, timestamp: new Date().toISOString() })
        });
        submittedName = name;
        showScreen(leaderboardScreen);
        await fetchLeaderboard();
    } catch (error) {
        console.error("Score submission failed:", error);
        setStatus("😢 Couldn't save your score. Check your connection and try again.");
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = "Try Again ➔";
    }
}

submitScoreBtn.addEventListener("click", submitScore);
usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") submitScore();
});

function messageRow(text, withRetry = false) {
    leaderboardRows.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = text + " ";
    if (withRetry) {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Retry 🔄";
        retry.className = "retry-link";
        retry.addEventListener("click", fetchLeaderboard);
        td.appendChild(retry);
    }
    tr.appendChild(td);
    leaderboardRows.appendChild(tr);
}

async function fetchLeaderboard() {
    messageRow("Loading magical standings...");

    try {
        const url = SCRIPT_URL + (SCRIPT_URL.includes("?") ? "&" : "?") + "_cb=" + Date.now();
        const response = await fetchWithTimeout(url);
        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected response shape");

        const players = data
            .map(p => ({
                name: String(p.name || "Anonymous Hero").slice(0, MAX_NAME_LENGTH),
                score: Number(p.score) || 0,
                timestamp: p.timestamp
            }))
            .sort((a, b) => b.score - a.score || new Date(a.timestamp) - new Date(b.timestamp))
            .slice(0, LEADERBOARD_LIMIT);

        if (players.length === 0) {
            messageRow("No heroes yet — be the first! 🌟");
            return;
        }

        const medals = ["🥇", "🥈", "🥉"];
        const fragment = document.createDocumentFragment();
        let youMarked = false;

        players.forEach((player, i) => {
            const tr = document.createElement("tr");
            // textContent (not innerHTML) so names can't inject HTML/scripts
            [medals[i] || String(i + 1), player.name, `${player.score} pts`].forEach(text => {
                const td = document.createElement("td");
                td.textContent = text;
                tr.appendChild(td);
            });
            if (!youMarked && player.name === submittedName && player.score === score) {
                tr.classList.add("you");
                youMarked = true;
            }
            fragment.appendChild(tr);
        });

        leaderboardRows.innerHTML = "";
        leaderboardRows.appendChild(fragment);
    } catch (error) {
        console.error("Error reading leaderboard:", error);
        messageRow("Could not load Hall of Fame 😢", true);
    }
}

restartBtn.addEventListener("click", startQuiz);

// Initialize
startQuiz();

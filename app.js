// --- GOOGLE SHEETS CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwzgNsTphikqF9QNSYtEy5J1tAxyvdaRwXhcdiCNnw6eesMmzm2IBmANdiqV8fWxG-W/exec";

// Complete 5 magical multiple choice questions
const quizQuestions = [
    { q: "Which programming language makes websites interactive? ✨", options: ["HTML", "CSS", "JavaScript", "SQL"], correct: 2 },
    { q: "What animal is the official mascot for Linux?", options: ["A friendly cat", "A chubby penguin", "An adorable puppy", "A swift fox"], correct: 1 },
    { q: "What does CSS stand for? 🎨", options: ["Creative Style Sheets", "Computer Style Systems", "Cascading Style Sheets", "Colorful Style System"], correct: 2 },
    { q: "Which of these is NOT a real cloud provider name?", options: ["Google Cloud", "Amazon Web Services", "Microsoft Azure", "Nimbus Sky Hub"], correct: 3 },
    { q: "What is the common nickname for software bugs? 🐛", options: ["Glitchy Gremlins", "Feature Flakes", "Bugs", "Byte Bites"], correct: 2 }
];

let currentQuestionIndex = 0;
let score = 0;

// Screens
const quizScreen = document.getElementById("quiz-screen");
const submissionScreen = document.getElementById("submission-screen");
const leaderboardScreen = document.getElementById("leaderboard-screen");

// Component Elements
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const finalScoreSpan = document.getElementById("final-score");
const submitScoreBtn = document.getElementById("submit-score-btn");
const usernameInput = document.getElementById("username");
const leaderboardRows = document.getElementById("leaderboard-rows");
const restartBtn = document.getElementById("restart-btn");

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizScreen.style.display = "block";
    submissionScreen.style.display = "none";
    leaderboardScreen.style.display = "none";
    loadQuestion();
}

function loadQuestion() {
    resetState();
    let currentQuestion = quizQuestions[currentQuestionIndex];
    questionText.innerText = currentQuestion.q;
    
    progressBar.style.width = `${(currentQuestionIndex / quizQuestions.length) * 100}%`;

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option-btn");
        button.addEventListener("click", () => selectOption(button, index, currentQuestion.correct));
        optionsContainer.appendChild(button);
    });
}

function resetState() {
    nextBtn.style.display = "none";
    optionsContainer.innerHTML = "";
}

function selectOption(selectedButton, selectedIndex, correctIndex) {
    const allButtons = optionsContainer.querySelectorAll(".option-btn");
    
    if (selectedIndex === correctIndex) {
        score++;
        selectedButton.classList.add("correct-choice");
    } else {
        selectedButton.classList.add("wrong-choice");
        allButtons[correctIndex].classList.add("correct-choice");
    }

    allButtons.forEach(btn => btn.disabled = true);
    nextBtn.style.display = "block";
}

nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        loadQuestion();
    } else {
        progressBar.style.width = "100%";
        quizScreen.style.display = "none";
        submissionScreen.style.display = "block";
        finalScoreSpan.innerText = score;
    }
});

// --- GOOGLE SHEETS API INTERACTIONS ---

// Write user performance data to Google Sheets
submitScoreBtn.addEventListener("click", async () => {
    const name = usernameInput.value.trim();
    if (!name) {
        alert("✨ Please type your magic hero name first!");
        return;
    }

    // Temporarily disable button to prevent multiple submissions
    submitScoreBtn.disabled = true;
    submitScoreBtn.innerText = "Submitting...";

    try {
        const payload = {
            name: name,
            score: score,
            timestamp: new Date().toISOString()
        };

        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Required for Google Apps Script redirects
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        // Advance to leaderboard view and fetch fresh rankings
        submissionScreen.style.display = "none";
        leaderboardScreen.style.display = "block";
        fetchLeaderboard();
    } catch (error) {
        console.error("Sheets connection failure: ", error);
        alert("Oops! Something went wrong submitting your score.");
    } finally {
        submitScoreBtn.disabled = false;
        submitScoreBtn.innerText = "Enter Gateway ➔";
    }
});

// Fetch and sort data from Google Sheets
async function fetchLeaderboard() {
    leaderboardRows.innerHTML = "<tr><td colspan='3'>Loading magical standings...</td></tr>";
    
    try {
        const response = await fetch(SCRIPT_URL);
        let data = await response.json();

        // Tie-breaker Sort: Highest score first. If tied, sort by earliest timestamp.
        data.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        leaderboardRows.innerHTML = "";
        let rank = 1;

        data.forEach((player) => {
            let rankBadge = rank;
            if (rank === 1) rankBadge = "🥇";
            if (rank === 2) rankBadge = "🥈";
            if (rank === 3) rankBadge = "🥉";

            const row = `<tr>
                <td>${rankBadge}</td>
                <td>${player.name || "Anonymous Hero"}</td>
                <td>${player.score} pts</td>
            </tr>`;
            leaderboardRows.innerHTML += row;
            rank++;
        });
    } catch (error) {
        console.error("Error reading leaderboard:", error);
        leaderboardRows.innerHTML = "<tr><td colspan='3'>Could not load Hall of Fame 😢</td></tr>";
    }
}

restartBtn.addEventListener("click", () => {
    startQuiz();
});

// Initialize app
startQuiz();
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your verified Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCAA4EePd4HIC7kBdA1cO281bP7BNEiv6Y",
  authDomain: "interactive-quiz-leaderboard.firebaseapp.com",
  projectId: "interactive-quiz-leaderboard",
  storageBucket: "interactive-quiz-leaderboard.firebasestorage.app",
  messagingSenderId: "951145713415",
  appId: "1:951145713415:web:ca41543c35d60133abbfa2",
  measurementId: "G-WTG80NBW1C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    
    // Smooth dynamic update to matching progress tracking metric
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
    
    // Instantly highlight answers dynamically with visual color cues
    if (selectedIndex === correctIndex) {
        score++;
        selectedButton.classList.add("correct-choice");
    } else {
        selectedButton.classList.add("wrong-choice");
        allButtons[correctIndex].classList.add("correct-choice"); // Reveal the correct answer nicely
    }

    // Freeze buttons
    allButtons.forEach(btn => btn.disabled = true);
    nextBtn.style.display = "block";
}

nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        loadQuestion();
    } else {
        // Switch view cleanly to Gateway submission screen
        progressBar.style.width = "100%";
        quizScreen.style.display = "none";
        submissionScreen.style.display = "block";
        finalScoreSpan.innerText = score;
    }
});

// Write user performance data to DB
submitScoreBtn.addEventListener("click", async () => {
    const name = usernameInput.value.trim();
    if (!name) {
        alert("✨ Please type your magic hero name first!");
        return;
    }

    try {
        await addDoc(collection(db, "leaderboard"), {
            name: name,
            score: score,
            timestamp: new Date() // Secondary tie breaking parameter
        });
        
        // Advance into the grand finale gateway view
        submissionScreen.style.display = "none";
        leaderboardScreen.style.display = "block";
    } catch (error) {
        console.error("Database connection failure: ", error);
    }
});

// Sort by highest score first, then fallback to earliest time registered
const leaderboardQuery = query(
    collection(db, "leaderboard"), 
    orderBy("score", "desc"), 
    orderBy("timestamp", "asc")
);

// Realtime sync listeners
onSnapshot(leaderboardQuery, (snapshot) => {
    leaderboardRows.innerHTML = "";
    let rank = 1;
    snapshot.forEach((doc) => {
        const data = doc.data();
        // Dynamic decorative rank placement badges
        let rankBadge = rank;
        if (rank === 1) rankBadge = "🥇";
        if (rank === 2) rankBadge = "🥈";
        if (rank === 3) rankBadge = "🥉";

        const row = `<tr>
            <td>${rankBadge}</td>
            <td>${data.name}</td>
            <td>${data.score} pts</td>
        </tr>`;
        leaderboardRows.innerHTML += row;
        rank++;
    });
});

restartBtn.addEventListener("click", startQuiz);

// Initialize interaction loop
startQuiz();
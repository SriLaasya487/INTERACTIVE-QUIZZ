// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
// (Replace these placeholders with the actual config keys from your Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyYourActualAPIKeyHere...",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export db if you plan to use it across multiple files, or just start writing your logic below!
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

// 1. Paste your actual Firebase configuration here
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Define 5 Quiz Questions
const quizQuestions = [
    { q: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correct: 2 },
    { q: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correct: 1 },
    { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink Text Management Language", "Home Tool Markup Language"], correct: 0 },
    { q: "What is 5 + 7?", options: ["10", "11", "12", "13"], correct: 2 },
    { q: "Which programming language is known as the language of the web?", options: ["Python", "C++", "Java", "JavaScript"], correct: 3 }
];

let currentQuestionIndex = 0;
let score = 0;

// Elements
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const quizContainer = document.getElementById("quiz-container");
const submissionContainer = document.getElementById("submission-container");
const finalScoreSpan = document.getElementById("final-score");
const submitScoreBtn = document.getElementById("submit-score-btn");
const usernameInput = document.getElementById("username");
const leaderboardRows = document.getElementById("leaderboard-rows");

// 3. Load Question Logic
function loadQuestion() {
    resetState();
    let currentQuestion = quizQuestions[currentQuestionIndex];
    questionText.innerText = currentQuestion.q;

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option-btn");
        button.addEventListener("click", () => selectOption(index, currentQuestion.correct));
        optionsContainer.appendChild(button);
    });
}

function resetState() {
    nextBtn.style.display = "none";
    optionsContainer.innerHTML = "";
}

function selectOption(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        score++;
    }
    // Disable all options after selection
    Array.from(optionsContainer.children).forEach(button => button.disabled = true);
    nextBtn.style.display = "block";
}

nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        loadQuestion();
    } else {
        // Show Score Submission Form
        quizContainer.style.display = "none";
        submissionContainer.style.display = "block";
        finalScoreSpan.innerText = score;
    }
});

// 4. Submit Score & Handle Tie-Breaking
submitScoreBtn.addEventListener("click", async () => {
    const name = usernameInput.value.trim();
    if (!name) return alert("Please enter your name!");

    try {
        await addDoc(collection(db, "leaderboard"), {
            name: name,
            score: score,
            timestamp: new Date() // Used for sorting ties by earliest submission time
        });
        submissionContainer.style.display = "none";
        alert("Score submitted successfully!");
    } catch (error) {
        console.error("Error adding score: ", error);
    }
});

// 5. Fetch and Listen to Leaderboard Updates Real-Time
// This satisfies the bonus request for true real-time updates and handles ties automatically
const leaderboardQuery = query(
    collection(db, "leaderboard"), 
    orderBy("score", "desc"), 
    orderBy("timestamp", "asc") // Tie breaker: earlier submission shows first
);

onSnapshot(leaderboardQuery, (snapshot) => {
    leaderboardRows.innerHTML = "";
    let rank = 1;
    snapshot.forEach((doc) => {
        const data = doc.data();
        const row = `<tr>
            <td>${rank++}</td>
            <td>${data.name}</td>
            <td>${data.score}</td>
        </tr>`;
        leaderboardRows.innerHTML += row;
    });
});

// Start the Quiz on page load
loadQuestion();
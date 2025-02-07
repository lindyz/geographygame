// Map-Based Geography Quiz Game using Leaflet.js with User-Defined Questions, Scoring, Timer, and Boundary Highlighting

// Ensure script runs only after the DOM is fully loaded
window.onload = function () {
    // Initialize the map
    const map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Load country borders for better visibility when zoomed in
    fetch("https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson")
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, { style: { color: '#000', weight: 1 } }).addTo(map);
        });

    // User-defined questions
    let savedQuizzes = JSON.parse(localStorage.getItem("savedQuizzes")) || {};
    let userDefinedQuestions = [];
    let score = 0;
    let currentQuestionIndex = 0;
    let currentLayer = null;
    let timer;
    let timeLeft = 30;

    // UI Elements
    const quizNameInput = document.getElementById("quiz-name");
    const saveQuizButton = document.getElementById("save-quiz");
    const loadQuizList = document.getElementById("saved-quizzes");
    const placeInput = document.getElementById("place-list-input");
    const addPlacesButton = document.getElementById("add-places");
    const startGameButton = document.getElementById("start-game");
    const placeList = document.getElementById("place-list");
    const feedbackContainer = document.getElementById("feedback");
    const scoreContainer = document.getElementById("score");
    const timerContainer = document.getElementById("timer");
    const questionContainer = document.getElementById("question");
    const clearQuizButton = document.getElementById("clear-quiz");

    function updateSavedQuizList() {
        loadQuizList.innerHTML = "";
        for (const quizName in savedQuizzes) {
            const quizEntry = document.createElement("div");
            quizEntry.innerHTML = `<button class='quiz-btn'>${quizName}</button> <button class='delete-btn' data-quiz='${quizName}'>❌</button>`;
            loadQuizList.appendChild(quizEntry);
        }
    }

    function saveQuiz() {
        const quizName = quizNameInput.value.trim();
        if (!quizName) {
            alert("Please enter a name for the quiz.");
            return;
        }
        savedQuizzes[quizName] = userDefinedQuestions;
        localStorage.setItem("savedQuizzes", JSON.stringify(savedQuizzes));
        updateSavedQuizList();
        alert("Quiz saved successfully!");
    }

    function loadQuiz(quizName) {
        userDefinedQuestions = savedQuizzes[quizName] || [];
        showQuestion();
    }

    function deleteQuiz(quizName) {
        delete savedQuizzes[quizName];
        localStorage.setItem("savedQuizzes", JSON.stringify(savedQuizzes));
        updateSavedQuizList();
    }

    function resetGame() {
        userDefinedQuestions = [];
        placeList.innerHTML = "";
        questionContainer.innerText = "No questions available.";
        score = 0;
        scoreContainer.innerText = `Score: ${score}`;
        clearInterval(timer);
        timerContainer.innerText = "Time Left: 30s";
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
    }

    if (addPlacesButton) {
        addPlacesButton.addEventListener("click", async function () {
            const placeNames = placeInput.value.trim().split("\n").map(name => name.trim()).filter(name => name);
            if (placeNames.length > 0) {
                for (let placeName of placeNames) {
                    const geoData = await getBoundary(placeName);
                    if (geoData) {
                        const listItem = document.createElement("li");
                        listItem.innerText = placeName;
                        placeList.appendChild(listItem);
                        userDefinedQuestions.push({
                            question: `Click on ${placeName}`,
                            boundary: geoData,
                            listElement: listItem
                        });
                    } else {
                        alert(`Could not find location for: ${placeName}. Please provide more details.`);
                    }
                }
                placeInput.value = "";
            }
        });
    }

    if (startGameButton) {
        startGameButton.addEventListener("click", function () {
            if (userDefinedQuestions.length > 0) {
                currentQuestionIndex = 0;
                timeLeft = 30;
                timerContainer.innerText = `Time Left: ${timeLeft}s`;
                timer = setInterval(() => {
                    timeLeft--;
                    timerContainer.innerText = `Time Left: ${timeLeft}s`;
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        alert("Time's up!");
                        resetGame();
                    }
                }, 1000);
                showQuestion();
            } else {
                alert("Please add places before starting the game.");
            }
        });
    }

    if (saveQuizButton) {
        saveQuizButton.addEventListener("click", saveQuiz);
    }

    if (clearQuizButton) {
        clearQuizButton.addEventListener("click", resetGame);
    }

    async function getBoundary(place) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&q=${place}&polygon_geojson=1`);
        const data = await response.json();
        if (data.features.length > 0) {
            return data.features[0].geometry;
        }
        return null;
    }

    updateSavedQuizList();
};

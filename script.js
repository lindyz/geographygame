// Map-Based Geography Quiz Game using Leaflet.js with User-Defined Questions, Scoring, Timer, and Boundary Highlighting

// Ensure script runs only after the DOM is fully loaded
window.onload = function () {
    // Initialize the map
    const map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

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

        // Limit stored data size to avoid QuotaExceededError
        const simplifiedQuizData = userDefinedQuestions.map(q => ({
            question: q.question,
            place: q.place
        }));

        try {
            savedQuizzes[quizName] = simplifiedQuizData;
            localStorage.setItem("savedQuizzes", JSON.stringify(savedQuizzes));
            updateSavedQuizList();
            alert("Quiz saved successfully!");
        } catch (error) {
            alert("Error: Unable to save quiz. Storage limit reached.");
        }
    }

    function resetGame() {
        userDefinedQuestions = [];
        placeList.innerHTML = "";
        if (questionContainer) questionContainer.innerText = "No questions available.";
        score = 0;
        if (scoreContainer) scoreContainer.innerText = `Score: ${score}`;
        clearInterval(timer);
        if (timerContainer) timerContainer.innerText = "Time Left: 30s";
        if (currentLayer) {
            map.removeLayer(currentLayer);
        }
    }

    async function getBoundary(place) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&q=${place}&polygon_geojson=1`);
        const data = await response.json();
        if (data.features.length > 0) {
            return data.features[0];
        }
        return null;
    }

    // Add places manually
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
                            place: placeName,
                            boundary: geoData.geometry,
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

    // Start the game
    if (startGameButton) {
        startGameButton.addEventListener("click", function () {
            if (userDefinedQuestions.length > 0) {
                currentQuestionIndex = 0;
                timeLeft = 30;
                if (timerContainer) timerContainer.innerText = `Time Left: ${timeLeft}s`;
                timer = setInterval(() => {
                    timeLeft--;
                    if (timerContainer) timerContainer.innerText = `Time Left: ${timeLeft}s`;
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

    // Click event listener for the map
    map.on('click', function(event) {
        checkAnswer(event.latlng);
    });

    function checkAnswer(clickedLatLng) {
        if (userDefinedQuestions.length === 0 || currentQuestionIndex >= userDefinedQuestions.length) return;
        const currentQuestion = userDefinedQuestions[currentQuestionIndex];

        if (currentLayer) {
            map.removeLayer(currentLayer);
        }

        // Check if the clicked point is inside the correct region
        let correct = false;
        if (currentQuestion.boundary.type === "Polygon") {
            correct = insidePolygon([clickedLatLng.lng, clickedLatLng.lat], currentQuestion.boundary.coordinates);
        } else if (currentQuestion.boundary.type === "MultiPolygon") {
            for (let polygon of currentQuestion.boundary.coordinates) {
                if (insidePolygon([clickedLatLng.lng, clickedLatLng.lat], polygon)) {
                    correct = true;
                    break;
                }
            }
        }

        if (correct) {
            feedbackContainer.innerText = "✅ Correct!";
            score += 10;
            if (scoreContainer) scoreContainer.innerText = `Score: ${score}`;
            currentLayer = L.geoJSON(currentQuestion.boundary, { style: { color: 'green', weight: 3 } }).addTo(map);
            if (currentQuestion.listElement) {
                currentQuestion.listElement.style.color = "green";
            }
            currentQuestionIndex++;
            showQuestion();
        } else {
            feedbackContainer.innerText = "❌ Incorrect! Try again.";
        }
    }

    function insidePolygon(point, polygon) {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = polygon[0].length - 1; i < polygon[0].length; j = i++) {
            let xi = polygon[0][i][0], yi = polygon[0][i][1];
            let xj = polygon[0][j][0], yj = polygon[0][j][1];

            let intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function showQuestion() {
        if (userDefinedQuestions.length > 0 && currentQuestionIndex < userDefinedQuestions.length) {
            if (questionContainer) questionContainer.innerText = userDefinedQuestions[currentQuestionIndex].question;
        } else {
            if (questionContainer) questionContainer.innerText = "Quiz complete!";
        }
    }

    if (saveQuizButton) {
        saveQuizButton.addEventListener("click", saveQuiz);
    }

    if (clearQuizButton) {
        clearQuizButton.addEventListener("click", resetGame);
    }

    updateSavedQuizList();
};

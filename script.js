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
    const deleteQuizButton = document.getElementById("delete-quiz");
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

    function updatePlaceList() {
        placeList.innerHTML = "";
        userDefinedQuestions.forEach((question, index) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `${question.place} <button class='delete-place' data-index='${index}'>❌</button>`;
            placeList.appendChild(listItem);
        });
    }

    function deletePlace(index) {
        userDefinedQuestions.splice(index, 1);
        updatePlaceList();
    }

    function deleteQuiz() {
        userDefinedQuestions = [];
        updatePlaceList();
        questionContainer.innerText = "No questions available.";
        score = 0;
        scoreContainer.innerText = `Score: ${score}`;
        clearInterval(timer);
        timerContainer.innerText = "Time Left: 30s";
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

    if (addPlacesButton) {
        addPlacesButton.addEventListener("click", async function () {
            const placeNames = placeInput.value.trim().split("\n").map(name => name.trim()).filter(name => name);
            if (placeNames.length > 0) {
                for (let placeName of placeNames) {
                    const geoData = await getBoundary(placeName);
                    if (geoData) {
                        userDefinedQuestions.push({
                            question: `Click on ${placeName}`,
                            place: placeName,
                            boundary: geoData.geometry
                        });
                    } else {
                        alert(`Could not find location for: ${placeName}. Please provide more details.`);
                    }
                }
                placeInput.value = "";
                updatePlaceList();
            }
        });
    }

    placeList.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-place")) {
            deletePlace(event.target.getAttribute("data-index"));
        }
    });

    if (deleteQuizButton) {
        deleteQuizButton.addEventListener("click", deleteQuiz);
    }

    map.on('click', function(event) {
        checkAnswer(event.latlng);
    });

    function showQuestion() {
        if (userDefinedQuestions.length > 0 && currentQuestionIndex < userDefinedQuestions.length) {
            questionContainer.innerText = userDefinedQuestions[currentQuestionIndex].question;
        } else {
            questionContainer.innerText = "Quiz complete!";
        }
    }
};

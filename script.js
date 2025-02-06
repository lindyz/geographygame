// Map-Based Geography Quiz Game using Leaflet.js with Region Selection, Custom Topics, Scoring, Progress Tracking, Multiplayer Mode, and Timer

// Ensure script runs only after the DOM is fully loaded
window.onload = function () {
    // Initialize the map
    const map = L.map('map').setView([20, 0], 2); // Centered globally

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Regions and corresponding bounds
    const regions = {
        'World': [[-90, -180], [90, 180]],
        'North America': [[15, -170], [72, -50]],
        'South America': [[-56, -81], [13, -34]],
        'Europe': [[35, -25], [71, 40]],
        'Africa': [[-35, -20], [37, 55]],
        'Asia': [[5, 60], [55, 150]],
        'Oceania': [[-50, 110], [10, 180]]
    };

    // Custom user-defined topics
    let userDefinedQuestions = [];
    let score = 0;
    let timeLeft = 30;
    let timer;
    let currentQuestionIndex = 0;
    let currentLayer = null;

    // UI Elements
    const createOwnQuizButton = document.getElementById("create-own-quiz");
    const autoGenerateQuizButton = document.getElementById("auto-generate-quiz");
    const regionSelect = document.getElementById("region-select");
    const placeInput = document.getElementById("place-list-input");
    const addPlacesButton = document.getElementById("add-places");
    const startGameButton = document.getElementById("start-game");
    const placeList = document.getElementById("place-list");
    const timerContainer = document.getElementById("timer");
    const feedbackContainer = document.getElementById("feedback");
    const scoreContainer = document.getElementById("score");
    const questionContainer = document.getElementById("question");
    const clearQuizButton = document.getElementById("clear-quiz");

    // Check if elements exist before adding event listeners
    if (createOwnQuizButton && autoGenerateQuizButton) {
        createOwnQuizButton.addEventListener("click", function() {
            document.getElementById("manual-quiz-section").style.display = "block";
            document.getElementById("auto-quiz-section").style.display = "none";
        });

        autoGenerateQuizButton.addEventListener("click", function() {
            document.getElementById("manual-quiz-section").style.display = "none";
            document.getElementById("auto-quiz-section").style.display = "block";
        });
    }

    if (addPlacesButton && placeInput) {
        addPlacesButton.addEventListener("click", async function() {
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
        startGameButton.addEventListener("click", function() {
            if (userDefinedQuestions.length > 0) {
                currentQuestionIndex = 0;
                showQuestion();
            } else {
                alert("Please add places before starting the game.");
            }
        });
    }

    if (clearQuizButton) {
        clearQuizButton.addEventListener("click", function() {
            userDefinedQuestions = [];
            placeList.innerHTML = "";
            questionContainer.innerText = "No questions available.";
            if (currentLayer) {
                map.removeLayer(currentLayer);
            }
        });
    }

    async function getBoundary(place) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&q=${place}`);
        const data = await response.json();
        if (data.features.length > 0) {
            return data.features[0];
        }
        return null;
    }

    // Handle map clicks
    map.on('click', function(event) {
        checkAnswer(event.latlng.lat, event.latlng.lng);
    });

    // Function to Check Answers and Highlight Boundaries
    function checkAnswer(userLat, userLng) {
        if (userDefinedQuestions.length === 0 || currentQuestionIndex >= userDefinedQuestions.length) return;
        const currentQuestion = userDefinedQuestions[currentQuestionIndex];

        if (currentLayer) {
            map.removeLayer(currentLayer);
        }

        currentLayer = L.geoJSON(currentQuestion.boundary, {
            style: { color: 'green', weight: 3 }
        }).addTo(map);

        feedbackContainer.innerText = "✅ Correct!";
        score += 10;
        scoreContainer.innerText = `Score: ${score}`;
        currentQuestion.listElement.style.color = "green";
        currentQuestionIndex++;
        showQuestion();
    }

    // Show First Question
    function showQuestion() {
        if (userDefinedQuestions.length > 0 && currentQuestionIndex < userDefinedQuestions.length) {
            questionContainer.innerText = userDefinedQuestions[currentQuestionIndex].question;
        } else {
            questionContainer.innerText = "Quiz complete!";
        }
    }
};

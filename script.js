// Map-Based Geography Quiz Game using Leaflet.js with User-Defined Questions, Scoring, Timer, and Boundary Highlighting

window.onload = function () {
    // Initialize the map
    const map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let userDefinedQuestions = [];
    let score = 0;
    let currentQuestionIndex = 0;
    let currentLayer = null;
    let timer;
    let timeLeft = 30;

    // UI Elements
    const placeInput = document.getElementById("place-list-input");
    const addPlacesButton = document.getElementById("add-places");
    const startGameButton = document.getElementById("start-game");
    const deleteQuizButton = document.getElementById("delete-quiz");
    const placeList = document.getElementById("place-list");
    const feedbackContainer = document.getElementById("feedback");
    const scoreContainer = document.getElementById("score");
    const timerContainer = document.getElementById("timer");
    const questionContainer = document.getElementById("question");

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
        const query = encodeURIComponent(place);
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];(relation[name="${query}"];way[name="${query}"];node[name="${query}"];);out geom;`);
        const data = await response.json();

        if (data.elements.length > 0) {
            const geoJsonFeature = {
                type: "Feature",
                properties: { name: place },
                geometry: {
                    type: data.elements[0].type === "relation" ? "MultiPolygon" : "Polygon",
                    coordinates: data.elements.map(e => e.geometry.map(coord => [coord.lon, coord.lat]))
                }
            };
            return geoJsonFeature;
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

    if (startGameButton) {
        startGameButton.addEventListener("click", function () {
            if (userDefinedQuestions.length > 0) {
                currentQuestionIndex = 0;
                score = 0;
                scoreContainer.innerText = `Score: ${score}`;
                timeLeft = 30;
                timerContainer.innerText = `Time Left: ${timeLeft}s`;
                timer = setInterval(() => {
                    timeLeft--;
                    timerContainer.innerText = `Time Left: ${timeLeft}s`;
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        alert("Time's up!");
                        deleteQuiz();
                    }
                }, 1000);
                showQuestion();
            } else {
                alert("Please add places before starting the game.");
            }
        });
    }

    map.on('click', function (event) {
        checkAnswer(event.latlng);
    });

    function checkAnswer(clickedLatLng) {
        if (userDefinedQuestions.length === 0 || currentQuestionIndex >= userDefinedQuestions.length) return;
        const currentQuestion = userDefinedQuestions[currentQuestionIndex];

        if (currentLayer) {
            map.removeLayer(currentLayer);
        }

        let correct = false;
        if (currentQuestion.boundary.type === "Polygon" || currentQuestion.boundary.type === "MultiPolygon") {
            correct = insidePolygon([clickedLatLng.lng, clickedLatLng.lat], currentQuestion.boundary.coordinates);
        }

        if (correct) {
            feedbackContainer.innerText = "✅ Correct!";
            score += 10;
            scoreContainer.innerText = `Score: ${score}`;
            currentLayer = L.geoJSON(currentQuestion.boundary, { style: { color: 'green', weight: 3 } }).addTo(map);
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
            questionContainer.innerText = userDefinedQuestions[currentQuestionIndex].question;
        } else {
            questionContainer.innerText = "Quiz complete!";
        }
    }
};

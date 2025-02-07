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

    map.on('click', function(event) {
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
        } else if (currentQuestion.boundary.type === "LineString" || currentQuestion.boundary.type === "MultiLineString") {
            correct = insideLine([clickedLatLng.lng, clickedLatLng.lat], currentQuestion.boundary.coordinates);
        }

        if (correct) {
            feedbackContainer.innerText = "✅ Correct!";
            score += 10;
            scoreContainer.innerText = `Score: ${score}`;
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

    function insideLine(point, line) {
        const tolerance = 0.5;
        for (let segment of line) {
            for (let i = 0; i < segment.length - 1; i++) {
                let p1 = segment[i], p2 = segment[i + 1];
                let d = distanceToLineSegment(point, p1, p2);
                if (d < tolerance) return true;
            }
        }
        return false;
    }

    function distanceToLineSegment(p, v, w) {
        const l2 = Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
        if (l2 === 0) return Math.hypot(p[0] - v[0], p[1] - v[1]);
        let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p[0] - (v[0] + t * (w[0] - v[0])), p[1] - (v[1] + t * (w[1] - v[1])));
    }

    function showQuestion() {
        if (userDefinedQuestions.length > 0 && currentQuestionIndex < userDefinedQuestions.length) {
            questionContainer.innerText = userDefinedQuestions[currentQuestionIndex].question;
        } else {
            questionContainer.innerText = "Quiz complete!";
        }
    }

    updateSavedQuizList();
};

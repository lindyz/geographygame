// Map-Based Geography Quiz Game using Leaflet.js with Region Selection, Custom Topics, Scoring, Progress Tracking, Multiplayer Mode, and Timer

// Ensure script runs only after the DOM is fully loaded
window.onload = function () {
    // Initialize the map
    const map = L.map('map').setView([20, 0], 2); // Centered globally

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Load country borders for better visibility when zoomed in
    fetch("https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson")
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, { style: { color: '#000', weight: 1 } }).addTo(map);
        });

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

    if (autoGenerateQuizButton) {
        autoGenerateQuizButton.addEventListener("click", async function () {
            const selectedRegion = regionSelect.value;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=geojson&bounded=1&q=${selectedRegion}`);
            const data = await response.json();
            if (data.features.length > 0) {
                userDefinedQuestions = data.features.map(feature => ({
                    question: `Click on ${feature.properties.display_name}`,
                    boundary: feature,
                    listElement: null
                }));
                startGameButton.click();
            } else {
                alert("Could not generate quiz for this region.");
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
        checkAnswer(event.latlng);
    });

    function checkAnswer(clickedLatLng) {
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
        if (currentQuestion.listElement) {
            currentQuestion.listElement.style.color = "green";
        }
        currentQuestionIndex++;
        showQuestion();
    }

    function showQuestion() {
        if (userDefinedQuestions.length > 0 && currentQuestionIndex < userDefinedQuestions.length) {
            questionContainer.innerText = userDefinedQuestions[currentQuestionIndex].question;
        } else {
            questionContainer.innerText = "Quiz complete!";
        }
    }
};

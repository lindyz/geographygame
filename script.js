// Map-Based Geography Quiz Game using Leaflet.js with Region Selection, Custom Topics, Scoring, Progress Tracking, Multiplayer Mode, and Timer

// HTML Structure:
// - A div for the map
// - A dropdown for region selection
// - A text area for custom topics (countries, rivers, lakes, etc.)
// - A div for questions, feedback, score, multiplayer status, and timer

// Include Leaflet.js in your HTML file:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

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
let customTopics = [];
let userDefinedQuestions = [];
let score = 0;
let totalQuestions = 0;
let timeLeft = 30;
let timer;

// Handle region selection
const regionSelect = document.getElementById("region-select");
regionSelect.addEventListener("change", function() {
    const selectedRegion = regionSelect.value;
    if (regions[selectedRegion]) {
        map.fitBounds(regions[selectedRegion]);
    }
});

// Handle user-defined question entry
const placeInput = document.getElementById("place-name");
const countryInput = document.getElementById("country-name");
const addPlaceButton = document.getElementById("add-place");
const placeList = document.getElementById("place-list");
const timerContainer = document.getElementById("timer");
const feedbackContainer = document.getElementById("feedback");
const scoreContainer = document.getElementById("score");

addPlaceButton.addEventListener("click", async function() {
    const placeName = placeInput.value.trim();
    const countryName = countryInput.value.trim();
    
    if (placeName && countryName) {
        const coordinates = await getCoordinates(placeName, countryName);
        if (coordinates) {
            userDefinedQuestions.push({
                question: `Click on ${placeName}, ${countryName}`,
                correctLocation: coordinates,
                region: "User Defined"
            });
            const listItem = document.createElement("li");
            listItem.innerText = `${placeName}, ${countryName}`;
            placeList.appendChild(listItem);
            placeInput.value = "";
            countryInput.value = "";
        } else {
            alert("Could not find location. Please check spelling or try another place.");
        }
    }
});

async function getCoordinates(place, country) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place},${country}`);
    const data = await response.json();
    if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
}

// Timer Function
function resetTimer() {
    clearInterval(timer);
    timeLeft = 30;
    timerContainer.innerText = `Time Left: ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        timerContainer.innerText = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            feedbackContainer.innerText = "⏳ Time's up! Switching turns.";
            switchPlayer();
            showQuestion();
        }
    }, 1000);
}

// Multiplayer setup
const players = {};
let currentPlayer = "Player 1";

function switchPlayer() {
    currentPlayer = currentPlayer === "Player 1" ? "Player 2" : "Player 1";
    document.getElementById("player-status").innerText = `Current Turn: ${currentPlayer}`;
    resetTimer();
}

// Handle map clicks
map.on('click', function(event) {
    checkAnswer(event.latlng.lat, event.latlng.lng);
});

// Function to Check Answers
function checkAnswer(userLat, userLng) {
    const allQuestions = [...quizQuestions, ...userDefinedQuestions];
    const currentQuestion = allQuestions[currentQuestionIndex % allQuestions.length];
    const correct = currentQuestion.correctLocation;
    const distance = getDistance(userLat, userLng, correct[0], correct[1]);
    
    if (distance < 100) { // 100km tolerance
        feedbackContainer.innerText = "✅ Correct! Moving to the next question.";
        score += 10;
        scoreContainer.innerText = `Score: ${score}`;
        currentQuestionIndex++;
        showQuestion();
    } else {
        feedbackContainer.innerText = "❌ Incorrect, try again!";
    }
}

// Function to Calculate Distance Between Points
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Show First Question
function showQuestion() {
    const allQuestions = [...quizQuestions, ...userDefinedQuestions];
    if (allQuestions.length > 0) {
        questionContainer.innerText = allQuestions[currentQuestionIndex % allQuestions.length].question;
        resetTimer();
    } else {
        questionContainer.innerText = "No questions available.";
    }
}
showQuestion();

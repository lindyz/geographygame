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

// Multiplayer setup
const players = {};
let currentPlayer = "Player 1";

function switchPlayer() {
    currentPlayer = currentPlayer === "Player 1" ? "Player 2" : "Player 1";
    document.getElementById("player-status").innerText = `Current Turn: ${currentPlayer}`;
    resetTimer();
}

// Combined Questions List
const quizQuestions = [
    { question: "Click on the Amazon River", correctLocation: [-3.4653, -62.2159], region: "South America" },
    { question: "Click on the capital of Japan", correctLocation: [35.682839, 139.759455], region: "Asia" },
    { question: "Click on the Sahara Desert", correctLocation: [23.4162, 25.6628], region: "Africa" },
    { question: "Click on Mount Everest", correctLocation: [27.9881, 86.9250], region: "Asia" },
    { question: "Click on the Eiffel Tower", correctLocation: [48.8584, 2.2945], region: "Europe" }
];

let currentQuestionIndex = 0;

// Display Question
const questionContainer = document.getElementById("question");
const feedbackContainer = document.getElementById("feedback");
const scoreContainer = document.getElementById("score");

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

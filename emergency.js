let inactivityTimer;
let jwtToken = localStorage.getItem("jwt") || null;

// Function to send POST request to backend
function notifyInactivity() {
    jwtToken = localStorage.getItem("jwt") || null
    fetch('https://localhost:8080/inactivity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ message: "user inactive for too long" })
    })
    .then(response => console.log('Inactivity reported:', response.status))
    .catch(err => console.error('Error sending inactivity:', err));
}

// Reset inactivity timer
function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(notifyInactivity, 5 * 60 * 1000); // 5 minutes
}

// List of events to detect user activity
['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    document.addEventListener(event, resetTimer);
});

// Start the timer when page loads
resetTimer();
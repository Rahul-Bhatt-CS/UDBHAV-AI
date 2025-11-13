// ==== Elements ====
const authContainer = document.getElementById("authContainer");
const chatContainer = document.getElementById("chatContainer");
const authBtn = document.getElementById("authBtn");
const toggleAuth = document.getElementById("toggleAuth");
const authTitle = document.getElementById("authTitle");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const logoutBtn = document.getElementById("logoutBtn");
const typingIndicator = document.getElementById("typingIndicator");
const voiceToggleBtn = document.getElementById("voiceToggleBtn");

// ==== API Endpoints ====
const API_BASE = "http://localhost:8080";
const API_REGISTER = `${API_BASE}/auth/register`;
const API_LOGIN = `${API_BASE}/auth/login`;
const API_CHAT = `${API_BASE}/message`;
const API_OLD_CHATS = `${API_BASE}/chats`;

// ==== JWT ====
let jwtToken = localStorage.getItem("jwt") || null;

// ==== Auth ====
let isLoginMode = true;

toggleAuth.addEventListener("click", (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Login" : "Register";
  authBtn.textContent = isLoginMode ? "Login" : "Register";
  toggleAuth.innerHTML = isLoginMode
    ? `Don't have an account? <a href="#">Register</a>`
    : `Already have an account? <a href="#">Login</a>`;
});

authBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert("Enter username and password");

  const endpoint = isLoginMode ? API_LOGIN : API_REGISTER;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Error during authentication");
      return;
    }

    if (isLoginMode) {
      jwtToken = data.token;
      localStorage.setItem("jwt", jwtToken);
      showChatUI();
      loadOldChats();
    } else {
      alert("Registration successful! Please login now.");
      isLoginMode = true;
      authTitle.textContent = "Login";
      authBtn.textContent = "Login";
    }
  } 
});

function showChatUI() {
  authContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");
}

// ==== Logout ====
logoutBtn.addEventListener("click", () => {
  jwtToken = null;
  localStorage.removeItem("jwt");
  chatContainer.classList.add("hidden");
  authContainer.classList.remove("hidden");
  chatBox.innerHTML = "";
});

// ==== Voice ====
let voiceEnabled = true;
voiceToggleBtn.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  voiceToggleBtn.textContent = voiceEnabled ? "🔊 Voice: On" : "🔇 Voice: Off";
});

function speakText(text) {
  if (!voiceEnabled || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // --- Clean the text (remove symbols, markdown) ---
  const cleaned = text
    .replace(/\\n/g, " ")
    .replace(/[\*\_\#\[\]\(\)\{\}\<\>\~\`\=\+\^\%\$]/g, "")
    .replace(/\s+/g, " ")
    .replace(/([.,!?])([^\s])/g, "$1 $2")
    .replace(/[:;]/g, ",")
    .replace(/["']/g, "");

  // --- Detect Hindi vs English ---
  // If the text contains Hindi Unicode characters (Devanagari range)
  const isHindi = /[\u0900-\u097F]/.test(cleaned);

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = isHindi ? "hi-IN" : "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // --- Choose a suitable voice ---
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = null;

  if (isHindi) {
    selectedVoice = voices.find(v =>
      v.lang.toLowerCase().includes("hi") || v.name.toLowerCase().includes("hindi")
    );
  } else {
    selectedVoice = voices.find(v =>
      v.lang.toLowerCase().includes("en") && v.name.toLowerCase().includes("english")
    );
  }

  if (selectedVoice) utterance.voice = selectedVoice;
  else console.warn("No suitable voice found for", isHindi ? "Hindi" : "English");

  // Speak the text
  window.speechSynthesis.speak(utterance);
}

// ==== Message Append ====
async function appendMessage(text, sender) {
  // Clean text
  const cleaned = text
    .replace(/[\*\_\#\[\]\(\)\{\}\<\>\~\`\=\+\^\%\$]/g, "")
    .replace(/\s+/g, " ")
    .replace(/([.,!?])([^\s])/g, "$1 $2")
    .replace(/:/g, " ")
    .replace(/;/g, ",")
    .replace(/"/g, "")
    .replace(/'/g, "");

  // Convert backend \\n → <br>
  const formatted = cleaned.replace(/\\n/g, "<br>");

  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = formatted;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==== Send Message ====
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  input.value = "";

  typingIndicator.classList.remove("hidden");

  try {
    const response = await fetch(API_CHAT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    const reply = data.reply?.response || data.reply || "No response";

    typingIndicator.classList.add("hidden");
    appendMessage(reply, "bot");
    speakText(reply);

  } catch (error) {
    typingIndicator.classList.add("hidden");
    appendMessage("Error contacting server.", "bot");
    console.error(error);
  }
}



function newChat() {
  chatBox.innerHTML = "";
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => e.key === "Enter" && sendMessage());
newChatBtn.addEventListener("click", newChat);

// ==== Auto-login if JWT exists ====
if (jwtToken) {
  showChatUI();
}





const voiceInputBtn = document.getElementById("voiceInputBtn");
let recognition;

if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-IN";
  recognition.interimResults = false;

  recognition.onstart = () => {
    voiceInputBtn.classList.add("listening");
    voiceInputBtn.textContent = "🎙️ Listening...";
  };

  recognition.onend = () => {
    voiceInputBtn.classList.remove("listening");
    voiceInputBtn.textContent = "🎤";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript; // Fill the input box
    sendMessage(); // Automatically send message
  };

  voiceInputBtn.addEventListener("click", () => {
    recognition.start();
  });
} else {
  voiceInputBtn.disabled = true;
  voiceInputBtn.title = "Speech recognition not supported";
}

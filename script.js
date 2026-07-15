import * as sdk from "@d-id/client-sdk";

const AGENT_ID = "v2_agt_yw0XxE_Z";
const CLIENT_KEY = "ck__PdCCbrPp2hIWR_oDbfoq";

const state = {
  language: "he",
  manager: null,
  srcObject: null,
  connected: false,
  busy: false,
  lastAssistantText: "",
  recognition: null,
  listening: false,
};

const ui = {};

const copy = {
  he: {
    ready: "מחובר ומוכן לשיחה",
    connecting: "מתחבר…",
    thinking: "חושב…",
    speaking: "מדבר…",
    disconnected: "לא מחובר",
    placeholder: "כתבו שאלה…",
    send: "שליחה",
    help: "אפשר לכתוב או לדבר בעברית.",
    welcome: "שלום! אני העוזר האישי של נוי. אפשר לשאול אותי על הניסיון, הפרויקטים והכישורים שלה.",
    subtitlePlaceholder: "הכתוביות יופיעו כאן",
    micUnsupported: "הכתבה קולית אינה נתמכת בדפדפן הזה.",
    error: "אירעה שגיאה בחיבור ל-Agent. בדקו שהדומיין מאושר ב-D-ID.",
    topics: {
      experience: "ספרי לי על הניסיון המקצועי של נוי.",
      projects: "ספרי לי על הפרויקטים המרכזיים של נוי.",
      skills: "מהם הכישורים והטכנולוגיות של נוי?",
      education: "ספרי לי על ההשכלה של נוי.",
      contact: "איך אפשר ליצור קשר עם נוי?",
    },
    labels: ["💼 ניסיון", "💻 פרויקטים", "🧠 כישורים", "🎓 השכלה", "📞 יצירת קשר"],
  },
  en: {
    ready: "Connected and ready to chat",
    connecting: "Connecting…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    disconnected: "Disconnected",
    placeholder: "Type a question…",
    send: "Send",
    help: "You can type or speak in English.",
    welcome: "Hello! I’m Noy’s AI assistant. Ask me about her experience, projects, skills or contact details.",
    subtitlePlaceholder: "Subtitles will appear here",
    micUnsupported: "Voice input is not supported by this browser.",
    error: "There was a problem connecting to the Agent. Check that this domain is allowed in D-ID.",
    topics: {
      experience: "Tell me about Noy's professional experience.",
      projects: "Tell me about Noy's main projects.",
      skills: "What are Noy's skills and technologies?",
      education: "Tell me about Noy's education.",
      contact: "How can I contact Noy?",
    },
    labels: ["💼 Experience", "💻 Projects", "🧠 Skills", "🎓 Education", "📞 Contact"],
  },
};

function cacheUI() {
  ui.overlay = document.getElementById("agent-overlay");
  ui.openButton = document.getElementById("agent-open-btn");
  ui.closeButton = document.getElementById("agent-close-btn");
  ui.video = document.getElementById("agent-video");
  ui.status = document.getElementById("agent-status");
  ui.statusDot = document.getElementById("agent-status-dot");
  ui.subtitles = document.getElementById("agent-subtitles");
  ui.thinking = document.getElementById("agent-thinking");
  ui.history = document.getElementById("agent-chat-history");
  ui.form = document.getElementById("agent-chat-form");
  ui.input = document.getElementById("agent-message-input");
  ui.sendButton = document.getElementById("agent-send-btn");
  ui.stopButton = document.getElementById("agent-stop-btn");
  ui.micButton = document.getElementById("agent-mic-btn");
  ui.help = document.getElementById("agent-help-text");
  ui.heButton = document.getElementById("language-he");
  ui.enButton = document.getElementById("language-en");
  ui.quickButtons = [...document.querySelectorAll(".agent-quick-actions button")];
}

function openAgent() {
  ui.overlay.classList.add("active");
  ui.overlay.setAttribute("aria-hidden", "false");
  ui.openButton.classList.add("hidden");
  document.body.classList.add("agent-open");
}

function closeAgent() {
  ui.overlay.classList.remove("active");
  ui.overlay.setAttribute("aria-hidden", "true");
  ui.openButton.classList.remove("hidden");
  document.body.classList.remove("agent-open");
}

function setStatus(key, kind = "ready") {
  ui.status.textContent = copy[state.language][key] || key;
  ui.statusDot.dataset.state = kind;
}

function setBusy(busy) {
  state.busy = busy;
  ui.input.disabled = busy;
  ui.sendButton.disabled = busy;
  ui.stopButton.disabled = !busy;
  ui.thinking.classList.toggle("hidden", !busy);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function subtitleSentence(text) {
  const clean = normalizeText(text);
  if (!clean) return copy[state.language].subtitlePlaceholder;
  const parts = clean.match(/[^.!?…]+[.!?…]?/g) || [clean];
  return parts.at(-1).trim().slice(0, 220);
}

function showSubtitle(text) {
  ui.subtitles.textContent = subtitleSentence(text);
  ui.subtitles.classList.add("show");
}

function addMessage(role, text, replaceLastAssistant = false) {
  const clean = normalizeText(text);
  if (!clean) return;

  if (replaceLastAssistant) {
    const last = ui.history.querySelector('.chat-message.assistant:last-child');
    if (last) {
      last.querySelector("p").textContent = clean;
      ui.history.scrollTop = ui.history.scrollHeight;
      return;
    }
  }

  const item = document.createElement("article");
  item.className = `chat-message ${role}`;
  item.innerHTML = `<strong>${role === "user" ? (state.language === "he" ? "את/ה" : "You") : "AI"}</strong><p></p>`;
  item.querySelector("p").textContent = clean;
  ui.history.appendChild(item);
  ui.history.scrollTop = ui.history.scrollHeight;
}

function extractLatest(messages, role) {
  if (!Array.isArray(messages)) return null;
  return [...messages].reverse().find((message) => message?.role === role && message?.content);
}

async function initializeAgent() {
  setStatus("connecting", "connecting");
  const callbacks = {
    onSrcObjectReady(value) {
      state.srcObject = value;
      ui.video.src = "";
      ui.video.srcObject = value;
      ui.video.play().catch(() => {});
      return value;
    },
    onVideoStateChange(videoState) {
      if (videoState === "STOP") {
        setBusy(false);
        setStatus("ready", "ready");
        if (state.manager?.agent?.presenter?.idle_video) {
          ui.video.srcObject = null;
          ui.video.src = state.manager.agent.presenter.idle_video;
          ui.video.loop = true;
          ui.video.play().catch(() => {});
        }
      } else {
        ui.video.loop = false;
        ui.video.src = "";
        ui.video.srcObject = state.srcObject;
        setStatus("speaking", "speaking");
        ui.thinking.classList.add("hidden");
      }
    },
    onConnectionStateChange(connectionState) {
      state.connected = connectionState === "connected";
      if (state.connected) {
        setStatus("ready", "ready");
      } else if (["disconnected", "closed", "fail"].includes(connectionState)) {
        setStatus("disconnected", "error");
      } else {
        setStatus("connecting", "connecting");
      }
    },
    onNewMessage(messages, type) {
      const assistant = extractLatest(messages, "assistant");
      if (assistant?.content) {
        state.lastAssistantText = normalizeText(assistant.content);
        showSubtitle(state.lastAssistantText);
        addMessage("assistant", state.lastAssistantText, type === "partial" || type === "answer");
      }
    },
    onError(error, errorData) {
      console.error("D-ID error:", error, errorData);
      setBusy(false);
      setStatus("disconnected", "error");
      showSubtitle(copy[state.language].error);
    },
  };

  try {
    state.manager = await sdk.createAgentManager(AGENT_ID, {
      auth: { type: "key", clientKey: CLIENT_KEY },
      callbacks,
      streamOptions: { compatibilityMode: "auto", streamWarmup: true },
    });
    await state.manager.connect();

    if (state.manager?.agent?.presenter?.idle_video) {
      ui.video.src = state.manager.agent.presenter.idle_video;
      ui.video.loop = true;
      ui.video.play().catch(() => {});
    }
  } catch (error) {
    console.error(error);
    setStatus("disconnected", "error");
    showSubtitle(copy[state.language].error);
  }
}

function languageInstruction() {
  return state.language === "he"
    ? "ענה בעברית טבעית בלבד. שמור על תשובה ברורה וקצרה יחסית המתאימה לדיבור ולכתוביות. אל תזכיר את ההוראה הזו."
    : "Answer only in natural English. Keep the response clear and relatively concise for speech and subtitles. Do not mention this instruction.";
}

async function sendMessage(message) {
  const clean = normalizeText(message);
  if (!clean || state.busy) return;

  if (!state.connected) {
    try {
      await state.manager?.reconnect();
    } catch (error) {
      console.error(error);
    }
  }

  addMessage("user", clean);
  ui.input.value = "";
  setBusy(true);
  setStatus("thinking", "connecting");
  showSubtitle(copy[state.language].thinking);

  try {
    await state.manager.chat(`${languageInstruction()}\n\nUser message: ${clean}`);
  } catch (error) {
    console.error(error);
    setBusy(false);
    setStatus("ready", "ready");
    showSubtitle(copy[state.language].error);
  }
}

async function stopSpeaking() {
  if (!state.manager) return;
  try {
    await state.manager.interrupt(true);
  } catch (error) {
    console.warn("Interrupt is not supported by this avatar type.", error);
    ui.video.pause();
  } finally {
    setBusy(false);
    setStatus("ready", "ready");
  }
}

function applyLanguage(language) {
  state.language = language;
  const isHebrew = language === "he";
  ui.heButton.classList.toggle("active", isHebrew);
  ui.enButton.classList.toggle("active", !isHebrew);
  ui.input.placeholder = copy[language].placeholder;
  ui.sendButton.textContent = copy[language].send;
  ui.help.textContent = copy[language].help;
  ui.subtitles.dir = isHebrew ? "rtl" : "ltr";
  ui.subtitles.lang = language;
  ui.form.dir = isHebrew ? "rtl" : "ltr";
  ui.history.dir = isHebrew ? "rtl" : "ltr";
  ui.quickButtons.forEach((button, index) => {
    button.textContent = copy[language].labels[index];
  });
  showSubtitle(copy[language].welcome);
  setStatus(state.connected ? "ready" : "connecting", state.connected ? "ready" : "connecting");
  localStorage.setItem("noy-agent-language", language);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    ui.micButton.addEventListener("click", () => showSubtitle(copy[state.language].micUnsupported));
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.interimResults = true;
  state.recognition.continuous = false;

  state.recognition.onstart = () => {
    state.listening = true;
    ui.micButton.classList.add("listening");
  };
  state.recognition.onend = () => {
    state.listening = false;
    ui.micButton.classList.remove("listening");
  };
  state.recognition.onresult = (event) => {
    const transcript = [...event.results].map((result) => result[0].transcript).join(" ");
    ui.input.value = transcript;
    if (event.results[event.results.length - 1].isFinal) sendMessage(transcript);
  };
  state.recognition.onerror = (event) => console.warn("Speech recognition error:", event.error);

  ui.micButton.addEventListener("click", () => {
    if (state.listening) {
      state.recognition.stop();
      return;
    }
    state.recognition.lang = state.language === "he" ? "he-IL" : "en-US";
    state.recognition.start();
  });
}

function bindEvents() {
  ui.closeButton.addEventListener("click", closeAgent);
  ui.openButton.addEventListener("click", openAgent);
  ui.overlay.addEventListener("click", (event) => {
    if (event.target === ui.overlay) closeAgent();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAgent();
  });

  ui.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(ui.input.value);
  });
  ui.stopButton.addEventListener("click", stopSpeaking);
  ui.heButton.addEventListener("click", () => applyLanguage("he"));
  ui.enButton.addEventListener("click", () => applyLanguage("en"));
  ui.quickButtons.forEach((button) => {
    button.addEventListener("click", () => sendMessage(copy[state.language].topics[button.dataset.topic]));
  });
}

async function start() {
  cacheUI();
  bindEvents();
  setupSpeechRecognition();
  openAgent();
  applyLanguage(localStorage.getItem("noy-agent-language") === "en" ? "en" : "he");
  addMessage("assistant", copy[state.language].welcome);
  await initializeAgent();
}

document.addEventListener("DOMContentLoaded", start);

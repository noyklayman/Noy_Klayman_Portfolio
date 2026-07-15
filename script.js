document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("agent-open-btn");
  const closeButton = document.getElementById("agent-close-btn");
  const stopButton = document.getElementById("agent-stop-btn");
  const micButton = document.getElementById("agent-mic-btn");
  const status = document.getElementById("agent-status");
  const statusDot = document.getElementById("agent-status-dot");
  const subtitles = document.getElementById("agent-subtitles");
  const content = document.getElementById("agent-content");
  const welcomeTitle = document.getElementById("agent-welcome-title");
  const helpText = document.getElementById("agent-help-text");
  const openLabel = document.getElementById("agent-open-label");
  const heButton = document.getElementById("language-he");
  const enButton = document.getElementById("language-en");
  const quickButtons = Array.from(document.querySelectorAll(".agent-quick-actions button"));

  let selectedLanguage = localStorage.getItem("noy-agent-language") || "he";
  let micMuted = false;
  let subtitleTimer = null;

  const text = {
    he: {
      ready: "מחובר ומוכן לשיחה",
      connecting: "מתחבר…",
      speaking: "מדבר…",
      error: "לא ניתן להתחבר ל-Agent",
      title: "שלום! אני העוזר האישי של נוי.",
      help: "דברו או כתבו ישירות בתוך חלון ה-Agent. הוא הוגדר לזהות עברית ואנגלית.",
      open: "פתיחת העוזר",
      stop: "■ עצירה",
      mic: "🎤 מיקרופון",
      labels: ["💼 ניסיון", "💻 פרויקטים", "🧠 כישורים", "🎓 השכלה", "📞 יצירת קשר"],
      topics: {
        experience: "לנוי ניסיון בפיתוח Backend ובבניית יישומי AI. היא עובדת עם Java, Spring Boot, Python, REST APIs ומערכות מבוזרות.",
        projects: "הפרויקטים המרכזיים של נוי כוללים מנוע חיפוש מבוזר עם Kafka ו-Elasticsearch, מערכת TinyURL ומערכת לניהול סטודנטים.",
        skills: "הכישורים של נוי כוללים Java, Python, Spring Boot, React, Docker, Kafka, Redis, MongoDB, PostgreSQL, Elasticsearch וכלי AI.",
        education: "נוי השלימה תואר במדעי המחשב ורכשה בסיס חזק בתכנות, אלגוריתמים, מערכות תוכנה ופתרון בעיות.",
        contact: "אפשר ליצור קשר עם נוי דרך האימייל, WhatsApp, LinkedIn או GitHub המופיעים באזור יצירת הקשר באתר."
      }
    },
    en: {
      ready: "Connected and ready to chat",
      connecting: "Connecting…",
      speaking: "Speaking…",
      error: "Unable to connect to the Agent",
      title: "Hello! I’m Noy’s AI assistant.",
      help: "Speak or type directly inside the Agent window. It is configured to recognize Hebrew and English.",
      open: "Open AI Assistant",
      stop: "■ Stop",
      mic: "🎤 Microphone",
      labels: ["💼 Experience", "💻 Projects", "🧠 Skills", "🎓 Education", "📞 Contact"],
      topics: {
        experience: "Noy has hands-on experience in backend development and AI applications using Java, Spring Boot, Python, REST APIs and distributed systems.",
        projects: "Noy's main projects include a distributed search engine with Kafka and Elasticsearch, a TinyURL platform, and a student management system.",
        skills: "Noy works with Java, Python, Spring Boot, React, Docker, Kafka, Redis, MongoDB, PostgreSQL, Elasticsearch and AI technologies.",
        education: "Noy completed a Computer Science degree and developed a strong foundation in programming, algorithms, software systems and problem solving.",
        contact: "You can contact Noy by email, WhatsApp, LinkedIn or GitHub through the contact section of this website."
      }
    }
  };

  function openAgent() {
    if (!overlay) return;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    openButton?.classList.add("hidden");
    document.body.classList.add("agent-open");
  }

  function closeAgent() {
    if (!overlay) return;
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    openButton?.classList.remove("hidden");
    document.body.classList.remove("agent-open");
  }

  function setStatus(key, stateName) {
    status.textContent = text[selectedLanguage][key] || key;
    statusDot.dataset.state = stateName || "ready";
  }

  function showSubtitle(message, duration = 9000) {
    clearTimeout(subtitleTimer);
    subtitles.textContent = message;
    subtitles.classList.add("show");
    subtitleTimer = setTimeout(() => subtitles.classList.remove("show"), duration);
  }

  function getApi() {
    return window.DID_AGENTS_API || null;
  }

  function waitForApi(timeout = 12000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const timer = setInterval(() => {
        const api = getApi();
        if (api) {
          clearInterval(timer);
          resolve(api);
        } else if (Date.now() - started > timeout) {
          clearInterval(timer);
          reject(new Error("D-ID Embed API did not load"));
        }
      }, 120);
    });
  }

  function applyLanguage(language, announce = false) {
    selectedLanguage = language;
    localStorage.setItem("noy-agent-language", language);
    const isHebrew = language === "he";
    heButton.classList.toggle("active", isHebrew);
    enButton.classList.toggle("active", !isHebrew);
    content.dir = isHebrew ? "rtl" : "ltr";
    subtitles.dir = isHebrew ? "rtl" : "ltr";
    welcomeTitle.textContent = text[language].title;
    helpText.textContent = text[language].help;
    openLabel.textContent = text[language].open;
    stopButton.textContent = text[language].stop;
    micButton.textContent = text[language].mic;
    quickButtons.forEach((button, index) => button.textContent = text[language].labels[index]);
    setStatus("ready", "ready");

    if (announce) {
      const message = isHebrew
        ? "השיחה תמשיך בעברית. אפשר לדבר או לכתוב לי בעברית."
        : "The conversation will continue in English. You can speak or type in English.";
      speakText(message);
    }
  }

  async function speakText(message) {
    try {
      const api = await waitForApi();
      setStatus("speaking", "speaking");
      showSubtitle(message);
      await api.functions.speak({ type: "text", input: message });
    } catch (error) {
      console.error(error);
      setStatus("error", "error");
      showSubtitle(text[selectedLanguage].error, 6000);
    }
  }

  async function initializeEmbedControls() {
    setStatus("connecting", "connecting");
    try {
      const api = await waitForApi();
      api.configure({
        orientation: "vertical",
        openMode: "expanded",
        showChatToggle: true,
        showMicToggle: true,
        showRestartButton: true,
        autoConnect: true
      });

      api.events.on("connection", ({ state }) => {
        if (state === "connected") setStatus("ready", "ready");
        else if (["new", "connecting"].includes(state)) setStatus("connecting", "connecting");
        else setStatus("error", "error");
      });

      api.events.on("agentActivity", ({ state }) => {
        const normalized = String(state || "").toLowerCase();
        if (normalized.includes("speak") || normalized.includes("talk")) setStatus("speaking", "speaking");
        else if (normalized.includes("idle") || normalized.includes("listen")) setStatus("ready", "ready");
      });

      api.events.on("error", ({ error }) => {
        console.error("D-ID Embed error:", error);
        setStatus("error", "error");
      });
    } catch (error) {
      console.error(error);
      setStatus("error", "error");
    }
  }

  heButton.addEventListener("click", () => applyLanguage("he", true));
  enButton.addEventListener("click", () => applyLanguage("en", true));

  quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const topic = button.dataset.topic;
      speakText(text[selectedLanguage].topics[topic]);
    });
  });

  stopButton.addEventListener("click", async () => {
    try {
      const api = await waitForApi();
      await api.functions.interrupt();
      subtitles.classList.remove("show");
      setStatus("ready", "ready");
    } catch (error) {
      console.error(error);
    }
  });

  micButton.addEventListener("click", async () => {
    try {
      const api = await waitForApi();
      micMuted = !micMuted;
      await api.functions.toggleMicState(micMuted);
      micButton.setAttribute("aria-pressed", String(!micMuted));
      micButton.style.opacity = micMuted ? "0.65" : "1";
    } catch (error) {
      console.error(error);
    }
  });

  closeButton?.addEventListener("click", closeAgent);
  openButton?.addEventListener("click", openAgent);
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) closeAgent();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAgent();
  });

  applyLanguage(selectedLanguage, false);
  openAgent();
  initializeEmbedControls();
});

(function () {
  "use strict";

  function initInterface() {
    const overlay = document.getElementById("agent-overlay");
    const panel = document.querySelector(".agent-panel");
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

    if (!overlay || !openButton || !closeButton) {
      console.error("AI Assistant: required overlay buttons were not found.");
      return;
    }

    let selectedLanguage = "he";
    let micMuted = false;
    let subtitleTimer = null;
    let api = null;

    try {
      selectedLanguage = window.localStorage.getItem("noy-agent-language") || "he";
    } catch (error) {
      console.warn("AI Assistant: localStorage is unavailable; Hebrew will be used by default.");
    }

    const copy = {
      he: {
        ready: "מחובר ומוכן לשיחה",
        connecting: "מתחבר…",
        speaking: "מדבר…",
        thinking: "חושב…",
        error: "לא ניתן להתחבר ל-Agent",
        title: "שלום! אני העוזר האישי של נוי.",
        help: "אפשר לדבר בתוך חלון ה-Agent, או לבחור נושא מהכפתורים.",
        open: "Open AI Assistant",
        stop: "■ עצירה",
        micOn: "🎤 מיקרופון",
        micOff: "🔇 מיקרופון כבוי",
        languageMessage: "השיחה תמשיך בעברית. אפשר לדבר בעברית.",
        labels: [
  "💼 ניסיון",
  "💻 פרויקטים",
  "🧠 כישורים",
  "🎓 השכלה",
  "🪖 שירות צבאי",
  "📞 יצירת קשר"
],
        topics: {
          experience: "נוי היא מהנדסת בינה מלאכותית ומפתחת Backend עם ניסיון מעשי בבניית יישומים חכמים וממשקי API RESTful. היא פיתחה פרויקטים באמצעות Java, Spring Boot, Python, Docker, Kafka, Redis, MongoDB, PostgreSQL ו-Elasticsearch, עם דגש חזק על טכנולוגיות בינה מלאכותית וארכיטקטורת תוכנה מודרנית.",
          projects: "נוי בנתה מספר פרויקטים, הכוללים מנוע חיפוש מבוזר המופעל על ידי Kafka ו-Elasticsearch. פלטפורמת TinyURL Redis ו-MongoDB הניתנת להרחבה עם  ",
          skills: "הכישורים של נוי כוללים Java, Python, Spring Boot, React, Docker, Kafka, Redis, MongoDB, PostgreSQL, Elasticsearch וכלי AI.",
          education: "נוי בעלת תואר ראשון במדעי המחשב ורכשה בסיס חזק בתכנות, אלגוריתמים, מסדי נתונים מערכות מבוזרות ופתרון בעיות באמצעות פרויקטים אישיים וקבוצתיים.",
          military:" נוי שירתה כלוחמת באריות הירדן, גדוד מעורב. שירותה הצבאי חיזק את מנהיגותה, חוסנה, עבודת הצוות שלה והיכולת שלה לתפקד תחת לחץ",
          contact: "אפשר ליצור קשר עם נוי דרך האימייל, WhatsApp, LinkedIn או GitHub המופיעים באזור יצירת הקשר באתר."
        }
      },
      en: {
        ready: "Connected and ready to chat",
        connecting: "Connecting…",
        speaking: "Speaking…",
        thinking: "Thinking…",
        error: "Unable to connect to the Agent",
        title: "Hello! I’m Noy’s AI assistant.",
        help: "Speak inside the Agent window, or choose one of the suggested topics.",
        open: "Open AI Assistant",
        stop: "■ Stop",
        micOn: "🎤 Microphone",
        micOff: "🔇 Microphone muted",
        languageMessage: "The conversation will continue in English. You can speak in English.",
        labels: ["💼 Experience", "💻 Projects", "🧠 Skills", "🎓 Education", "🪖 Military", "📞 Contact"],
        topics: {
          experience: "Noy is an AI Engineer and Backend Developer with hands-on experience building intelligent applications, RESTful APIs, distributed systems, and scalable backend solutions. She has developed projects using Java, Spring Boot, Python, Docker, Kafka, MongoDB and PostgreSQL, with a strong focus on AI technologies and modern software architecture.",
          projects: "Noy has built several end-to-end software projects, including a distributed search engine powered by Kafka and Elasticsearch, and an AI-powered portfolio assistant capable of interacting with visitors in both English and Hebrew.",
          skills: "Noy's technical skills include Java, Python, Spring Boot, React, JavaScript, REST APIs, Docker, Kafka, Redis, MongoDB, PostgreSQL, Cassandra, Elasticsearch, Git, AWS, and conversational AI technologies.", 
          education: "Noy earned a Bachelor's degree in Computer Science, where she built a strong foundation in software engineering, algorithms, object-oriented programming, databases, distributed systems, and problem-solving through both individual and team-based software projects.",
          military: "Noy served as a Combat Soldier in the mixed-gender Lions of Jordan Battalion in the Israeli Defense Forces. Her military service strengthened her leadership, resilience, teamwork, and ability to perform under pressure.",
          contact: "If you would like to discuss opportunities, collaborate on a project, or simply get in touch, you can contact Noy via email, WhatsApp, LinkedIn, or GitHub using the Contact section at the bottom of this website."
        }
      }
    };

    function openAgent() {
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
      openButton.classList.add("hidden");
      document.body.classList.add("agent-open");
      closeButton.focus({ preventScroll: true });
    }

    function closeAgent() {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      openButton.classList.remove("hidden");
      document.body.classList.remove("agent-open");
      openButton.focus({ preventScroll: true });
    }

    function setStatus(key, stateName) {
      if (status) status.textContent = copy[selectedLanguage][key] || key;
      if (statusDot) statusDot.dataset.state = stateName || "ready";
    }

    function showSubtitle(message, duration) {
      if (!subtitles) return;
      window.clearTimeout(subtitleTimer);
      subtitles.textContent = message;
      subtitles.classList.add("show");
      subtitleTimer = window.setTimeout(function () {
        subtitles.classList.remove("show");
        subtitles.textContent = "";
      }, duration || 9000);
    }

    function hideSubtitle() {
      if (!subtitles) return;
      window.clearTimeout(subtitleTimer);
      subtitles.classList.remove("show");
      subtitles.textContent = "";
    }

    function saveLanguage(language) {
      try {
        window.localStorage.setItem("noy-agent-language", language);
      } catch (error) {
        // The interface still works when storage is blocked.
      }
    }

    function applyLanguage(language, announce) {
      selectedLanguage = language === "en" ? "en" : "he";
      saveLanguage(selectedLanguage);
      const isHebrew = selectedLanguage === "he";

      if (heButton) heButton.classList.toggle("active", isHebrew);
      if (enButton) enButton.classList.toggle("active", !isHebrew);
      if (content) content.dir = isHebrew ? "rtl" : "ltr";
      if (subtitles) {
        subtitles.dir = isHebrew ? "rtl" : "ltr";
        subtitles.lang = selectedLanguage;
      }
      if (welcomeTitle) welcomeTitle.textContent = copy[selectedLanguage].title;
      if (helpText) helpText.textContent = copy[selectedLanguage].help;
      if (openLabel) openLabel.textContent = copy[selectedLanguage].open;
      if (stopButton) stopButton.textContent = copy[selectedLanguage].stop;
      if (micButton) micButton.textContent = micMuted ? copy[selectedLanguage].micOff : copy[selectedLanguage].micOn;
      quickButtons.forEach(function (button, index) {
        button.textContent = copy[selectedLanguage].labels[index];
      });
      setStatus(api ? "ready" : "connecting", api ? "ready" : "connecting");

      if (announce) {
        speakText(copy[selectedLanguage].languageMessage);
      }
    }

    function waitForApi(timeout) {
      return new Promise(function (resolve, reject) {
        if (window.DID_AGENTS_API) {
          api = window.DID_AGENTS_API;
          resolve(api);
          return;
        }

        const started = Date.now();
        const timer = window.setInterval(function () {
          if (window.DID_AGENTS_API) {
            window.clearInterval(timer);
            api = window.DID_AGENTS_API;
            resolve(api);
          } else if (Date.now() - started >= (timeout || 20000)) {
            window.clearInterval(timer);
            reject(new Error("D-ID Embed API did not load"));
          }
        }, 100);
      });
    }

    async function speakText(message) {
      showSubtitle(message, 12000);
      setStatus("speaking", "speaking");

      try {
        const currentApi = api || await waitForApi(20000);
        await currentApi.functions.speak({ type: "text", input: message });
      } catch (error) {
        console.error("AI Assistant speak error:", error);
        setStatus("error", "error");
        showSubtitle(copy[selectedLanguage].error, 6000);
      }
    }

    function bindInterfaceEvents() {
      closeButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeAgent();
      });

      openButton.addEventListener("click", function (event) {
        event.preventDefault();
        openAgent();
      });

      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closeAgent();
      });

      if (panel) {
        panel.addEventListener("click", function (event) {
          event.stopPropagation();
        });
      }

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && overlay.classList.contains("active")) {
          closeAgent();
        }
      });

      if (heButton) heButton.addEventListener("click", function () { applyLanguage("he", true); });
      if (enButton) enButton.addEventListener("click", function () { applyLanguage("en", true); });

      quickButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          const topic = button.dataset.topic;
          const message = copy[selectedLanguage].topics[topic];
          if (message) speakText(message);
        });
      });

      if (stopButton) {
        stopButton.addEventListener("click", async function () {
          hideSubtitle();
          setStatus("ready", "ready");
          try {
            const currentApi = api || await waitForApi(5000);
            await currentApi.functions.interrupt();
          } catch (error) {
            console.warn("AI Assistant stop is unavailable:", error);
          }
        });
      }

      if (micButton) {
        micButton.addEventListener("click", async function () {
          micMuted = !micMuted;
          micButton.textContent = micMuted ? copy[selectedLanguage].micOff : copy[selectedLanguage].micOn;
          micButton.classList.toggle("muted", micMuted);
          micButton.setAttribute("aria-pressed", String(micMuted));

          try {
            const currentApi = api || await waitForApi(5000);
            await currentApi.functions.toggleMicState(micMuted);
          } catch (error) {
            console.warn("AI Assistant microphone control is unavailable:", error);
          }
        });
      }
    }

    async function connectAgentEvents() {
      setStatus("connecting", "connecting");
      try {
        const currentApi = await waitForApi(20000);
        api = currentApi;

        if (typeof currentApi.configure === "function") {
          currentApi.configure({
            orientation: "vertical",
            openMode: "expanded",
            showChatToggle: true,
            showMicToggle: true,
            showRestartButton: true,
            autoConnect: true
          });
        }

        currentApi.events.on("connection", function (payload) {
          const state = String(payload && payload.state || "").toLowerCase();
          if (state === "connected" || state === "completed") setStatus("ready", "ready");
          else if (state === "new" || state === "connecting") setStatus("connecting", "connecting");
          else if (state === "fail") setStatus("error", "error");
        });

        currentApi.events.on("agentActivity", function (payload) {
          const state = String(payload && payload.state || "").toUpperCase();
          if (state === "TALKING") setStatus("speaking", "speaking");
          else if (state === "LOADING" || state === "BUFFERING") setStatus("thinking", "thinking");
          else if (state === "IDLE") setStatus("ready", "ready");
        });

        currentApi.events.on("error", function (payload) {
          console.error("D-ID Embed error:", payload && payload.error);
          setStatus("error", "error");
        });

        setStatus("ready", "ready");
      } catch (error) {
        console.error("AI Assistant initialization error:", error);
        setStatus("error", "error");
      }
    }

    bindInterfaceEvents();
    applyLanguage(selectedLanguage, false);
    openAgent();

    // D-ID loads as an ES module, so its global API can appear after DOMContentLoaded.
    window.addEventListener("load", connectAgentEvents, { once: true });
    window.setTimeout(function () {
      if (!api) connectAgentEvents();
    }, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInterface, { once: true });
  } else {
    initInterface();
  }
})();

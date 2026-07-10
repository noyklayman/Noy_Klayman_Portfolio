document.addEventListener("DOMContentLoaded", function () {

  /* ==============================
     תפיסת האלמנטים
  ================================ */

  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("open-agent-btn");
  const closeButton = document.getElementById("agent-close-btn");

  const hebrewButton = document.getElementById("hebrew-btn");
  const englishButton = document.getElementById("english-btn");

  const agentTitle = document.getElementById("agent-title");
  const agentStatus = document.getElementById("agent-status");

  const instructionText = document.getElementById("instruction-text");
  const recognizedText = document.getElementById("recognized-text");

  const microphoneButton = document.getElementById("microphone-btn");
  const microphoneIcon = document.getElementById("microphone-icon");
  const microphoneText = document.getElementById("microphone-text");

  const openAgentText = document.getElementById("open-agent-text");

  const subtitleElement = document.getElementById("agent-subtitle");
  const placeholder = document.getElementById("avatar-placeholder");
  const placeholderText = document.getElementById("placeholder-text");

  const loader = document.getElementById("agent-loader");
  const errorElement = document.getElementById("agent-error");

  const video = document.getElementById("agent-video");


  /* ==============================
     משתנים
  ================================ */

  let selectedLanguage = "he-IL";
  let recognition = null;
  let isListening = false;
  let isAgentOpen = true;

  let silenceTimer = null;
  let currentTranscript = "";


  /* ==============================
     טקסטים לפי שפה
  ================================ */

  const translations = {
    "he-IL": {
      pageDirection: "rtl",
      title: "העוזר החכם שלי",
      connected: "מחובר ומוכן לשיחה",
      connecting: "מתחבר לאוואטר...",
      instruction: "לחצי על המיקרופון ודברי עם האוואטר",
      startTalking: "התחלת שיחה",
      listening: "מקשיב לך...",
      thinking: "חושב על תשובה...",
      speaking: "האוואטר מדבר",
      open: "פתחי את העוזר החכם",
      unsupported:
        "זיהוי דיבור אינו נתמך בדפדפן הזה. מומלץ להשתמש ב-Google Chrome.",
      microphoneError:
        "לא ניתן להשתמש במיקרופון. בדקי שנתת לאתר הרשאה למיקרופון.",
      generalError:
        "אירעה שגיאה. נסי שוב.",
      heard: "שמעתי:",
    },

    "en-US": {
      pageDirection: "ltr",
      title: "My AI Assistant",
      connected: "Connected and ready to chat",
      connecting: "Connecting to the avatar...",
      instruction: "Click the microphone and talk to the avatar",
      startTalking: "Start talking",
      listening: "Listening...",
      thinking: "Thinking...",
      speaking: "The avatar is speaking",
      open: "Open AI Assistant",
      unsupported:
        "Speech recognition is not supported in this browser. Google Chrome is recommended.",
      microphoneError:
        "The microphone could not be accessed. Check the browser permission.",
      generalError:
        "Something went wrong. Please try again.",
      heard: "I heard:",
    },
  };


  /* ==============================
     פתיחה וסגירה
  ================================ */

  function openAgent() {
    isAgentOpen = true;

    overlay.classList.add("active");
    openButton.classList.add("hidden");

    document.body.style.overflow = "hidden";

    hideError();

    /*
      כאן מתחברים ל-D-ID.

      אם כבר יש לך פונקציה בשם connectDID,
      הסירי את // מהשורה הבאה:
    */

    // connectDID();
  }


  function closeAgent() {
    isAgentOpen = false;

    overlay.classList.remove("active");
    openButton.classList.remove("hidden");

    document.body.style.overflow = "";

    stopListening();
    hideSubtitle();
    stopBrowserSpeech();

    /*
      כאן סוגרים את חיבור D-ID.

      אם כבר יש לך פונקציה בשם closeConnections,
      הסירי את // מהשורה הבאה:
    */

    // closeConnections();
  }


  closeButton.addEventListener("click", closeAgent);
  openButton.addEventListener("click", openAgent);


  /* ==============================
     החלפת שפה
  ================================ */

  function changeLanguage(language) {
    selectedLanguage = language;

    const text = translations[selectedLanguage];

    document.documentElement.lang =
      selectedLanguage === "he-IL" ? "he" : "en";

    document.documentElement.dir = text.pageDirection;

    agentTitle.textContent = text.title;
    agentStatus.textContent = text.connected;

    instructionText.textContent = text.instruction;
    microphoneText.textContent = text.startTalking;

    openAgentText.textContent = text.open;
    placeholderText.textContent = text.connecting;

    recognizedText.textContent = "";

    hebrewButton.classList.toggle(
      "active",
      selectedLanguage === "he-IL"
    );

    englishButton.classList.toggle(
      "active",
      selectedLanguage === "en-US"
    );

    subtitleElement.classList.remove("hebrew", "english");

    subtitleElement.classList.add(
      selectedLanguage === "he-IL"
        ? "hebrew"
        : "english"
    );

    stopListening();
    hideSubtitle();
    hideError();

    /*
      כאן אפשר לעדכן את השפה גם במערכת הצ'אט:

      selectedLanguage יכיל:
      he-IL עבור עברית
      en-US עבור אנגלית
    */
  }


  hebrewButton.addEventListener("click", function () {
    changeLanguage("he-IL");
  });


  englishButton.addEventListener("click", function () {
    changeLanguage("en-US");
  });


  /* ==============================
     זיהוי דיבור
  ================================ */

  function createSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showError(translations[selectedLanguage].unsupported);
      return null;
    }

    const newRecognition = new SpeechRecognition();

    newRecognition.lang = selectedLanguage;
    newRecognition.continuous = true;
    newRecognition.interimResults = true;

    newRecognition.onstart = function () {
      isListening = true;
      currentTranscript = "";

      microphoneButton.classList.add("listening");

      microphoneIcon.textContent = "⏹";
      microphoneText.textContent =
        translations[selectedLanguage].listening;

      instructionText.textContent =
        translations[selectedLanguage].listening;

      recognizedText.textContent = "";

      resetSilenceTimer(7000);
    };


    newRecognition.onresult = function (event) {
      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      currentTranscript = transcript.trim();

      recognizedText.textContent =
        currentTranscript.length > 0
          ? translations[selectedLanguage].heard +
            " " +
            currentTranscript
          : "";

      resetSilenceTimer(2500);
    };


    newRecognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);

      stopListening();

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        showError(
          translations[selectedLanguage].microphoneError
        );
      } else if (event.error !== "no-speech") {
        showError(
          translations[selectedLanguage].generalError
        );
      }
    };


    newRecognition.onend = function () {
      finishListening();
    };

    return newRecognition;
  }


  function startListening() {
    if (!isAgentOpen || isListening) {
      return;
    }

    hideError();
    hideSubtitle();
    stopBrowserSpeech();

    recognition = createSpeechRecognition();

    if (!recognition) {
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.error("Could not start recognition:", error);

      showError(
        translations[selectedLanguage].microphoneError
      );
    }
  }


  function stopListening() {
    clearSilenceTimer();

    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.log("Recognition is already stopped.");
      }

      recognition = null;
    }

    isListening = false;

    microphoneButton.classList.remove("listening");

    microphoneIcon.textContent = "🎤";

    microphoneText.textContent =
      translations[selectedLanguage].startTalking;

    instructionText.textContent =
      translations[selectedLanguage].instruction;
  }


  function finishListening() {
    clearSilenceTimer();

    const completedText = currentTranscript.trim();

    isListening = false;
    recognition = null;

    microphoneButton.classList.remove("listening");

    microphoneIcon.textContent = "🎤";

    if (completedText.length > 0) {
      sendMessageToAvatar(completedText);
    } else {
      microphoneText.textContent =
        translations[selectedLanguage].startTalking;

      instructionText.textContent =
        translations[selectedLanguage].instruction;
    }

    currentTranscript = "";
  }


  function resetSilenceTimer(milliseconds) {
    clearSilenceTimer();

    silenceTimer = window.setTimeout(function () {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.log("Recognition already stopped.");
        }
      }
    }, milliseconds);
  }


  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }


  microphoneButton.addEventListener("click", function () {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });


  /* ==============================
     שליחת השאלה לאוואטר
  ================================ */

  async function sendMessageToAvatar(question) {
    if (!question) {
      return;
    }

    const text = translations[selectedLanguage];

    setThinkingState(true);

    try {
      /*
        חשוב:

        כאן צריך לחבר את השרת שלך.

        הפונקציה צריכה:
        1. לשלוח את question למודל.
        2. לקבל בחזרה reply.
        3. לשלוח את reply ל-D-ID.
        4. להפעיל את הסרטון בתוך video.

        דוגמה למבנה הבקשה:
      */

      /*
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: question,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();

      const reply = data.reply;

      showSubtitle(reply);

      await talkToDID(reply, selectedLanguage);
      */


      /*
        זהו טקסט זמני לצורך בדיקת העיצוב בלבד.
        לאחר חיבור השרת, מחקי את החלק הזה.
      */

      const temporaryReply =
        selectedLanguage === "he-IL"
          ? "קיבלתי את השאלה שלך. כאן תופיע התשובה של האוואטר."
          : "I received your question. The avatar response will appear here.";

      showSubtitle(temporaryReply);

      /*
        הפעלה זמנית של קול הדפדפן.
        לאחר שהחיבור ל-D-ID עובד,
        אפשר למחוק את השורה הבאה.
      */

      speakWithBrowser(temporaryReply);

    } catch (error) {
      console.error("Avatar request error:", error);

      showError(text.generalError);

    } finally {
      setThinkingState(false);
    }
  }


  /* ==============================
     כתוביות
  ================================ */

  function showSubtitle(text) {
    if (!text) {
      hideSubtitle();
      return;
    }

    subtitleElement.textContent = text;

    subtitleElement.classList.remove(
      "hidden",
      "hebrew",
      "english"
    );

    subtitleElement.classList.add(
      selectedLanguage === "he-IL"
        ? "hebrew"
        : "english"
    );
  }


  function hideSubtitle() {
    subtitleElement.textContent = "";
    subtitleElement.classList.add("hidden");
  }


  /*
    ניתן לקרוא לפונקציה הזאת מהקוד הקיים שלך:

    showAvatarReply("הטקסט שהאוואטר אומר");
  */

  window.showAvatarReply = function (reply) {
    showSubtitle(reply);
  };


  /* ==============================
     קול זמני של הדפדפן
  ================================ */

  function speakWithBrowser(text) {
    if (
      !("speechSynthesis" in window) ||
      !text
    ) {
      return;
    }

    stopBrowserSpeech();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = selectedLanguage;

    const voices =
      window.speechSynthesis.getVoices();

    const languagePrefix =
      selectedLanguage.split("-")[0];

    const matchingVoice = voices.find(function (voice) {
      return voice.lang
        .toLowerCase()
        .startsWith(languagePrefix.toLowerCase());
    });

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = function () {
      instructionText.textContent =
        translations[selectedLanguage].speaking;
    };

    utterance.onend = function () {
      instructionText.textContent =
        translations[selectedLanguage].instruction;

      microphoneText.textContent =
        translations[selectedLanguage].startTalking;

      window.setTimeout(hideSubtitle, 1200);
    };

    utterance.onerror = function () {
      instructionText.textContent =
        translations[selectedLanguage].instruction;
    };

    window.speechSynthesis.speak(utterance);
  }


  function stopBrowserSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }


  /* ==============================
     מצב טעינה
  ================================ */

  function setThinkingState(isThinking) {
    microphoneButton.disabled = isThinking;

    loader.classList.toggle("hidden", !isThinking);

    if (isThinking) {
      microphoneText.textContent =
        translations[selectedLanguage].thinking;

      instructionText.textContent =
        translations[selectedLanguage].thinking;
    } else {
      microphoneText.textContent =
        translations[selectedLanguage].startTalking;

      instructionText.textContent =
        translations[selectedLanguage].instruction;
    }
  }


  /* ==============================
     הצגת הסרטון של D-ID
  ================================ */

  /*
    כאשר מתקבל stream מ-WebRTC,
    קראי לפונקציה כך:

    window.setAvatarStream(event.streams[0]);
  */

  window.setAvatarStream = async function (stream) {
    if (!stream) {
      return;
    }

    video.srcObject = stream;

    video.muted = false;

    video.onplaying = function () {
      placeholder.classList.add("hidden");
    };

    try {
      await video.play();
    } catch (error) {
      console.warn(
        "Autoplay with sound was blocked:",
        error
      );

      video.muted = true;

      try {
        await video.play();
      } catch (playError) {
        console.error(
          "Could not play avatar video:",
          playError
        );
      }
    }
  };


  /*
    כאשר הסרטון מסתיים או החיבור נסגר:
  */

  window.clearAvatarStream = function () {
    video.pause();
    video.srcObject = null;

    placeholder.classList.remove("hidden");

    hideSubtitle();
  };


  /* ==============================
     הודעות שגיאה
  ================================ */

  function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }


  function hideError() {
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }


  /* ==============================
     פתיחה אוטומטית
  ================================ */

  changeLanguage("he-IL");

  /*
    החלון נפתח אוטומטית מיד לאחר טעינת האתר.
  */

  openAgent();

});

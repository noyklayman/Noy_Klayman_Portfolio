document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("agent-overlay");
  const closeButton = document.getElementById("agent-close-btn");
  const openButton = document.getElementById("agent-open-btn");

  const englishButton =
    document.getElementById("agent-english-btn");

  const hebrewButton =
    document.getElementById("agent-hebrew-btn");

  const agentTitle =
    document.getElementById("agent-title");

  const agentStatus =
    document.getElementById("agent-status");

  const agentHelpText =
    document.getElementById("agent-help-text");

  const openAgentText =
    document.getElementById("agent-open-text");


  function openAgent() {
    if (!overlay || !openButton) {
      return;
    }

    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");

    openButton.classList.add("hidden");

    document.body.style.overflow = "hidden";
  }


  function closeAgent() {
    if (!overlay || !openButton) {
      return;
    }

    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");

    openButton.classList.remove("hidden");

    document.body.style.overflow = "";
  }


  function changeLanguage(language) {
    const isHebrew = language === "he";

    if (englishButton) {
      englishButton.classList.toggle(
        "active",
        !isHebrew
      );
    }

    if (hebrewButton) {
      hebrewButton.classList.toggle(
        "active",
        isHebrew
      );
    }

    if (agentTitle) {
      agentTitle.textContent = isHebrew
        ? "העוזר החכם שלי"
        : "My AI Assistant";
    }

    if (agentStatus) {
      agentStatus.textContent = isHebrew
        ? "מחובר ומוכן לשיחה"
        : "Connected and ready to chat";
    }

    if (agentHelpText) {
      agentHelpText.textContent = isHebrew
        ? "השתמשי בכפתורים שבתוך חלון האוואטר כדי להתחיל את השיחה."
        : "Use the controls inside the avatar window to start the conversation.";
    }

    if (openAgentText) {
      openAgentText.textContent = isHebrew
        ? "פתיחת העוזר החכם"
        : "Open AI Assistant";
    }

    document.documentElement.lang =
      isHebrew ? "he" : "en";
  }


  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeAgent
    );
  }


  if (openButton) {
    openButton.addEventListener(
      "click",
      openAgent
    );
  }


  if (englishButton) {
    englishButton.addEventListener(
      "click",
      function () {
        changeLanguage("en");
      }
    );
  }


  if (hebrewButton) {
    hebrewButton.addEventListener(
      "click",
      function () {
        changeLanguage("he");
      }
    );
  }


  changeLanguage("en");

  openAgent();
});

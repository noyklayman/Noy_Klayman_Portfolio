document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("agent-open-btn");
  const closeButton = document.getElementById("agent-close-btn");

  function openAgent() {
    if (!overlay) return;

    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");

    if (openButton) {
      openButton.classList.add("hidden");
    }

    document.body.classList.add("agent-open");
  }

  function closeAgent() {
    if (!overlay) return;

    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");

    if (openButton) {
      openButton.classList.remove("hidden");
    }

    document.body.classList.remove("agent-open");
  }

  // פתיחה אוטומטית כשהאתר נטען
  openAgent();

  // סגירה בלחיצה על X
  if (closeButton) {
    closeButton.addEventListener("click", closeAgent);
  }

  // פתיחה מחדש דרך הכפתור
  if (openButton) {
    openButton.addEventListener("click", openAgent);
  }

  // סגירה בלחיצה על הרקע שמחוץ לחלון
  if (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeAgent();
      }
    });
  }

  // סגירה בלחיצה על Esc
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAgent();
    }
  });
});

const agentSubtitles = document.getElementById("agent-subtitles");

function showAgentSubtitle(text) {
  if (!agentSubtitles || !text) {
    return;
  }

  agentSubtitles.textContent = text;
  agentSubtitles.classList.add("show");
}

function hideAgentSubtitle() {
  if (!agentSubtitles) {
    return;
  }

  agentSubtitles.classList.remove("show");
}

// בדיקה זמנית בלבד
showAgentSubtitle(
  "Hello! I'm Noy's AI assistant. Ask me anything about her projects."
);

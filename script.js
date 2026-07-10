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

  // פתיחה אוטומטית
  openAgent();

  // סגירה
  if (closeButton) {
    closeButton.addEventListener("click", closeAgent);
  }

  // פתיחה מחדש
  if (openButton) {
    openButton.addEventListener("click", openAgent);
  }

  // סגירה בלחיצה מחוץ לחלון
  if (overlay) {
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeAgent();
      }
    });
  }

  // Esc
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAgent();
    }
  });
});

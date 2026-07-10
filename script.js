document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("open-agent-btn");
  const closeButton = document.getElementById("agent-close-btn");
  const xButton = document.getElementById("agent-x-btn");
  const videoContainer = document.getElementById("agent-video-container");

  let agentElement = null;

  function findAgentElement() {
    return (
      document.querySelector(".didagent_target") ||
      document.querySelector('[data-testid="didagent_root"]') ||
      document.querySelector("did-agent")
    );
  }

  function moveAgentIntoVideoContainer() {
    agentElement = findAgentElement();

    if (!agentElement || !videoContainer) {
      return false;
    }

    if (agentElement.parentElement !== videoContainer) {
      videoContainer.appendChild(agentElement);
    }

    agentElement.classList.add("agent-inside-video");

    return true;
  }

  function openAgent() {
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");

    document.body.classList.add("agent-open");
    openButton.style.display = "none";

    moveAgentIntoVideoContainer();
  }

  function closeAgent() {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("agent-open");
    openButton.style.display = "block";
  }

  openButton.addEventListener("click", openAgent);
  closeButton.addEventListener("click", closeAgent);
  xButton.addEventListener("click", closeAgent);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeAgent();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAgent();
    }
  });

  const observer = new MutationObserver(() => {
    if (moveAgentIntoVideoContainer()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener("load", () => {
    const interval = setInterval(() => {
      if (moveAgentIntoVideoContainer()) {
        clearInterval(interval);

        /*
         * פתיחה אוטומטית של החלון בכניסה לאתר
         */
        openAgent();
      }
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
    }, 20000);
  });
});

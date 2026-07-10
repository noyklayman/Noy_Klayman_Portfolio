
<script>
  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("open-agent-btn");
  const closeButton = document.getElementById("agent-close-btn");
  const xButton = document.getElementById("agent-x-btn");
  const videoContainer = document.getElementById(
    "agent-video-container"
  );

  function openAgent() {
    overlay.classList.add("active");
    openButton.style.display = "none";

    moveAgentInsideModal();
  }

  function closeAgent() {
    overlay.classList.remove("active");
    openButton.style.display = "block";
  }

  openButton.addEventListener("click", openAgent);
  closeButton.addEventListener("click", closeAgent);
  xButton.addEventListener("click", closeAgent);

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeAgent();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAgent();
    }
  });

  function moveAgentInsideModal() {
    const didAgent = document.querySelector("did-agent");

    if (
      didAgent &&
      didAgent.parentElement !== videoContainer
    ) {
      videoContainer.appendChild(didAgent);
    }
  }

  const agentObserver = new MutationObserver(function () {
    moveAgentInsideModal();
  });

  agentObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  document
    .getElementById("ask-me-btn")
    .addEventListener("click", function () {
      moveAgentInsideModal();

      const didAgent = document.querySelector("did-agent");

      if (didAgent) {
        didAgent.click();
      }
    });

  document
    .getElementById("who-am-i-btn")
    .addEventListener("click", function () {
      const didAgent = document.querySelector("did-agent");

      if (!didAgent) {
        return;
      }

      const shadow = didAgent.shadowRoot;

      if (!shadow) {
        return;
      }

      const input =
        shadow.querySelector("textarea") ||
        shadow.querySelector(
          'input[type="text"]'
        );

      if (input) {
        input.value =
          "Who are you and how can you help me?";

        input.dispatchEvent(
          new Event("input", {
            bubbles: true
          })
        );

        input.focus();
      }
    });


  window.addEventListener("load", function () {
    setTimeout(moveAgentInsideModal, 1500);
    setTimeout(moveAgentInsideModal, 3000);
    setTimeout(moveAgentInsideModal, 5000);
  });
</script>

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("open-agent-btn");
  const closeButton = document.getElementById("agent-close-btn");
  const xButton = document.getElementById("agent-x-btn");

  const askMeButton = document.getElementById("ask-me-btn");
  const whoAmIButton = document.getElementById("who-am-i-btn");

  const connectionText = document.getElementById("connection-text");
  const subtitleBox = document.getElementById("agent-subtitles");
  const subtitleText = document.getElementById("subtitle-text");

  let lastSubtitle = "";
  let subtitleTimer = null;

  const observedRoots = new WeakSet();

  function openAgent() {
    if (!overlay || !openButton) {
      return;
    }

    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");

    document.body.classList.add("agent-open");

    openButton.style.display = "none";

    if (connectionText) {
      connectionText.textContent = "Online. Ask me anything!";
    }

    setTimeout(findAndObserveAgent, 500);
  }

  function closeAgent() {
    if (!overlay || !openButton) {
      return;
    }

    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("agent-open");

    openButton.style.display = "block";

    hideSubtitle();
  }

  function normalizeText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isInterfaceText(text) {
    const lowerText = normalizeText(text).toLowerCase();

    const ignoredTexts = [
      "ask me",
      "who am i",
      "close",
      "talk to my ai",
      "type your question",
      "online. ask me anything",
      "connecting to noy's avatar",
      "booting ai",
      "ai avatar",
      "send message",
      "start conversation",
      "end conversation",
      "microphone",
      "settings"
    ];

    return ignoredTexts.some((ignoredText) => {
      return lowerText === ignoredText ||
        lowerText.includes(ignoredText);
    });
  }

  function isPossibleSubtitle(text) {
    const cleanText = normalizeText(text);

    if (cleanText.length < 10 || cleanText.length > 700) {
      return false;
    }

    if (isInterfaceText(cleanText)) {
      return false;
    }

    const englishLetters = cleanText.match(/[a-zA-Z]/g);

    if (!englishLetters || englishLetters.length < 8) {
      return false;
    }

    const interfaceWords = [
      "ask me",
      "who am i",
      "type your question",
      "close"
    ];

    const lowerText = cleanText.toLowerCase();

    const interfaceWordsFound = interfaceWords.filter((word) => {
      return lowerText.includes(word);
    }).length;

    return interfaceWordsFound < 2;
  }

  function showSubtitle(text) {
    if (!subtitleBox || !subtitleText) {
      return;
    }

    const cleanText = normalizeText(text);

    if (
      !isPossibleSubtitle(cleanText) ||
      cleanText === lastSubtitle
    ) {
      return;
    }

    lastSubtitle = cleanText;

    clearTimeout(subtitleTimer);

    subtitleText.textContent = cleanText;
    subtitleBox.classList.add("show");

    const displayTime = Math.min(
      20000,
      Math.max(4500, cleanText.length * 65)
    );

    subtitleTimer = setTimeout(() => {
      subtitleBox.classList.remove("show");
    }, displayTime);
  }

  function hideSubtitle() {
    clearTimeout(subtitleTimer);

    if (subtitleBox) {
      subtitleBox.classList.remove("show");
    }

    if (subtitleText) {
      subtitleText.textContent = "";
    }

    lastSubtitle = "";
  }

  function inspectNode(node) {
    if (!node) {
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeText(node.textContent);

      if (isPossibleSubtitle(text)) {
        showSubtitle(text);
      }

      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node;

    const possibleMessages = element.matches(
      "p, span, article, [role='status'], [role='log'], [aria-live]"
    )
      ? [element]
      : Array.from(
          element.querySelectorAll(
            "p, span, article, [role='status'], [role='log'], [aria-live]"
          )
        );

    const candidateTexts = [];

    possibleMessages.forEach((messageElement) => {
      const text = normalizeText(
        messageElement.innerText ||
        messageElement.textContent
      );

      if (isPossibleSubtitle(text)) {
        candidateTexts.push(text);
      }
    });

    candidateTexts.sort((first, second) => {
      return first.length - second.length;
    });

    if (candidateTexts.length > 0) {
      showSubtitle(candidateTexts[0]);
    }

    /*
     * טיפול ב-Shadow DOM פנימי
     */
    if (element.shadowRoot) {
      observeRoot(element.shadowRoot);
    }

    element.querySelectorAll("*").forEach((child) => {
      if (child.shadowRoot) {
        observeRoot(child.shadowRoot);
      }
    });
  }

  function observeRoot(root) {
    if (!root || observedRoots.has(root)) {
      return;
    }

    observedRoots.add(root);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "characterData" &&
          mutation.target
        ) {
          inspectNode(mutation.target);
        }

        mutation.addedNodes.forEach((node) => {
          inspectNode(node);
        });

        if (mutation.target) {
          inspectNode(mutation.target);
        }
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });

    if (root.querySelectorAll) {
      root.querySelectorAll("*").forEach((element) => {
        if (element.shadowRoot) {
          observeRoot(element.shadowRoot);
        }
      });
    }
  }

  function getAgentElements() {
    const selectors = [
      '[data-testid="didagent_root"]',
      ".didagent_target",
      "did-agent"
    ];

    const elements = [];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (!elements.includes(element)) {
          elements.push(element);
        }
      });
    });

    return elements;
  }

  function findAndObserveAgent() {
    const agentElements = getAgentElements();

    agentElements.forEach((agentElement) => {
      observeRoot(agentElement);

      if (agentElement.shadowRoot) {
        observeRoot(agentElement.shadowRoot);
      }
    });
  }

  function findButtonsRecursively(root) {
    const buttons = [];

    if (!root || !root.querySelectorAll) {
      return buttons;
    }

    root.querySelectorAll("button").forEach((button) => {
      buttons.push(button);
    });

    root.querySelectorAll("*").forEach((element) => {
      if (element.shadowRoot) {
        buttons.push(
          ...findButtonsRecursively(element.shadowRoot)
        );
      }
    });

    return buttons;
  }

  function activateAgentMicrophone() {
    const agentElements = getAgentElements();

    agentElements.forEach((agentElement) => {
      const root = agentElement.shadowRoot || agentElement;
      const buttons = findButtonsRecursively(root);

      const microphoneButton = buttons.find((button) => {
        const text = normalizeText(
          button.innerText ||
          button.textContent
        ).toLowerCase();

        const ariaLabel = normalizeText(
          button.getAttribute("aria-label")
        ).toLowerCase();

        const title = normalizeText(
          button.getAttribute("title")
        ).toLowerCase();

        return (
          text.includes("ask") ||
          text.includes("start") ||
          ariaLabel.includes("microphone") ||
          ariaLabel.includes("speak") ||
          title.includes("microphone")
        );
      });

      if (microphoneButton) {
        microphoneButton.click();
      }
    });
  }

  if (openButton) {
    openButton.addEventListener("click", openAgent);
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeAgent);
  }

  if (xButton) {
    xButton.addEventListener("click", closeAgent);
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeAgent();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      overlay?.classList.contains("active")
    ) {
      closeAgent();
    }
  });

  if (askMeButton) {
    askMeButton.addEventListener("click", () => {
      activateAgentMicrophone();
    });
  }

  if (whoAmIButton) {
    whoAmIButton.addEventListener("click", () => {
      showSubtitle(
        "Ask me about Noy's experience, technical skills, AI projects, backend development, and software engineering background."
      );
    });
  }
  
  findAndObserveAgent();

  const agentSearchInterval = setInterval(() => {
    findAndObserveAgent();
  }, 1000);

  setTimeout(() => {
    clearInterval(agentSearchInterval);
  }, 60000);
});

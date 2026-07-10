<script>
  const overlay = document.getElementById("agent-overlay");
  const openButton = document.getElementById("open-agent-btn");
  const closeButton = document.getElementById("agent-close-btn");
  const xButton = document.getElementById("agent-x-btn");

  function openAgent() {
    overlay.classList.add("active");
    document.body.classList.add("agent-open");
    openButton.style.display = "none";
  }

  function closeAgent() {
    overlay.classList.remove("active");
    document.body.classList.remove("agent-open");
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
</script>

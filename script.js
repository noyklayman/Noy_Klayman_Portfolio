document.addEventListener("DOMContentLoaded", () => {

    const overlay = document.getElementById("agent-overlay");
    const openBtn = document.getElementById("agent-open-btn");
    const closeBtn = document.getElementById("agent-close-btn");

    function openAgent() {
        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");

        if (openBtn) {
            openBtn.classList.add("hidden");
        }

        document.body.classList.add("agent-open");
    }

    function closeAgent() {
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");

        if (openBtn) {
            openBtn.classList.remove("hidden");
        }

        document.body.classList.remove("agent-open");
    }

    // נפתח אוטומטית כשהאתר נטען
    openAgent();

    // סגירה
    if (closeBtn) {
        closeBtn.addEventListener("click", closeAgent);
    }

    // פתיחה מחדש
    if (openBtn) {
        openBtn.addEventListener("click", openAgent);
    }

    // סגירה בלחיצה על הרקע
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeAgent();
        }
    });

    // סגירה ב-ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeAgent();
        }
    });

});

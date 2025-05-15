function showBalloons() {
  const container = document.getElementById("balloon-container");

  if (!container) {
    console.error("Ballon-container niet gevonden.");
    return;
  }

  container.classList.add("fall-active");

  setTimeout(() => {
    container.classList.remove("fall-active");
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const isCorrect = document.body.getAttribute("data-correct-answer") === "true";
  if (isCorrect) {
    showBalloons();
  }
});
// Function to load external HTML into a placeholder
function loadHTML(id, file) {
  fetch(file)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      if (id === "footer") {
        document.getElementById("year").textContent = new Date().getFullYear();
      }
    });
}

// Load header & footer into placeholders
document.addEventListener("DOMContentLoaded", () => {
  loadHTML("header", "partials/header.html");
  loadHTML("footer", "partials/footer.html");
});

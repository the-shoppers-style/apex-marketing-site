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
// Load header & footer into placeholders
document.addEventListener("DOMContentLoaded", () => {
  // Always load the header
  loadHTML("header", "partials/header.html");

  // Check if we are on the products page
  const onProductsPage = window.location.pathname.includes("products.html");
  const isMobileView = window.innerWidth < 768;

  // The new rule: Load the footer UNLESS we are on the products page AND in mobile view.
  if (onProductsPage && isMobileView) {
    // It's the products page on mobile, so do nothing.
    // This prevents the network request for the footer.
  } else {
    // On all other pages, or on desktop view, load the footer normally.
    loadHTML("footer", "partials/footer.html");
  }
});

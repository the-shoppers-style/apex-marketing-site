// ======================
// Core product rendering
// ======================

const productGrid = document.getElementById("productGrid");

// Render product cards
function renderProducts(products) {
  productGrid.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "col-md-4 mb-4 product-card";
    card.dataset.category = product.category || "";
    card.dataset.gender = product.gender || "";
    card.dataset.materials = product.materials || "";

    card.innerHTML = `
      <div class="card h-100">
        <img src="${product.image}" class="card-img-top" alt="${product.title}">
        <div class="card-body">
          <h5 class="card-title">${product.title}</h5>
          <p class="card-text">${product.description}</p>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

// ======================
// Filtering logic
// ======================
function applyFilters(selected) {
  const allCards = document.querySelectorAll(".product-card");

  allCards.forEach((card) => {
    const matches = Object.entries(selected).every(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;
      if (Array.isArray(value)) return value.includes(card.dataset[key]);
      return card.dataset[key] === value;
    });
    card.style.display = matches ? "block" : "none";
  });

  // Update live counts for Materials
  const materialsCounts = {};
  allCards.forEach((card) => {
    if (card.style.display !== "none") {
      const mat = card.dataset.materials;
      materialsCounts[mat] = (materialsCounts[mat] || 0) + 1;
    }
  });

  document.querySelectorAll(".materials-count").forEach((badge) => {
    const mat = badge.dataset.materials;
    badge.textContent = materialsCounts[mat] || 0;
  });
}

// ======================
// Product Loader
// ======================
async function loadProducts(category = "all") {
  const files = category === "all" ? ["belts", "wallets", "bags"] : [category];
  let allProducts = [];

  for (const file of files) {
    try {
      const res = await fetch(`assets/data/${file}.json`);
      const data = await res.json();
      allProducts = allProducts.concat(data);
    } catch (e) {
      console.warn(`Could not load ${file}.json`);
    }
  }

  renderProducts(allProducts);

  // Build filters only for desktop for now
  if (typeof buildDesktopFilters === "function") {
    buildDesktopFilters(allProducts);
  }
}

loadProducts();

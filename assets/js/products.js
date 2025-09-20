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

      if (key === "category" && value === "all") return true;

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

  // Build filters first
  buildFiltersForViewport(allProducts);

  // Now apply filters (either saved or default "all")
  if (
    lastSelectedFilters &&
    (lastSelectedFilters.gender ||
      lastSelectedFilters.materials.length ||
      lastSelectedFilters.category !== "all")
  ) {
    reapplyFilters();
  } else {
    applyFilters({ gender: "", materials: [], category: "all" });
  }
}

let currentFilterMode = null;
let lastSelectedFilters = { gender: "", materials: [], category: "all" };

// Helper: collect active filters from DOM
function collectActiveFilters() {
  const gender = document.querySelector("input[name='filterGender']:checked");
  const materials = Array.from(
    document.querySelectorAll("input[name='filterMaterials']:checked")
  );
  const category = document.getElementById("categorySelector");

  lastSelectedFilters = {
    gender: gender ? gender.value : "",
    materials: materials.map((cb) => cb.value),
    category: category ? category.value : "all",
  };
}

// Helper: reapply saved filters into new UI
function reapplyFilters() {
  // Gender
  if (lastSelectedFilters.gender !== "") {
    const genderRadio = document.querySelector(
      `input[name='filterGender'][value='${lastSelectedFilters.gender}']`
    );
    if (genderRadio) genderRadio.checked = true;
  } else {
    const allRadio = document.querySelector("#filterGenderAll");
    if (allRadio) allRadio.checked = true;
  }

  // Materials
  if (lastSelectedFilters.materials.length > 0) {
    lastSelectedFilters.materials.forEach((v) => {
      const matCb = document.querySelector(
        `input[name='filterMaterials'][value='${v}']`
      );
      if (matCb) matCb.checked = true;
    });
  }

  // Category
  const catSelector = document.getElementById("categorySelector");
  if (catSelector && lastSelectedFilters.category) {
    catSelector.value = lastSelectedFilters.category;
  }

  // Apply them
  applyFilters(lastSelectedFilters);
}

// Choose mobile or desktop filters
function buildFiltersForViewport(data) {
  if (window.innerWidth < 768 && typeof buildMobileFilters === "function") {
    if (currentFilterMode !== "mobile") {
      collectActiveFilters();
      currentFilterMode = "mobile";
      buildMobileFilters(data);
      reapplyFilters();
    }
  } else if (typeof buildDesktopFilters === "function") {
    if (currentFilterMode !== "desktop") {
      collectActiveFilters();
      currentFilterMode = "desktop";
      buildDesktopFilters(data);
      reapplyFilters();
    }
  }
}

// Resize listener
window.addEventListener("resize", () => {
  const cards = Array.from(document.querySelectorAll(".product-card")).map(
    (card) => ({
      title: card.querySelector(".card-title").textContent,
      description: card.querySelector(".card-text").textContent,
      image: card.querySelector("img").src,
      category: card.dataset.category,
      gender: card.dataset.gender,
      materials: card.dataset.materials,
    })
  );
  buildFiltersForViewport(cards);
});

function waitFor(fnName, cb, timeout = 3000) {
  const start = Date.now();
  (function check() {
    if (typeof window[fnName] === "function") return cb();
    if (Date.now() - start > timeout) return cb(); // fallback after timeout
    setTimeout(check, 30);
  })();
}

// Wait for the desktop filter builder to be defined (if present), then load
waitFor("buildDesktopFilters", () => {
  loadProducts(); // initial load once builder is available (or timeout)
});

document.getElementById("productGrid").style.visibility = "visible";

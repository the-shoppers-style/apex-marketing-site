// ======================
// Global State Management
// ======================

// *** FIX #1: Create a reliable, global "source of truth" for the product list. ***
// This will hold all products for the currently selected category.
let _allProducts = [];

// *** FIX #2: Use sessionStorage to persist filters across page reloads. ***
let lastSelectedFilters = JSON.parse(
  sessionStorage.getItem("lastSelectedFilters")
) || {
  gender: "",
  materials: [],
  category: "all",
};

let currentFilterMode = null;
const productGrid = document.getElementById("productGrid");

// ======================
// Core product rendering
// ======================
function renderProducts(products) {
  const noProductsMessage = document.getElementById("noProductsMessage");
  productGrid.innerHTML = ""; // Clear grid but keep the message anchor
  productGrid.appendChild(noProductsMessage);

  if (products.length === 0) {
    noProductsMessage.style.display = "block";
  } else {
    noProductsMessage.style.display = "none";

    // Add product cards
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
}

// ======================
// Filtering logic
// ======================
function applyFilters(selected) {
  const allCards = document.querySelectorAll(".product-card");
  const noProductsMessage = document.getElementById("noProductsMessage");
  let visibleCount = 0;

  allCards.forEach((card) => {
    const matches = Object.entries(selected).every(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;

      // Skip category filter if products are already pre-filtered by category loading
      if (key === "category") {
        // Only apply category filter if we loaded "all" categories
        if (lastSelectedFilters.category === "all") {
          return value === "all" || card.dataset[key] === value;
        } else {
          // Products are already filtered by category during loading, so ignore category filter
          return true;
        }
      }

      if (Array.isArray(value)) return value.includes(card.dataset[key]);
      return card.dataset[key] === value;
    });

    card.style.display = matches ? "block" : "none";
    if (matches) visibleCount++;
  });

  noProductsMessage.style.display = visibleCount === 0 ? "block" : "none";
  const materialsCounts = {};
  allCards.forEach((card) => {
    // For materials count, only filter by gender (since products are already pre-filtered by category during loading)
    const matchesGender =
      !selected.gender ||
      selected.gender === "" ||
      card.dataset.gender === selected.gender;

    // Only count if it matches gender filter
    if (matchesGender) {
      const mat = card.dataset.materials;
      materialsCounts[mat] = (materialsCounts[mat] || 0) + 1;
    }
  });

  document.querySelectorAll(".materials-count").forEach((badge) => {
    const mat = badge.dataset.materials;
    badge.textContent = materialsCounts[mat] || 0;
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ======================
// Product Loader
// ======================
async function loadProducts(category = "all") {
  lastSelectedFilters.category = category; // Update category in state
  const files = category === "all" ? ["belts", "wallets", "bags"] : [category];
  let loadedProducts = [];

  for (const file of files) {
    try {
      const res = await fetch(`assets/data/${file}.json`);
      const data = await res.json();
      loadedProducts = loadedProducts.concat(data);
    } catch (e) {
      console.warn(`Could not load ${file}.json`);
    }
  }

  // *** Update the global "source of truth" for products ***
  _allProducts = loadedProducts;

  renderProducts(_allProducts);
  buildFiltersForViewport(_allProducts);
  reapplyFilters();
}

// ======================
// State and UI Sync
// ======================

// Helper: Collects filters from the DOM and saves the state.
function collectActiveFilters() {
  let gender, materials, category;

  if (currentFilterMode === "mobile") {
    gender = document.querySelector(
      "#mobileFiltersOffcanvas input[name='filterGender']:checked"
    );
    materials = Array.from(
      document.querySelectorAll(
        "#mobileFiltersOffcanvas input[name='filterMaterials']:checked"
      )
    );
    category = document.querySelector(
      "#mobileFiltersOffcanvas input[name='mobileCategory']:checked"
    );
    lastSelectedFilters.gender = gender ? gender.value : "";
    lastSelectedFilters.materials = materials.map((cb) => cb.value);
    lastSelectedFilters.category = category ? category.value : "all";
  } else {
    gender = document.querySelector(
      "#filtersWrapper input[name='filterGender']:checked"
    );
    materials = Array.from(
      document.querySelectorAll(
        "#filtersWrapper input[name='filterMaterials']:checked"
      )
    );
    const categorySelector = document.getElementById("categorySelector");
    lastSelectedFilters.gender = gender ? gender.value : "";
    lastSelectedFilters.materials = materials.map((cb) => cb.value);
    lastSelectedFilters.category = categorySelector
      ? categorySelector.value
      : "all";
  }

  // *** Save the updated state to sessionStorage ***
  sessionStorage.setItem(
    "lastSelectedFilters",
    JSON.stringify(lastSelectedFilters)
  );
}

// Helper: Applies the saved `lastSelectedFilters` state to the current UI.
function reapplyFilters() {
  if (currentFilterMode === "mobile") {
    const genderRadioMobile = document.querySelector(
      `#mobileFiltersOffcanvas input[name='filterGender'][value='${
        lastSelectedFilters.gender || ""
      }']`
    );
    if (genderRadioMobile) genderRadioMobile.checked = true;

    document
      .querySelectorAll("#mobileFiltersOffcanvas input[name='filterMaterials']")
      .forEach((cb) => (cb.checked = false));
    lastSelectedFilters.materials.forEach((v) => {
      const matCb = document.querySelector(
        `#mobileFiltersOffcanvas input[name='filterMaterials'][value='${v}']`
      );
      if (matCb) matCb.checked = true;
    });

    const categoryRadioMobile = document.querySelector(
      `#mobileFiltersOffcanvas input[name='mobileCategory'][value='${
        lastSelectedFilters.category || "all"
      }']`
    );
    if (categoryRadioMobile) categoryRadioMobile.checked = true;
  } else {
    const genderRadioDesktop = document.querySelector(
      `#filtersWrapper input[name='filterGender'][value='${
        lastSelectedFilters.gender || ""
      }']`
    );
    if (genderRadioDesktop) genderRadioDesktop.checked = true;

    document
      .querySelectorAll("#filtersWrapper input[name='filterMaterials']")
      .forEach((cb) => (cb.checked = false));
    lastSelectedFilters.materials.forEach((v) => {
      const matCb = document.querySelector(
        `#filtersWrapper input[name='filterMaterials'][value='${v}']`
      );
      if (matCb) matCb.checked = true;
    });

    const catSelector = document.getElementById("categorySelector");
    if (catSelector) catSelector.value = lastSelectedFilters.category;
  }
  applyFilters(lastSelectedFilters);
}

// Decides which filter UI to build and manages the transition.
function buildFiltersForViewport(data) {
  const mobileTrigger = document.getElementById("mobileFilterTrigger");
  const mobileOffcanvas = document.getElementById("mobileFiltersOffcanvas");

  if (window.innerWidth < 768 && typeof buildMobileFilters === "function") {
    if (currentFilterMode !== "mobile") {
      collectActiveFilters(); // Save state from desktop before switching
      currentFilterMode = "mobile";
      buildMobileFilters(data);
      reapplyFilters();
    }
  } else if (typeof buildDesktopFilters === "function") {
    if (currentFilterMode !== "desktop") {
      collectActiveFilters(); // Save state from mobile before switching

      if (mobileTrigger) mobileTrigger.remove();
      if (mobileOffcanvas) mobileOffcanvas.remove();

      currentFilterMode = "desktop";
      buildDesktopFilters(data);
      reapplyFilters();
    }
  }
}

// *** FIX #3: The resize handler is now simple and reliable. ***
// It no longer scrapes the DOM. It uses the `_allProducts` source of truth.
window.addEventListener("resize", () => {
  if (_allProducts.length > 0) {
    buildFiltersForViewport(_allProducts);
  }
});

function waitFor(fnName, cb, timeout = 3000) {
  const start = Date.now();
  (function check() {
    if (typeof window[fnName] === "function") return cb();
    if (Date.now() - start > timeout) return cb();
    setTimeout(check, 30);
  })();
}

// Initial page load
waitFor("buildDesktopFilters", () => {
  // Load products based on the category saved in sessionStorage (or 'all')
  loadProducts(lastSelectedFilters.category);

  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      // Reset the central state object
      lastSelectedFilters = { gender: "", materials: [], category: "all" };

      // *** Clear the state from sessionStorage ***
      sessionStorage.removeItem("lastSelectedFilters");

      // Reload products with the 'all' category and apply cleared filters
      loadProducts("all");

      // Animate the change
      productGrid.classList.add("fade-out");
      setTimeout(() => {
        productGrid.classList.remove("fade-out");
      }, 150);
    });
  }
});

document.getElementById("productGrid").style.visibility = "visible";

// ======================
// Global State Management
// ======================

let _allProducts = [];
// NEW: A master list to hold ALL products from all categories, used to build a complete filter UI.
let _masterProductList = [];

// Use sessionStorage to persist filters across page reloads.
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
// NEW: URL Management
// ======================

/**
 * Updates the browser's URL with the selected category without reloading the page.
 * @param {string} category The category to set in the URL (e.g., 'belts', or 'all').
 */
function updateUrlCategory(category) {
  const currentUrl = new URL(window.location);
  if (category && category !== "all") {
    currentUrl.searchParams.set("category", category);
  } else {
    currentUrl.searchParams.delete("category");
  }
  // Use replaceState to change the URL without creating new browser history entries for filter changes.
  history.replaceState({ category: category }, "", currentUrl.toString());
}

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
function applyFilters(selected, shouldScrollToTop = true) {
  // Use _allProducts as the source of truth for filtering
  const productsToFilter = _allProducts;
  const noProductsMessage = document.getElementById("noProductsMessage");
  let visibleCount = 0;

  // First, filter the product data in memory
  const filteredProducts = productsToFilter.filter((product) => {
    const cardData = product; // Use the product data directly
    const matches = Object.entries(selected).every(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;

      // The category is already handled by loadProducts, so we only need to filter gender and materials
      if (key === "category") return true;

      if (Array.isArray(value)) return value.includes(cardData[key]);
      return cardData[key] === value;
    });
    return matches;
  });

  // Now, render the filtered products
  renderProducts(filteredProducts);
  visibleCount = filteredProducts.length;

  noProductsMessage.style.display = visibleCount === 0 ? "block" : "none";

  // MODIFIED: Calculate material counts based on the currently loaded products (_allProducts)
  // and the selected gender, to show what is available within the current category.
  const materialsCounts = {};
  _allProducts.forEach((card) => {
    // For materials count, only filter by gender (since products are already pre-filtered by category during loading)
    const matchesGender =
      !selected.gender ||
      selected.gender === "" ||
      card.gender === selected.gender;

    // Only count if it matches gender filter
    if (matchesGender) {
      const mat = card.materials;
      materialsCounts[mat] = (materialsCounts[mat] || 0) + 1;
    }
  });

  document.querySelectorAll(".materials-count").forEach((badge) => {
    const mat = badge.dataset.materials;
    const count = materialsCounts[mat] || 0;
    badge.textContent = count;

    // Add/remove disabled class for badge styling
    if (count === 0) {
      badge.classList.add("disabled");
    } else {
      badge.classList.remove("disabled");
    }

    // Find ALL corresponding checkboxes for this material (desktop and mobile)
    const checkboxes = document.querySelectorAll(
      `input[name='filterMaterials'][value='${mat}']`
    );

    checkboxes.forEach((checkbox) => {
      const label = checkbox.nextElementSibling;

      if (count === 0) {
        checkbox.disabled = true;
        checkbox.checked = false; // Uncheck if disabled
        if (label) {
          label.style.color = "#6c757d"; // Bootstrap's text-muted color
          label.style.opacity = "0.6";
        }
      } else {
        // Enable when count > 0
        checkbox.disabled = false;
        if (label) {
          label.style.color = "";
          label.style.opacity = "";
        }
      }
    });
  });

  if (shouldScrollToTop) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update mobile materials state if mobile filters exist
  if (typeof updateMobileMaterialsState === "function") {
    updateMobileMaterialsState();
  }
}

// ======================
// Product Loader
// ======================
async function loadProducts(category = "all") {
  // Update the URL to reflect the loaded category
  updateUrlCategory(category);
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

  _allProducts = loadedProducts;

  // MODIFIED: Pass the master list to build the filter UI structure
  buildFiltersForViewport(_masterProductList);

  // Re-apply all filters (including gender/material) to the newly loaded products
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
        "#mobileFiltersOffcanvas input[name='filterMaterials']:checked:not(:disabled)"
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
        "#filtersWrapper input[name='filterMaterials']:checked:not(:disabled)"
      )
    );
    const categorySelector = document.getElementById("categorySelector");
    lastSelectedFilters.gender = gender ? gender.value : "";
    lastSelectedFilters.materials = materials.map((cb) => cb.value);
    lastSelectedFilters.category = categorySelector
      ? categorySelector.value
      : "all";
  }

  sessionStorage.setItem(
    "lastSelectedFilters",
    JSON.stringify(lastSelectedFilters)
  );
}

// Helper: Applies the saved `lastSelectedFilters` state to the current UI.
function reapplyFilters(shouldApplyFilters = true) {
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
      if (matCb && !matCb.disabled) matCb.checked = true;
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
      if (matCb && !matCb.disabled) matCb.checked = true;
    });

    const catSelector = document.getElementById("categorySelector");
    // Ensure the category selector is updated to reflect the state
    if (catSelector) catSelector.value = lastSelectedFilters.category;
  }
  // Only apply filters if requested (to avoid unnecessary product re-rendering)
  if (shouldApplyFilters) {
    applyFilters(lastSelectedFilters, false);
  }
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

// The resize handler now passes the master list to rebuild the filters correctly.
// It no longer scrapes the DOM.
window.addEventListener("resize", () => {
  if (_masterProductList.length > 0) {
    buildFiltersForViewport(_masterProductList);
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

// NEW: Function to load all product data to build a complete filter list
async function initializeMasterData() {
  try {
    const allFiles = ["belts", "wallets", "bags"];
    const fetchPromises = allFiles.map((file) =>
      fetch(`assets/data/${file}.json`).then((res) => res.json())
    );
    const allProductArrays = await Promise.all(fetchPromises);
    _masterProductList = allProductArrays.flat();
  } catch (e) {
    console.error("Could not load master product list for filters.", e);
  }
}

// MODIFIED: Initial page load logic
waitFor("buildDesktopFilters", async () => {
  // First, load all product data to build complete filters
  await initializeMasterData();

  // Then, determine the category to display
  const urlParams = new URLSearchParams(window.location.search);
  const urlCategory = urlParams.get("category");

  let initialCategory = "all";
  if (urlCategory) {
    // URL parameter has the highest priority
    initialCategory = urlCategory;
  } else {
    // Fall back to sessionStorage if no URL param
    initialCategory = lastSelectedFilters.category;
  }

  // Update the global state BEFORE loading products so reapplyFilters() can use it
  lastSelectedFilters.category = initialCategory;

  // Load the products for the determined category. This will also build the UI and apply all filters.
  await loadProducts(initialCategory);

  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      lastSelectedFilters = { gender: "", materials: [], category: "all" };
      sessionStorage.removeItem("lastSelectedFilters");
      updateUrlCategory("all"); // Also clear the URL
      // Reload products with the 'all' category and apply cleared filters
      loadProducts("all").then(() => {
        // Scroll to top after clearing filters
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      productGrid.classList.add("fade-out");
      setTimeout(() => {
        productGrid.classList.remove("fade-out");
      }, 150);
    });
  }
});

document.getElementById("productGrid").style.visibility = "visible";

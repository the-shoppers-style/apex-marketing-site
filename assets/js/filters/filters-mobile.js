// ======================
// Mobile Filters (Off-canvas)
// ======================

// Main function to build the mobile filter UI
function buildMobileFilters(data) {
  // Avoid re-creating the filter UI if it already exists
  if (document.getElementById("mobileFiltersOffcanvas")) {
    return;
  }

  // Create the HTML for the sticky trigger button and the off-canvas panel
  const mobileFiltersHTML = `
    <!-- Sticky Trigger Button -->
    <div id="mobileFilterTrigger" class="d-md-none position-fixed bottom-0 start-50 translate-middle-x w-100 p-3 bg-light border-top">
      <button class="btn btn-primary w-100" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileFiltersOffcanvas" aria-controls="mobileFiltersOffcanvas">
        Filters
      </button>
    </div>

    <!-- Off-canvas Panel -->
    <div class="offcanvas offcanvas-bottom d-md-none" tabindex="-1" id="mobileFiltersOffcanvas" aria-labelledby="mobileFiltersOffcanvasLabel" style="height: auto; max-height: 80vh;">
      <div class="offcanvas-header border-bottom">
        <h5 class="offcanvas-title" id="mobileFiltersOffcanvasLabel">Filters</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <div class="row">
          <!-- Left Column: Filter Navigation -->
          <div class="col-5">
            <div class="list-group filter-nav">
              <a href="#mobileCategory" class="list-group-item list-group-item-action active" aria-current="true">Category</a>
              <a href="#mobileGender" class="list-group-item list-group-item-action">Gender</a>
              <a href="#mobileMaterials" class="list-group-item list-group-item-action">Materials</a>
            </div>
          </div>

          <!-- Right Column: Filter Values -->
          <div class="col-7">
            <div class="filter-panes">
              <!-- Category Pane -->
              <div id="mobileCategory" class="filter-pane active">
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="mobileCategory" id="mobileCatAll" value="all" checked>
                  <label class="form-check-label" for="mobileCatAll">All</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="mobileCategory" id="mobileCatBelts" value="belts">
                  <label class="form-check-label" for="mobileCatBelts">Belts</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="mobileCategory" id="mobileCatWallets" value="wallets">
                  <label class="form-check-label" for="mobileCatWallets">Wallets</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="mobileCategory" id="mobileCatBags" value="bags">
                  <label class="form-check-label" for="mobileCatBags">Bags</label>
                </div>
              </div>

              <!-- Gender Pane -->
              <div id="mobileGender" class="filter-pane"></div>

              <!-- Materials Pane -->
              <div id="mobileMaterials" class="filter-pane"></div>
            </div>
          </div>
        </div>
      </div>
      <!-- Footer with Action Buttons -->
      <div class="offcanvas-footer p-3 border-top bg-light">
        <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
          <button id="mobileClearFiltersBtn" class="btn btn-outline-secondary w-100" type="button">Clear</button>
          <button id="mobileApplyFiltersBtn" class="btn btn-primary w-100" type="button">Apply Filters</button>
        </div>
      </div>
    </div>
  `;

  // Inject the HTML into the body
  document.body.insertAdjacentHTML("beforeend", mobileFiltersHTML);

  // --- Populate Dynamic Filters (Gender & Materials) ---
  const genderPane = document.getElementById("mobileGender");
  const materialsPane = document.getElementById("mobileMaterials");

  // Gender
  const genders = [...new Set(data.map((p) => p.gender).filter(Boolean))];
  let genderHTML = `
    <div class="form-check">
      <input class="form-check-input" type="radio" name="filterGender" id="mobileFilterGenderAll" value="" checked>
      <label class="form-check-label" for="mobileFilterGenderAll">All</label>
    </div>
  `;
  genders.forEach((v) => {
    genderHTML += `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="filterGender" id="mobileFilterGender${v}" value="${v}">
        <label class="form-check-label" for="mobileFilterGender${v}">${v}</label>
      </div>
    `;
  });
  genderPane.innerHTML = genderHTML; // Add event listeners to gender radio buttons to update materials state
  genderPane.querySelectorAll('input[name="filterGender"]').forEach((radio) => {
    radio.addEventListener("change", updateMobileMaterialsState);
  });
  // Materials
  const materials = [...new Set(data.map((p) => p.materials).filter(Boolean))];

  // Calculate initial counts for materials
  const materialsCounts = {};
  materials.forEach((v) => {
    materialsCounts[v] = data.filter((p) => p.materials === v).length;
  });
  let materialsHTML = "";
  materials.forEach((v) => {
    const count = materialsCounts[v];
    const isDisabled = count === 0 ? "disabled" : "";
    const labelStyle =
      count === 0 ? 'style="color: #6c757d; opacity: 0.6;"' : "";

    materialsHTML += `
      <div class="form-check d-flex justify-content-between align-items-center">
        <div>
          <input class="form-check-input" type="checkbox" name="filterMaterials" id="mobileFilterMaterials${v}" value="${v}" ${isDisabled}>
          <label class="form-check-label ms-1" for="mobileFilterMaterials${v}" ${labelStyle}>${v}</label>
        </div>
        <span class="badge bg-secondary rounded-pill materials-count" data-materials="${v}">${count}</span>
      </div>
    `;
  });
  materialsPane.innerHTML = materialsHTML;

  // Add event listeners to category radio buttons to update materials state
  document
    .querySelectorAll('#mobileCategory input[name="mobileCategory"]')
    .forEach((radio) => {
      radio.addEventListener("change", updateMobileMaterialsState);
    });

  // --- Add Event Listeners ---

  // For switching between filter panes (Category, Gender, etc.)
  document.querySelectorAll(".filter-nav a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(".filter-nav a.active").classList.remove("active");
      this.classList.add("active");

      const targetPaneId = this.getAttribute("href");
      document.querySelector(".filter-pane.active").classList.remove("active");
      document.querySelector(targetPaneId).classList.add("active");
    });
  });

  const offcanvasElement = document.getElementById("mobileFiltersOffcanvas");
  const offcanvas =
    bootstrap.Offcanvas.getInstance(offcanvasElement) ||
    new bootstrap.Offcanvas(offcanvasElement); // Store the category from when the filter was opened to see if we need to reload products
  let categoryBeforeOpening = "all";
  offcanvasElement.addEventListener("show.bs.offcanvas", function () {
    // Store the category before opening for comparison
    categoryBeforeOpening = lastSelectedFilters.category;

    // Restore UI to match saved state (don't collect from UI)
    reapplyFilters();

    // Update materials counts and disable state based on current filters
    updateMobileMaterialsState();
  });

  // Reset UI to saved state when panel is closed without applying (optional enhancement)
  offcanvasElement.addEventListener("hidden.bs.offcanvas", function () {
    // Restore UI to match saved state in case user made changes but didn't apply
    reapplyFilters();
  }); // Listener for the "Apply Filters" button
  document
    .getElementById("mobileApplyFiltersBtn")
    .addEventListener("click", () => {
      collectActiveFilters(); // Collect new selections from the mobile UI
      offcanvas.hide();

      // If the category has changed, we must reload the products from the new JSON file.
      // If not, we can just apply the filters to the products already in the view.
      if (lastSelectedFilters.category !== categoryBeforeOpening) {
        loadProducts(lastSelectedFilters.category);
      } else {
        applyFilters(lastSelectedFilters);
      }
    }); // Listener for the "Clear" button, which resets filters and reloads products
  document
    .getElementById("mobileClearFiltersBtn")
    .addEventListener("click", () => {
      // Reset the global state object (same as desktop clear)
      lastSelectedFilters = { gender: "", materials: [], category: "all" };

      // Clear the state from sessionStorage (same as desktop clear)
      sessionStorage.removeItem("lastSelectedFilters");

      // Reset category and gender radio buttons in UI
      const catAllRadio = document.querySelector("#mobileCatAll");
      const genderAllRadio = document.querySelector("#mobileFilterGenderAll");
      if (catAllRadio) catAllRadio.checked = true;
      if (genderAllRadio) genderAllRadio.checked = true;

      // Reset all material filters to enabled state
      const allMaterialCheckboxes = document.querySelectorAll(
        "#mobileFiltersOffcanvas input[name='filterMaterials']"
      );
      const allMaterialLabels = document.querySelectorAll(
        "#mobileFiltersOffcanvas input[name='filterMaterials'] + .form-check-label"
      );
      const allBadges = document.querySelectorAll(
        "#mobileFiltersOffcanvas .materials-count"
      );

      allMaterialCheckboxes.forEach((cb) => {
        cb.checked = false;
        cb.disabled = false;
      });

      allMaterialLabels.forEach((label) => {
        label.style.color = "";
        label.style.opacity = "";
        label.style.cursor = "";
      });

      allBadges.forEach((badge) => {
        badge.classList.remove("disabled");
      });

      // Reload products with the 'all' category (same as desktop clear)
      loadProducts("all");
    });
}

// Cache for fetched category data to avoid repeated requests
const categoryDataCache = {};

// Function to update mobile materials state based on current filters
async function updateMobileMaterialsState() {
  const mobileOffcanvas = document.getElementById("mobileFiltersOffcanvas");
  if (!mobileOffcanvas) return;

  const selectedGender = document.querySelector(
    "#mobileFiltersOffcanvas input[name='filterGender']:checked"
  );
  const selectedCategory = document.querySelector(
    "#mobileFiltersOffcanvas input[name='mobileCategory']:checked"
  );

  const currentGender = selectedGender ? selectedGender.value : "";
  const currentCategory = selectedCategory ? selectedCategory.value : "all";

  // Get the data source for calculating materials counts
  let dataSource = [];

  if (currentCategory === lastSelectedFilters.category) {
    // Use existing products if category matches
    dataSource = _allProducts;
  } else {
    // Fetch data for preview with caching
    const cacheKey = currentCategory;

    if (categoryDataCache[cacheKey]) {
      dataSource = categoryDataCache[cacheKey];
    } else {
      try {
        const files =
          currentCategory === "all"
            ? ["belts", "wallets", "bags"]
            : [currentCategory];

        const fetchPromises = files.map(async (file) => {
          const res = await fetch(`assets/data/${file}.json`);
          return res.json();
        });

        const results = await Promise.all(fetchPromises);
        dataSource = results.flat();

        // Cache the result
        categoryDataCache[cacheKey] = dataSource;
      } catch (e) {
        console.warn(`Could not load category data for preview: ${e.message}`);
        dataSource = _allProducts; // Fallback
      }
    }
  }

  // Calculate materials counts
  const materialsCounts = {};
  dataSource.forEach((product) => {
    if (!currentGender || product.gender === currentGender) {
      const mat = product.materials;
      materialsCounts[mat] = (materialsCounts[mat] || 0) + 1;
    }
  });

  // Update UI elements
  document
    .querySelectorAll("#mobileFiltersOffcanvas .materials-count")
    .forEach((badge) => {
      const mat = badge.dataset.materials;
      const count = materialsCounts[mat] || 0;
      badge.textContent = count;

      const checkbox = document.querySelector(
        `#mobileFiltersOffcanvas input[name='filterMaterials'][value='${mat}']`
      );
      if (checkbox) {
        const isDisabled = count === 0;
        checkbox.disabled = isDisabled;

        if (isDisabled) {
          checkbox.checked = false;
          badge.classList.add("disabled");
        } else {
          badge.classList.remove("disabled");
        }
      }
    });
}

// Add some basic styles for the mobile filter panes
const style = document.createElement("style");
style.innerHTML = `
  .filter-pane {
    display: none;
  }
  .filter-pane.active {
    display: block;
  }
  #mobileFilterTrigger {
    z-index: 1040; /* Sit below Bootstrap's offcanvas z-index */
  }
`;
document.head.appendChild(style);

// ======================
// Desktop Filters (Sidebar)
// ======================

let filters = {};

// Build filters (Gender, Materials, Category)
function buildDesktopFilters(masterData) {
  const filtersRow = document.getElementById("filtersRow");
  const categorySelector = document.getElementById("categorySelector");

  filtersRow.innerHTML = "";
  filters = {};

  // Explicit order: Gender first, then Materials
  const attributes = ["gender", "materials"];

  attributes.forEach((attr) => {
    // Get all possible values from the MASTER list to build the UI structure
    const values = [...new Set(masterData.map((p) => p[attr]).filter(Boolean))];
    if (values.length > 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "mb-3";

      const label = document.createElement("label");
      label.className = "form-label fw-semibold d-block mb-2";
      label.textContent = attr.charAt(0).toUpperCase() + attr.slice(1);
      wrapper.appendChild(label);

      if (attr === "gender") {
        const allId = `filterGenderAll`;
        wrapper.innerHTML += `
          <div class="form-check">
            <input class="form-check-input" type="radio" name="filterGender" id="${allId}" value="" checked>
            <label class="form-check-label" for="${allId}">All</label>
          </div>
        `;

        values.forEach((v) => {
          const id = `filterGender${v}`;
          wrapper.innerHTML += `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="filterGender" id="${id}" value="${v}">
              <label class="form-check-label" for="${id}">${v}</label>
            </div>
          `;
        });

        wrapper
          .querySelectorAll("input[name='filterGender']")
          .forEach((radio) => {
            radio.addEventListener("change", collectFilters);
          });

        filters[attr] = wrapper.querySelector("input[name='filterGender']");
      }

      if (attr === "materials") {
        // Calculate counts based on the CURRENTLY loaded products (_allProducts)
        const counts = {};
        _allProducts.forEach((p) => {
          counts[p.materials] = (counts[p.materials] || 0) + 1;
        });

        values.forEach((v) => {
          const id = `filterMaterials${v}`;
          const currentCount = counts[v] || 0; // Use the calculated count
          const isDisabled = currentCount === 0 ? "disabled" : "";
          const labelStyle =
            currentCount === 0 ? 'style="color: #6c757d; opacity: 0.6;"' : "";

          wrapper.innerHTML += `
            <div class="form-check d-flex justify-content-between align-items-center">
              <div>
                <input class="form-check-input filter-materials" type="checkbox" name="filterMaterials" id="${id}" value="${v}" ${isDisabled}>
                <label class="form-check-label ms-1" for="${id}" ${labelStyle}>${v}</label>
              </div>
              <span class="badge bg-secondary rounded-pill materials-count" data-materials="${v}">${currentCount}</span>
            </div>
          `;
        });

        const mats = wrapper.querySelectorAll(".filter-materials");
        mats.forEach((cb) => cb.addEventListener("change", collectFilters));
        filters[attr] = mats;
      }

      const hr = document.createElement("hr");
      wrapper.appendChild(hr);
      filtersRow.appendChild(wrapper);
    }
  });

  // Category filter (dropdown) is static, just listen
  if (categorySelector) {
    // Remove any old listener to prevent duplicates
    const newSelector = categorySelector.cloneNode(true);
    categorySelector.parentNode.replaceChild(newSelector, categorySelector);

    newSelector.addEventListener("change", async () => {
      const newCategory = newSelector.value;
      // Update URL when category changes
      updateUrlCategory(newCategory);
      // When category changes, reset other filters
      lastSelectedFilters.gender = "";
      lastSelectedFilters.materials = [];
      await loadProducts(newCategory);
    });
  }
}

// Collect current filter selections and apply
function collectFilters() {
  // Use the global function to update lastSelectedFilters from the desktop UI.
  // This ensures the application's state is always current.
  collectActiveFilters();

  // Now, apply the filters using that centrally-managed state.
  applyFilters(lastSelectedFilters);
}

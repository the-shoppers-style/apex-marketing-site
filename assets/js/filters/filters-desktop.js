// ======================
// Desktop Filters (Sidebar)
// ======================

let filters = {};

// Build filters (Gender, Materials, Category)
function buildDesktopFilters(data) {
  const filtersRow = document.getElementById("filtersRow");
  const categorySelector = document.getElementById("categorySelector");

  filtersRow.innerHTML = "";
  filters = {};

  // Explicit order: Gender first, then Materials
  const attributes = ["gender", "materials"];

  attributes.forEach((attr) => {
    const values = [...new Set(data.map((p) => p[attr]).filter(Boolean))];
    if (values.length > 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "mb-3";

      const label = document.createElement("label");
      label.className = "form-label fw-semibold d-block mb-2";
      label.textContent = attr.charAt(0).toUpperCase() + attr.slice(1);
      wrapper.appendChild(label);

      if (attr === "gender") {
        // Radios for Gender
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
        const counts = {};
        values.forEach((v) => {
          counts[v] = data.filter((p) => p[attr] === v).length;
        });

        values.forEach((v) => {
          const id = `filterMaterials${v}`;
          wrapper.innerHTML += `
            <div class="form-check d-flex justify-content-between align-items-center">
              <div>
                <input class="form-check-input filter-materials" type="checkbox" name="filterMaterials" id="${id}" value="${v}">
                <label class="form-check-label ms-1" for="${id}">${v}</label>
              </div>
              <span class="badge bg-secondary rounded-pill materials-count" data-materials="${v}">${counts[v]}</span>
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
    categorySelector.addEventListener("change", async () => {
      await loadProducts(categorySelector.value);
    });
  }

  // Initial apply
  collectFilters();
}

// Collect current filter selections and apply
function collectFilters() {
  const selected = {};

  // Gender
  const checkedGender = document.querySelector(
    "input[name='filterGender']:checked"
  );
  selected.gender = checkedGender ? checkedGender.value : "";

  // Materials
  const checkedMaterials = Array.from(
    document.querySelectorAll("input[name='filterMaterials']:checked")
  );
  selected.materials = checkedMaterials.map((cb) => cb.value);

  applyFilters(selected);
}

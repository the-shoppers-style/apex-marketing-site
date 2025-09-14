document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("productGrid");
  const categorySelector = document.getElementById("categorySelector");
  const filtersRow = document.getElementById("filtersRow");

  let products = [];
  let filters = {};

  // Load products from one JSON file
  async function loadCategory(category) {
    try {
      const response = await fetch(`assets/data/${category}.json`);
      return await response.json();
    } catch (err) {
      console.warn(`No data found for category: ${category}`);
      return []; // return empty if file not found
    }
  }

  // Load all categories or a single one
  async function loadProducts(category) {
    if (category === "all") {
      const belts = await loadCategory("belts");
      const wallets = await loadCategory("wallets");
      const bags = await loadCategory("bags");
      products = [...belts, ...wallets, ...bags];
    } else {
      products = await loadCategory(category);
    }

    buildFilters(products);
    renderProducts(products);
  }

  // Render product cards
  function renderProducts(data) {
    productGrid.innerHTML = "";

    if (data.length === 0) {
      productGrid.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
          <p>No products available in this category.</p>
        </div>`;
      return;
    }

    data.forEach((product) => {
      const card = document.createElement("div");
      card.className = "col-sm-6 col-lg-4 product-card";
      card.dataset.type = product.type || "";
      card.dataset.size = product.size || "";
      card.dataset.gender = product.gender || "";
      card.dataset.color = product.color || "";
      card.dataset.category = product.category || "";

      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${product.image}" class="card-img-top" alt="${product.title}">
          <div class="card-body">
            <h5 class="card-title">${product.title}</h5>
            <p class="card-text text-muted">${product.description}</p>
          </div>
        </div>
      `;

      productGrid.appendChild(card);
    });
  }

  // Build filters dynamically
  function buildFilters(data) {
    filtersRow.innerHTML = "";
    filters = {};

    // Explicit order: Gender first, then Type
    const attributes = ["gender", "type"];

    attributes.forEach((attr, index) => {
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
              radio.addEventListener("change", filterProducts);
            });

          filters[attr] = wrapper.querySelector("input[name='filterGender']");
        }

        if (attr === "type") {
          const counts = {};
          values.forEach((v) => {
            counts[v] = data.filter((p) => p[attr] === v).length;
          });

          values.forEach((v) => {
            const id = `filterType${v}`;
            wrapper.innerHTML += `
              <div class="form-check d-flex justify-content-between align-items-center">
                <div>
                  <input class="form-check-input filter-type" type="checkbox" name="filterType" id="${id}" value="${v}">
                  <label class="form-check-label ms-1" for="${id}">${v}</label>
                </div>
                <span class="badge bg-secondary rounded-pill type-count" data-type="${v}">${counts[v]}</span>
              </div>
            `;
          });

          const typeCheckboxes = wrapper.querySelectorAll(".filter-type");

          // Hook change events
          typeCheckboxes.forEach((cb) => {
            cb.addEventListener("change", filterProducts);
          });

          filters[attr] = typeCheckboxes;
        }

        if (index < attributes.length - 1) {
          const hr = document.createElement("hr");
          wrapper.appendChild(hr);
        }

        filtersRow.appendChild(wrapper);
      }
    });
  }

  // Filtering logic
  function filterProducts() {
    const selected = {};

    Object.entries(filters).forEach(([key, element]) => {
      if (key === "gender") {
        const checked = document.querySelector(
          "input[name='filterGender']:checked"
        );
        selected[key] = checked ? checked.value : "";
      } else if (key === "type") {
        const checkedBoxes = Array.from(
          document.querySelectorAll("input[name='filterType']:checked")
        );
        selected[key] = checkedBoxes.map((cb) => cb.value);
      }
    });

    // Apply filtering to products
    const allCards = document.querySelectorAll(".product-card");
    allCards.forEach((card) => {
      const matches = Object.entries(selected).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        if (Array.isArray(value)) return value.includes(card.dataset[key]);
        return card.dataset[key] === value;
      });
      card.style.display = matches ? "block" : "none";
    });

    // 🔥 Update Type counts live
    const typeCounts = {};
    allCards.forEach((card) => {
      if (card.style.display !== "none") {
        const type = card.dataset.type;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    document.querySelectorAll(".type-count").forEach((badge) => {
      const type = badge.dataset.type;
      badge.textContent = typeCounts[type] || 0;
    });
  }

  // Handle category change
  categorySelector.addEventListener("change", (e) => {
    loadProducts(e.target.value);
  });

  // Initial load: show all
  loadProducts("all");

  // Clear filters button logic
  const clearBtn = document.getElementById("clearFiltersBtn");
  clearBtn.addEventListener("click", async () => {
    // Fade out the grid
    productGrid.classList.add("fade-out");

    setTimeout(async () => {
      // Reset category back to "All"
      categorySelector.value = "all";

      // Reload all products (belts, wallets, bags)
      await loadProducts("all");

      // Reset all attribute filter dropdowns (after rebuild)
      Object.values(filters).forEach((select) => {
        select.value = "";
      });

      // Fade in after reload
      productGrid.classList.remove("fade-out");
      productGrid.classList.add("fade-in");

      // Remove fade-in after animation completes
      setTimeout(() => {
        productGrid.classList.remove("fade-in");
      }, 300);
    }, 300);
  });
});

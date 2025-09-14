document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.getElementById("productGrid");
  const categorySelector = document.getElementById("categorySelector");
  const filtersRow = document.getElementById("filtersRow");

  let products = [];
  let filters = {};

  // Load JSON for given category
  async function loadProducts(category) {
    try {
      const response = await fetch(`assets/data/${category}.json`);
      products = await response.json();
      buildFilters(products);
      renderProducts(products);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  }

  // Render product cards
  function renderProducts(data) {
    productGrid.innerHTML = "";
    data.forEach((product) => {
      const card = document.createElement("div");
      card.className = "col-sm-6 col-lg-4 product-card";
      card.dataset.type = product.type || "";
      card.dataset.size = product.size || "";
      card.dataset.gender = product.gender || "";
      card.dataset.color = product.color || "";

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
    filtersRow.innerHTML = ""; // reset
    filters = {}; // reset references

    const attributes = ["type", "size", "gender", "color"];

    attributes.forEach((attr, index) => {
      const values = [...new Set(data.map((p) => p[attr]).filter(Boolean))];
      if (values.length > 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "mb-3";

        const label = document.createElement("label");
        label.className = "form-label fw-semibold";
        label.textContent = attr.charAt(0).toUpperCase() + attr.slice(1);

        const select = document.createElement("select");
        select.id = `filter${attr.charAt(0).toUpperCase() + attr.slice(1)}`;
        select.className = "form-select";
        select.innerHTML = `<option value="">All</option>`;

        values.forEach((v) => {
          select.innerHTML += `<option value="${v}">${
            v.charAt(0).toUpperCase() + v.slice(1)
          }</option>`;
        });

        select.addEventListener("change", filterProducts);

        wrapper.appendChild(label);
        wrapper.appendChild(select);

        // Add <hr> before next filter except after last one
        if (index < attributes.length - 1) {
          const hr = document.createElement("hr");
          wrapper.appendChild(hr);
        }

        filtersRow.appendChild(wrapper);
        filters[attr] = select;
      }
    });
  }

  // Filter logic
  function filterProducts() {
    const selected = {};
    Object.entries(filters).forEach(([key, select]) => {
      selected[key] = select.value;
    });

    document.querySelectorAll(".product-card").forEach((card) => {
      const matches = Object.entries(selected).every(
        ([key, value]) => !value || card.dataset[key] === value
      );
      card.style.display = matches ? "block" : "none";
    });
  }

  // Category change
  categorySelector.addEventListener("change", (e) => {
    loadProducts(e.target.value);
  });

  // Initial load
  loadProducts("belts");
});

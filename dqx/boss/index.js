const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const syncStateToURL = () => {
  const params = new URLSearchParams();

  if (selectedBosses.length) {
    params.set("boss", selectedBosses.join(","));
  }

  if (selectedCategories.length !== Object.keys(CATEGORY_DEFS).length) {
    params.set("cat", selectedCategories.join(","));
  }

  history.replaceState(null, "", "?" + params.toString());
};

const loadStateFromURL = () => {
  const params = new URLSearchParams(location.search);

  if (params.has("boss")) {
    selectedBosses = params.get("boss").split(",").map(Number);
  }

  if (params.has("cat")) {
    selectedCategories = params.get("cat").split(",");
  }
};

const CATEGORY_DEFS = {
  週課: { badge: "bg-pink-100 text-pink-800" },
  防衛軍: { badge: "bg-green-100 text-green-800" },
  キャンプ: { badge: "bg-teal-100 text-teal-800" },
  パニガルム: { badge: "bg-cyan-100 text-cyan-800" },
  異界: { badge: "bg-orange-100 text-orange-800" },
  常闇: { badge: "bg-purple-100 text-purple-800" },
  聖守護者: { badge: "bg-blue-100 text-blue-800" },
  咎人: { badge: "bg-red-100 text-red-800" },
  輝晶獣: { badge: "bg-yellow-100 text-yellow-800" },
  コインボス: { badge: "bg-amber-100 text-amber-800" },
};
let bossData = null;
let selectedBosses = [];
let searchTerm = "";
let selectedCategories = Object.keys(CATEGORY_DEFS);

window.addEventListener("DOMContentLoaded", () => {
  fetch("./data.json")
    .then((res) => res.json())
    .then((json) => {
      bossData = json;
      render();
    })
    .catch((err) => {
      console.log("data.jsonが見つかりません。デフォルトデータを使用します。");
      render();
    });

  loadStateFromURL();
  renderCategoryFilters();

  document.getElementById("toggleCategories").addEventListener("click", () => {
    const filters = document.getElementById("categoryFilters");
    const toggleText = document.getElementById("toggleText");
    if (filters.classList.contains("hidden")) {
      filters.classList.remove("hidden");
      toggleText.textContent = "折りたたむ";
    } else {
      filters.classList.add("hidden");
      toggleText.textContent = "展開";
    }
  });

  document.querySelectorAll(".category-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      selectedCategories = Array.from(
        document.querySelectorAll(".category-checkbox:checked")
      ).map((cb) => cb.value);
      render();
    });
  });
});

const getImportanceStars = (importance) => {
  const filled = Math.round(importance);
  const empty = 5 - filled;
  return "★".repeat(filled) + "☆".repeat(empty);
};

const getImportanceColor = (importance) => {
  if (importance >= 4.5) return "text-red-600";
  if (importance >= 3.5) return "text-orange-500";
  if (importance >= 2.5) return "text-yellow-600";
  return "text-gray-500";
};

const getCategoryBadgeColor = (category) => {
  return CATEGORY_DEFS[category]?.badge ?? "bg-gray-100 text-gray-800";
};

const setAllCategories = (checked) => {
  const checkboxes = document.querySelectorAll(".category-checkbox");
  checkboxes.forEach((cb) => (cb.checked = checked));
  selectedCategories = checked ? Object.keys(CATEGORY_DEFS) : [];
  render();
};

document.getElementById("checkAll").addEventListener("click", () => {
  setAllCategories(true);
});

document.getElementById("uncheckAll").addEventListener("click", () => {
  setAllCategories(false);
});

const renderCategoryFilters = () => {
  const container = document.getElementById("categoryFilters");
  container.replaceChildren();

  Object.keys(CATEGORY_DEFS).forEach((cat) => {
    const label = el("label", "flex items-center space-x-2 cursor-pointer");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = cat;
    input.checked = selectedCategories.includes(cat);
    input.className = "category-checkbox w-4 h-4 text-indigo-600 rounded";

    input.addEventListener("change", () => {
      selectedCategories = Array.from(
        container.querySelectorAll(":checked")
      ).map((c) => c.value);
      syncStateToURL();
      render();
    });

    label.appendChild(input);
    label.appendChild(el("span", "text-sm", cat));
    container.appendChild(label);
  });
};

const renderBossList = () => {
  const bossList = document.getElementById("bossList");
  bossList.replaceChildren();

  bossData
    .filter(
      (boss) =>
        boss.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        selectedCategories.includes(boss.category)
    )
    .forEach((boss) => {
      const isSelected = selectedBosses.includes(boss.id);

      const label = el(
        "label",
        `flex items-center p-3 rounded-lg cursor-pointer transition
                ${
                  isSelected
                    ? "bg-indigo-100 border-2 border-indigo-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`
      );

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = isSelected;
      checkbox.className = "w-4 h-4 text-indigo-600 rounded";

      checkbox.addEventListener("change", () => toggleBoss(boss.id));

      const body = el("div", "ml-3 flex-1");
      body.appendChild(el("div", "font-medium text-gray-800", boss.name));

      const badge = el(
        "span",
        `inline-block mt-1 px-2 py-0.5 text-xs rounded ${getCategoryBadgeColor(
          boss.category
        )}`,
        boss.category
      );
      body.appendChild(badge);

      label.appendChild(checkbox);
      label.appendChild(body);
      label.appendChild(
        el(
          "span",
          "ml-2 text-sm text-gray-500",
          `${boss.resistances.length}種類`
        )
      );

      bossList.appendChild(label);
    });

  document
    .getElementById("clearButton")
    .classList.toggle("hidden", selectedBosses.length === 0);
};

const renderResistances = () => {
  const resultDiv = document.getElementById("resistanceResult");
  const selectedCount = document.getElementById("selectedCount");

  if (selectedBosses.length === 0) {
    selectedCount.textContent = "";
    const empty = document
      .getElementById("emptyTemplate")
      .content.cloneNode(true);
    resultDiv.appendChild(empty);
    return;
  }

  selectedCount.textContent = "(" + selectedBosses.length + "体のボスを選択中)";

  const resistanceMap = new Map();

  selectedBosses.forEach((id) => {
    const boss = bossData.find((b) => b.id === id);
    boss.resistances.forEach((res) => {
      const cur = resistanceMap.get(res.type) ?? {
        type: res.type,
        maxImportance: 0,
        total: 0,
        count: 0,
        bosses: [],
      };

      cur.maxImportance = Math.max(cur.maxImportance, res.importance);
      cur.total += res.importance;
      cur.count++;
      cur.bosses.push(boss.name);

      resistanceMap.set(res.type, cur);
    });
  });

  [...resistanceMap.values()]
    .sort((a, b) => b.maxImportance - a.maxImportance || b.count - a.count)
    .forEach((res) => {
      const node = document
        .getElementById("resistanceTemplate")
        .content.cloneNode(true);

      node.querySelector(".res-type").textContent = `${res.type}耐性`;

      const stars = node.querySelector(".res-stars");
      stars.textContent = getImportanceStars(res.maxImportance);
      stars.className += " " + getImportanceColor(res.maxImportance);

      const max = node.querySelector(".res-max");
      max.textContent = `${res.maxImportance}/5`;
      max.className += " " + getImportanceColor(res.maxImportance);

      node.querySelector(
        ".res-count"
      ).textContent = `必要なボス (${res.count}体):`;

      const bosses = node.querySelector(".res-bosses");
      res.bosses.forEach((name) => {
        const span = document.createElement("span");
        span.className =
          "inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium";
        span.textContent = name;
        bosses.appendChild(span);
      });

      if (res.count > 1) {
        const avg = node.querySelector(".res-avg");
        avg.textContent = `平均重要度: ${(res.total / res.count).toFixed(1)}/5`;
        avg.classList.remove("hidden");
      }

      resultDiv.appendChild(node);
    });
};

const toggleBoss = (bossId) => {
  selectedBosses.includes(bossId)
    ? (selectedBosses = selectedBosses.filter((id) => id !== bossId))
    : selectedBosses.push(bossId);

  syncStateToURL();
  render();
};

const clearSelection = () => {
  selectedBosses = [];
  syncStateToURL();
  render();
};

const render = () => {
  document.getElementById("resistanceResult").replaceChildren();
  renderBossList();
  renderResistances();
};

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  syncStateToURL();
  renderBossList();
});

document
  .getElementById("clearButton")
  .addEventListener("click", clearSelection);

import { meals } from "./recipes.js";

const categories = [
  "All",
  "Dinner",
  "Breakfast",
  "Quick lunch",
  "Pasta & grains",
  "Soup & comfort",
  "Wraps & burgers",
  "Seafood",
];

const search = document.getElementById("search");
const filters = document.getElementById("filters");
const count = document.getElementById("count");
const grid = document.getElementById("grid");
const printButton = document.getElementById("print");
let category = "All";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => entities[character]);

function mealCard(meal) {
  return `
    <article class="card">
      <div class="top">
        <span class="category">${escapeHtml(meal.category)}</span>
        <span class="time">~${meal.minutes} min</span>
      </div>
      <h2>${escapeHtml(meal.title)}</h2>
      ${meal.description ? `<p>${escapeHtml(meal.description)}</p>` : ""}
      <div class="label">Ingredients</div>
      <div class="ingredients">${escapeHtml(meal.ingredients)}</div>
      <div class="method"><strong>Method</strong> ${escapeHtml(meal.method)}</div>
    </article>`;
}

function render() {
  const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = meals.filter((meal) => {
    const matchesCategory = category === "All" || (category === "Dinner" ? meal.dinner : meal.category === category);
    const searchable = [meal.title, meal.description, meal.ingredients].join(" ").toLowerCase();
    return matchesCategory && terms.every((term) => searchable.includes(term));
  });

  count.textContent = `${shown.length} meal${shown.length === 1 ? "" : "s"}`;
  grid.innerHTML = shown.length
    ? shown.map(mealCard).join("")
    : '<div class="empty">No meals match that search. Try another ingredient or choose All.</div>';
}

const filterButtons = categories.map((name) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = name;
  button.setAttribute("aria-pressed", String(category === name));
  button.addEventListener("click", () => {
    category = name;
    for (const filter of filterButtons) {
      filter.setAttribute("aria-pressed", String(filter === button));
    }
    render();
  });
  return button;
});
filters.append(...filterButtons);
search.addEventListener("input", render);
printButton.addEventListener("click", () => window.print());
render();

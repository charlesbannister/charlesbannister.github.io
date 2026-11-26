import { items } from "./a-la-carte.js";
import { getUnavailableIds, pantryGroups, recipeIngredients, saveUnavailableIds } from "./pantry.js";
import { popularMeals } from "./popular-meals.js";
import { meals } from "./recipes.js";

const sections = [
  {
    id: "meals",
    entries: [...meals, ...popularMeals],
    filters: ["All", "Dinner", "Breakfast", "Quick lunch", "Pasta & grains", "Soup & comfort", "Wraps & burgers", "Seafood"],
    noun: "meal",
    placeholder: "Try salmon rice",
    selected: "All",
  },
  {
    id: "a-la-carte",
    entries: items,
    filters: ["All", "Sides", "Standalone mains", "Starters", "Snacks"],
    noun: "dish",
    placeholder: "Try broccoli or rice",
    selected: "All",
  },
  { id: "pantry" },
];

const recipeToolbar = document.getElementById("recipe-toolbar");
const recipeNotes = document.getElementById("recipe-notes");
const search = document.getElementById("search");
const count = document.getElementById("count");
const inStockOnly = document.getElementById("in-stock-only");
const pantryList = document.querySelector(".pantry-groups");
const printButton = document.getElementById("print");
const randomButton = document.getElementById("random");
const randomDialog = document.getElementById("random-dialog");
const closeRandom = document.getElementById("close-random");
const randomAgain = document.getElementById("random-again");
const randomShuffle = document.getElementById("random-shuffle");
const randomResult = document.getElementById("random-result");
const randomStatus = document.getElementById("random-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const unavailableIds = getUnavailableIds();
const formatCount = new Intl.NumberFormat("en-US");
let activeIndex = 0;
let shownRecipes = [];
let pickedRecipe = null;
let shuffleTimer = null;

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => entities[character]);

function sourceLink(source) {
  if (!source?.url?.startsWith("https://")) return "";
  const rating = Number.isFinite(source.rating) && Number.isInteger(source.ratingCount)
    ? `<span class="source-rating">${source.rating}/5 from ${formatCount.format(source.ratingCount)} ratings</span>`
    : "";
  return `<div class="recipe-reference">
    <a class="recipe-source" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">Original recipe on ${escapeHtml(source.name)}</a>
    ${rating}
  </div>`;
}

function ingredientLine(ingredients) {
  return ingredients.map(({ text, missing }) => missing
    ? `<span class="ingredient-missing">${escapeHtml(text)} <strong>Missing</strong></span>`
    : escapeHtml(text)).join(" · ");
}

function recipeCard(entry) {
  const { recipe, ingredients } = entry;
  const index = shownRecipes.indexOf(entry);
  return `
    <article class="card">
      <div class="top">
        <span class="category">${escapeHtml(recipe.category)}</span>
        ${Number.isFinite(recipe.minutes) ? `<span class="time">~${recipe.minutes} min</span>` : ""}
      </div>
      <h2>${escapeHtml(recipe.title)}</h2>
      ${recipe.description ? `<p>${escapeHtml(recipe.description)}</p>` : ""}
      ${ingredients.length ? `<div class="label">Ingredients</div>
      <div class="ingredients">${ingredientLine(ingredients)}</div>` : ""}
      ${recipe.method ? `<div class="method"><strong>Method</strong> ${escapeHtml(recipe.method)}</div>` : ""}
      ${sourceLink(recipe.source)}
      ${index >= 0 ? `<button class="open-cook" type="button" data-index="${index}"><span class="expand-icon" aria-hidden="true"></span>Full screen</button>` : ""}
    </article>`;
}

function render() {
  const section = sections[activeIndex];
  if (!section.entries) return;
  const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = section.entries.filter((recipe) => {
    const matchesFilter = section.selected === "All" || (
      section.selected === "Dinner" ? recipe.dinner : recipe.category === section.selected
    );
    const searchable = [recipe.title, recipe.description, recipe.ingredients].join(" ").toLowerCase();
    return matchesFilter && terms.every((term) => searchable.includes(term));
  });
  shownRecipes = matches.map((recipe) => ({ recipe, ingredients: recipeIngredients(recipe, unavailableIds) }));
  if (inStockOnly.checked) {
    shownRecipes = shownRecipes.filter(({ ingredients }) => !ingredients.some(({ missing, optional }) => missing && !optional));
  }

  const plural = section.noun === "dish" ? "dishes" : "meals";
  count.textContent = `${shownRecipes.length} ${shownRecipes.length === 1 ? section.noun : plural}`;
  randomButton.disabled = shownRecipes.length === 0;
  const emptyMessage = inStockOnly.checked && matches.length
    ? `No matching ${plural} are fully in stock. Turn off In stock only to see what you’re missing.`
    : `No ${plural} match that search. Try another ingredient or choose All.`;
  section.grid.innerHTML = shownRecipes.length
    ? shownRecipes.map(recipeCard).join("")
    : `<div class="empty">${emptyMessage}</div>`;
}

function randomChoice(recipes) {
  return recipes[Math.floor(Math.random() * recipes.length)];
}

function showRandomRecipe(entry) {
  pickedRecipe = entry;
  randomShuffle.hidden = true;
  randomResult.innerHTML = recipeCard(entry);
  randomStatus.textContent = entry.recipe.title;
  randomAgain.removeAttribute("aria-disabled");
}

function pickRandomRecipe() {
  const alternatives = shownRecipes.filter((recipe) => recipe !== pickedRecipe);
  const next = randomChoice(alternatives.length ? alternatives : shownRecipes);

  if (shownRecipes.length === 1 || reducedMotion.matches) {
    showRandomRecipe(next);
    return;
  }

  let frame = pickedRecipe;
  let framesLeft = 5;
  const showFrame = () => {
    frame = randomChoice(shownRecipes.filter((recipe) => recipe !== frame));
    randomShuffle.textContent = frame.recipe.title;
  };

  randomStatus.textContent = "Picking a recipe";
  randomAgain.setAttribute("aria-disabled", "true");
  randomResult.replaceChildren();
  showFrame();
  randomShuffle.hidden = false;
  shuffleTimer = window.setInterval(() => {
    if (--framesLeft > 0) {
      showFrame();
      return;
    }
    window.clearInterval(shuffleTimer);
    shuffleTimer = null;
    showRandomRecipe(next);
  }, 140);
}

function activateSection(index, focusTab = false) {
  if (index !== activeIndex) {
    sections[activeIndex].grid?.replaceChildren();
    activeIndex = index;
  }
  for (const [sectionIndex, section] of sections.entries()) {
    const active = sectionIndex === activeIndex;
    section.tab.setAttribute("aria-selected", String(active));
    section.tab.tabIndex = active ? 0 : -1;
    section.panel.hidden = !active;
  }
  const section = sections[activeIndex];
  recipeToolbar.hidden = !section.entries;
  recipeNotes.hidden = !section.entries;
  if (section.entries) search.placeholder = section.placeholder;
  if (focusTab) section.tab.focus();
  render();
}

for (const [index, section] of sections.entries()) {
  section.tab = document.getElementById(`${section.id}-tab`);
  section.panel = document.getElementById(`${section.id}-panel`);
  section.tab.addEventListener("click", () => activateSection(index));
  section.tab.addEventListener("keydown", (event) => {
    let nextIndex;
    switch (event.key) {
      case "ArrowLeft": nextIndex = (index - 1 + sections.length) % sections.length; break;
      case "ArrowRight": nextIndex = (index + 1) % sections.length; break;
      case "Home": nextIndex = 0; break;
      case "End": nextIndex = sections.length - 1; break;
      default: return;
    }
    event.preventDefault();
    activateSection(nextIndex, true);
  });

  if (!section.entries) continue;
  section.grid = section.panel.querySelector(".grid");
  const filterGroup = section.panel.querySelector(".filters");
  for (const name of section.filters) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = name;
    button.setAttribute("aria-pressed", String(section.selected === name));
    button.addEventListener("click", () => {
      filterGroup.querySelector('[aria-pressed="true"]').setAttribute("aria-pressed", "false");
      button.setAttribute("aria-pressed", "true");
      section.selected = name;
      render();
    });
    filterGroup.append(button);
  }
}

pantryList.innerHTML = pantryGroups.map(({ label, items }) => `
  <fieldset class="pantry-group">
    <legend class="pantry-group-name">${escapeHtml(label)}</legend>
    <div class="pantry-items">
      ${items.map(({ id, label: name }) => `<label class="pantry-item">
        <input type="checkbox" value="${escapeHtml(id)}"${unavailableIds.has(id) ? "" : " checked"}>
        <span class="pantry-item-name">${escapeHtml(name)}</span>
      </label>`).join("")}
    </div>
  </fieldset>`).join("");
pantryList.addEventListener("change", ({ target }) => {
  if (!target.matches('input[type="checkbox"]')) return;
  if (target.checked) unavailableIds.delete(target.value);
  else unavailableIds.add(target.value);
  saveUnavailableIds(unavailableIds);
});

function resetRandomRecipe() {
  window.clearInterval(shuffleTimer);
  shuffleTimer = null;
  pickedRecipe = null;
  randomResult.replaceChildren();
  randomShuffle.hidden = true;
  randomStatus.textContent = "";
}

randomButton.addEventListener("click", () => {
  if (!shownRecipes.length || randomDialog.open) return;
  resetRandomRecipe();
  randomAgain.disabled = shownRecipes.length < 2;
  randomDialog.showModal();
  pickRandomRecipe();
});
randomAgain.addEventListener("click", () => {
  if (shuffleTimer === null) pickRandomRecipe();
});
closeRandom.addEventListener("click", () => randomDialog.close());
randomDialog.addEventListener("close", () => {
  if (randomDialog.open) return;
  resetRandomRecipe();
  if (!randomButton.disabled) randomButton.focus({ preventScroll: true });
});

search.addEventListener("input", render);
inStockOnly.addEventListener("change", render);
printButton.addEventListener("click", () => window.print());
render();

// ---------- Full-screen cooking view ----------
const cookDialog = document.getElementById("cook-dialog");
const cookBody = document.getElementById("cook-body");
const closeCook = document.getElementById("close-cook");

function methodSteps(method) {
  return method.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((step) => step.trim()).filter(Boolean);
}

function cookView({ recipe, ingredients }) {
  const steps = recipe.method ? methodSteps(recipe.method) : [];
  const missing = ingredients.filter((item) => item.missing).length;
  const facts = [
    recipe.category && `<span>${escapeHtml(recipe.category)}</span>`,
    Number.isFinite(recipe.minutes) && `<span>~${recipe.minutes} min</span>`,
    ingredients.length && `<span>${ingredients.length} ingredients</span>`,
    steps.length && `<span>${steps.length} steps</span>`,
    missing && `<span class="cook-missing">${missing} missing</span>`,
  ].filter(Boolean).join("");
  return `
    <div class="cook-head">
      <h2 id="cook-title">${escapeHtml(recipe.title)}</h2>
      <div class="cook-facts">${facts}</div>
      ${recipe.description ? `<p class="cook-description">${escapeHtml(recipe.description)}</p>` : ""}
    </div>
    ${ingredients.length ? `<section class="cook-ingredients" aria-label="Ingredients">
      <h3>Ingredients <small>tap to tick off</small></h3>
      <ul>${ingredients.map((item) => `<li><label>
        <input type="checkbox"><span>${escapeHtml(item.text)}${item.missing ? ' <strong class="cook-missing">Missing</strong>' : ""}</span>
      </label></li>`).join("")}</ul>
    </section>` : ""}
    ${steps.length ? `<section class="cook-method" aria-label="Method">
      <h3>Method <small>tap a step when done</small></h3>
      <ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    </section>` : ""}
    ${recipe.source ? `<div class="cook-source">${sourceLink(recipe.source)}</div>` : ""}`;
}

function openCook(entry) {
  if (randomDialog.open) randomDialog.close();
  cookBody.innerHTML = cookView(entry);
  cookDialog.showModal();
  cookBody.scrollTop = 0;
  closeCook.focus();
  document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".open-cook");
  if (button) {
    const entry = shownRecipes[Number(button.dataset.index)];
    if (entry) openCook(entry);
    return;
  }
  const step = event.target.closest(".cook-method li");
  if (step) step.classList.toggle("done");
});
cookBody.addEventListener("change", ({ target }) => {
  target.closest("li")?.classList.toggle("done", target.checked);
});
closeCook.addEventListener("click", () => cookDialog.close());
cookDialog.addEventListener("close", () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
});

// ---------- Keep screen awake ----------
const wakeButtons = document.querySelectorAll(".wake-button");
let wakeLock = null;
let wantAwake = false;

function showWakeState() {
  for (const button of wakeButtons) {
    button.setAttribute("aria-pressed", String(wantAwake));
    button.querySelector(".wake-text").textContent = wantAwake ? "Screen stays on" : "Keep screen on";
  }
}

async function requestWake() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch {
    wantAwake = false;
    showWakeState();
  }
}

if ("wakeLock" in navigator) {
  for (const button of wakeButtons) {
    button.hidden = false;
    button.addEventListener("click", async () => {
      wantAwake = !wantAwake;
      showWakeState();
      if (wantAwake) await requestWake();
      else await wakeLock?.release();
    });
  }
  document.addEventListener("visibilitychange", () => {
    if (wantAwake && !wakeLock && document.visibilityState === "visible") requestWake();
  });
}

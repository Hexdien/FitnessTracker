import { apiRequest } from "./api.js";
import { escapeHtml, formatNumber } from "./helpers.js";
import { showStatus, hideStatus } from "./status.js";

const state = {
  foods: [],
  search: "",
};

const elements = {
  form: document.getElementById("food-form"),
  id: document.getElementById("food-id"),
  name: document.getElementById("food-name"),
  baseQuantity: document.getElementById("food-base-quantity"),
  calories: document.getElementById("food-calories"),
  carbs: document.getElementById("food-carbs"),
  protein: document.getElementById("food-protein"),
  lipids: document.getElementById("food-lipids"),
  submit: document.getElementById("food-submit"),
  cancel: document.getElementById("food-cancel"),
  reset: document.getElementById("food-form-reset"),
  tableBody: document.getElementById("food-table-body"),
  count: document.getElementById("food-count"),
  search: document.getElementById("food-search"),
};

function resetForm() {
  elements.form.reset();
  elements.id.value = "";
  elements.baseQuantity.value = "100";
  elements.submit.textContent = "Salvar alimento";
  elements.cancel.classList.add("hidden");
}

function filteredFoods() {
  if (!state.search) return state.foods;
  const q = state.search.trim().toLocaleLowerCase("pt-BR");
  return state.foods.filter((f) => f.name.toLocaleLowerCase("pt-BR").includes(q));
}

function renderTable() {
  const items = filteredFoods();
  elements.count.textContent = `${state.foods.length} alimento(s)${
    state.search ? ` · ${items.length} filtrado(s)` : ""
  }`;

  if (!items.length) {
    const msg = state.foods.length
      ? "Nenhum alimento corresponde à busca."
      : "Nenhum alimento cadastrado.";
    elements.tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${msg}</td></tr>`;
    return;
  }

  elements.tableBody.innerHTML = items
    .map(
      (food) => `
        <tr>
          <td>${escapeHtml(food.name)}</td>
          <td>${formatNumber(food.base_quantity)}</td>
          <td>${formatNumber(food.calories)}</td>
          <td>${formatNumber(food.carbs)}</td>
          <td>${formatNumber(food.protein)}</td>
          <td>${formatNumber(food.lipids)}</td>
          <td class="col-actions">
            <div class="row-actions">
              <button class="icon-button" type="button" data-action="edit" data-id="${food.id}" title="Editar" aria-label="Editar">✎</button>
              <button class="icon-button danger" type="button" data-action="delete" data-id="${food.id}" title="Excluir" aria-label="Excluir">✕</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function populateForm(foodId) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food) return;

  elements.id.value = String(food.id);
  elements.name.value = food.name;
  elements.baseQuantity.value = food.base_quantity;
  elements.calories.value = food.calories;
  elements.carbs.value = food.carbs;
  elements.protein.value = food.protein;
  elements.lipids.value = food.lipids;
  elements.submit.textContent = "Atualizar alimento";
  elements.cancel.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadFoods() {
  state.foods = await apiRequest("/food");
  renderTable();
}

async function handleSubmit(event) {
  event.preventDefault();
  hideStatus();

  const payload = {
    name: elements.name.value.trim(),
    base_quantity: Number(elements.baseQuantity.value),
    calories: Number(elements.calories.value),
    carbs: Number(elements.carbs.value),
    protein: Number(elements.protein.value),
    lipids: Number(elements.lipids.value),
  };

  const foodId = elements.id.value;

  try {
    await apiRequest(foodId ? `/food/${foodId}` : "/food", {
      method: foodId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetForm();
    await loadFoods();
    showStatus(foodId ? "Alimento atualizado." : "Alimento cadastrado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const numericId = Number(button.dataset.id);

  try {
    if (button.dataset.action === "edit") {
      populateForm(numericId);
      return;
    }

    if (button.dataset.action === "delete") {
      if (!window.confirm("Excluir este alimento?")) return;
      await apiRequest(`/food/${numericId}`, { method: "DELETE", headers: {} });
      await loadFoods();
      showStatus("Alimento excluído.");
    }
  } catch (error) {
    showStatus(error.message, "error");
  }
}

function handleSearch(event) {
  state.search = event.target.value;
  renderTable();
}

async function bootstrap() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.reset.addEventListener("click", resetForm);
  elements.cancel.addEventListener("click", resetForm);
  elements.tableBody.addEventListener("click", handleTableClick);
  elements.search.addEventListener("input", handleSearch);

  try {
    await loadFoods();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

bootstrap();

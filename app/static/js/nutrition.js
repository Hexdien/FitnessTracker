import { apiRequest } from "./api.js";
import {
  addDays,
  escapeHtml,
  formatDate,
  formatNumber,
  formatTime,
  getLocalDateString,
} from "./helpers.js";
import { showStatus, hideStatus } from "./status.js";

const state = {
  foods: [],
  foodLogs: [],
  foodHistory: [],
};

const elements = {
  logForm: document.getElementById("food-log-form"),
  logId: document.getElementById("food-log-id"),
  logFoodId: document.getElementById("food-log-food-id"),
  logFoodName: document.getElementById("food-log-food-name"),
  foodOptions: document.getElementById("food-options"),
  logQuantity: document.getElementById("food-log-quantity"),
  logSubmit: document.getElementById("food-log-submit"),
  logCancel: document.getElementById("food-log-cancel"),
  logTableBody: document.getElementById("food-log-table-body"),
  logDateFilter: document.getElementById("log-date-filter"),
  historyForm: document.getElementById("food-history-form"),
  historyStartDate: document.getElementById("history-start-date"),
  historyEndDate: document.getElementById("history-end-date"),
  historyList: document.getElementById("food-history-list"),
  summaryCalories: document.getElementById("summary-calories"),
  summaryCarbs: document.getElementById("summary-carbs"),
  summaryProtein: document.getElementById("summary-protein"),
  summaryLipids: document.getElementById("summary-lipids"),
};

function resetLogForm() {
  elements.logForm.reset();
  elements.logId.value = "";
  elements.logFoodId.value = "";
  elements.logSubmit.textContent = "Salvar registro";
  elements.logCancel.classList.add("hidden");
  syncFoodSelection();
}

function findFoodByTypedName(value) {
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  return state.foods.find(
    (food) => food.name.trim().toLocaleLowerCase("pt-BR") === normalized
  );
}

function syncFoodSelection() {
  const selected = findFoodByTypedName(elements.logFoodName.value);
  elements.logFoodId.value = selected ? String(selected.id) : "";
  elements.logSubmit.disabled = !selected || !state.foods.length;
}

function renderFoodOptions() {
  if (!state.foods.length) {
    elements.foodOptions.innerHTML = "";
    elements.logFoodName.placeholder = "Cadastre um alimento no Catálogo primeiro";
    elements.logFoodName.disabled = true;
    elements.logSubmit.disabled = true;
    return;
  }

  elements.logFoodName.disabled = false;
  elements.logFoodName.placeholder = "Digite para buscar";
  elements.foodOptions.innerHTML = state.foods
    .map((food) => `<option value="${escapeHtml(food.name)}"></option>`)
    .join("");

  syncFoodSelection();
}

function updateSummary() {
  const totals = state.foodLogs.reduce(
    (acc, log) => {
      acc.calories += Number(log.calories);
      acc.carbs += Number(log.carbs);
      acc.protein += Number(log.protein);
      acc.lipids += Number(log.lipids);
      return acc;
    },
    { calories: 0, carbs: 0, protein: 0, lipids: 0 }
  );

  elements.summaryCalories.textContent = formatNumber(totals.calories);
  elements.summaryCarbs.textContent = `${formatNumber(totals.carbs)}g`;
  elements.summaryProtein.textContent = `${formatNumber(totals.protein)}g`;
  elements.summaryLipids.textContent = `${formatNumber(totals.lipids)}g`;
}

function renderFoodLogs() {
  if (!state.foodLogs.length) {
    elements.logTableBody.innerHTML =
      '<tr><td colspan="8" class="empty-state">Nenhum registro encontrado para essa data.</td></tr>';
    updateSummary();
    return;
  }

  elements.logTableBody.innerHTML = state.foodLogs
    .map(
      (log) => `
        <tr>
          <td class="mono">${formatTime(log.created_at)}</td>
          <td>${escapeHtml(log.food_name || "Sem nome")}</td>
          <td>${formatNumber(log.calories)}</td>
          <td>${formatNumber(log.carbs)}</td>
          <td>${formatNumber(log.protein)}</td>
          <td>${formatNumber(log.lipids)}</td>
          <td>${formatNumber(log.quantity)} g</td>
          <td class="col-actions">
            <div class="row-actions">
              <button class="icon-button" type="button" data-action="edit" data-id="${log.id}" title="Editar" aria-label="Editar">✎</button>
              <button class="icon-button danger" type="button" data-action="delete" data-id="${log.id}" title="Excluir" aria-label="Excluir">✕</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  updateSummary();
}

function renderFoodHistory() {
  if (!state.foodHistory.length) {
    elements.historyList.innerHTML =
      '<div class="empty-state">Nenhum registro alimentar encontrado nesse período.</div>';
    return;
  }

  elements.historyList.innerHTML = state.foodHistory
    .map(
      (day) => `
        <details class="history-day">
          <summary>
            <span class="history-date">${formatDate(day.date)}</span>
            <span class="history-metric">
              <span>Kcal</span>
              <strong>${formatNumber(day.totals.calories)}</strong>
            </span>
            <span class="history-metric">
              <span>Carbs</span>
              <strong>${formatNumber(day.totals.carbs)}g</strong>
            </span>
            <span class="history-metric">
              <span>Proteína</span>
              <strong>${formatNumber(day.totals.protein)}g</strong>
            </span>
            <span class="history-metric">
              <span>Lipídios</span>
              <strong>${formatNumber(day.totals.lipids)}g</strong>
            </span>
          </summary>
          <div class="history-log-list">
            ${day.logs
              .map(
                (log) => `
                  <div class="history-log-row">
                    <span class="mono">${formatTime(log.created_at)}</span>
                    <strong>${escapeHtml(log.food_name || "Sem nome")}</strong>
                    <span>${formatNumber(log.quantity)} g</span>
                    <span>${formatNumber(log.calories)} kcal</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </details>
      `
    )
    .join("");
}

function populateLogForm(logId) {
  const log = state.foodLogs.find((item) => item.id === logId);
  if (!log) return;

  elements.logId.value = String(log.id);
  elements.logFoodId.value = String(log.food_id);
  elements.logFoodName.value = log.food_name || "";
  elements.logQuantity.value = log.quantity;
  elements.logSubmit.textContent = "Atualizar registro";
  elements.logCancel.classList.remove("hidden");
  syncFoodSelection();
}

async function loadFoods() {
  state.foods = await apiRequest("/food");
  renderFoodOptions();
}

async function loadFoodLogs() {
  state.foodLogs = await apiRequest(
    `/food-log?date=${encodeURIComponent(elements.logDateFilter.value)}`
  );
  renderFoodLogs();
}

async function loadFoodHistory() {
  const params = new URLSearchParams({
    start_date: elements.historyStartDate.value,
    end_date: elements.historyEndDate.value,
  });
  state.foodHistory = await apiRequest(`/food-log/history?${params.toString()}`);
  renderFoodHistory();
}

async function handleLogSubmit(event) {
  event.preventDefault();
  hideStatus();
  syncFoodSelection();

  if (!elements.logFoodId.value) {
    showStatus("Selecione um alimento existente no catálogo.", "error");
    return;
  }

  const payload = {
    food_id: Number(elements.logFoodId.value),
    quantity: Number(elements.logQuantity.value),
  };

  const logId = elements.logId.value;

  try {
    await apiRequest(logId ? `/food-log/${logId}` : "/food-log", {
      method: logId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetLogForm();
    await loadFoodLogs();
    await loadFoodHistory();
    showStatus(logId ? "Registro atualizado." : "Registro lançado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleLogTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const numericId = Number(button.dataset.id);

  try {
    if (button.dataset.action === "edit") {
      populateLogForm(numericId);
      return;
    }

    if (button.dataset.action === "delete") {
      if (!window.confirm("Excluir este registro?")) return;
      await apiRequest(`/food-log/${numericId}`, { method: "DELETE", headers: {} });
      await loadFoodLogs();
      await loadFoodHistory();
      showStatus("Registro excluído.");
    }
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleDateChange() {
  hideStatus();
  try {
    resetLogForm();
    await loadFoodLogs();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleHistorySubmit(event) {
  event.preventDefault();
  hideStatus();
  try {
    await loadFoodHistory();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function bootstrap() {
  const today = getLocalDateString();
  elements.logDateFilter.value = today;
  elements.historyStartDate.value = addDays(today, -6);
  elements.historyEndDate.value = today;

  elements.logForm.addEventListener("submit", handleLogSubmit);
  elements.historyForm.addEventListener("submit", handleHistorySubmit);
  elements.logCancel.addEventListener("click", resetLogForm);
  elements.logFoodName.addEventListener("input", syncFoodSelection);
  elements.logFoodName.addEventListener("change", syncFoodSelection);
  elements.logDateFilter.addEventListener("change", handleDateChange);
  elements.logTableBody.addEventListener("click", handleLogTableClick);

  try {
    await loadFoods();
    await loadFoodLogs();
    await loadFoodHistory();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

bootstrap();

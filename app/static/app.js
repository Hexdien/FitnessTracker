const state = {
  foods: [],
  foodLogs: [],
};

const elements = {
  statusBanner: document.getElementById("status-banner"),
  foodForm: document.getElementById("food-form"),
  foodId: document.getElementById("food-id"),
  foodName: document.getElementById("food-name"),
  foodCalories: document.getElementById("food-calories"),
  foodCarbs: document.getElementById("food-carbs"),
  foodProtein: document.getElementById("food-protein"),
  foodLipids: document.getElementById("food-lipids"),
  foodSubmit: document.getElementById("food-submit"),
  foodCancel: document.getElementById("food-cancel"),
  foodReset: document.getElementById("food-form-reset"),
  foodTableBody: document.getElementById("food-table-body"),
  foodLogForm: document.getElementById("food-log-form"),
  foodLogId: document.getElementById("food-log-id"),
  foodLogFoodId: document.getElementById("food-log-food-id"),
  foodLogQuantity: document.getElementById("food-log-quantity"),
  foodLogSubmit: document.getElementById("food-log-submit"),
  foodLogCancel: document.getElementById("food-log-cancel"),
  foodLogTableBody: document.getElementById("food-log-table-body"),
  logDateFilter: document.getElementById("log-date-filter"),
  summaryCalories: document.getElementById("summary-calories"),
  summaryCarbs: document.getElementById("summary-carbs"),
  summaryProtein: document.getElementById("summary-protein"),
  summaryLipids: document.getElementById("summary-lipids"),
};

function formatNumber(value) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showStatus(message, type = "success") {
  elements.statusBanner.textContent = message;
  elements.statusBanner.className = `status-banner ${type}`;
}

function hideStatus() {
  elements.statusBanner.className = "status-banner hidden";
  elements.statusBanner.textContent = "";
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Erro inesperado");
  }

  return data;
}

function resetFoodForm() {
  elements.foodForm.reset();
  elements.foodId.value = "";
  elements.foodSubmit.textContent = "Salvar alimento";
  elements.foodCancel.classList.add("hidden");
}

function resetFoodLogForm() {
  elements.foodLogForm.reset();
  elements.foodLogId.value = "";
  elements.foodLogSubmit.textContent = "Salvar registro";
  elements.foodLogCancel.classList.add("hidden");
}

function renderFoods() {
  if (!state.foods.length) {
    elements.foodTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum alimento cadastrado.</td></tr>';
    elements.foodLogFoodId.innerHTML = '<option value="">Cadastre um alimento primeiro</option>';
    return;
  }

  elements.foodTableBody.innerHTML = state.foods
    .map(
      (food) => `
        <tr>
          <td>${food.name}</td>
          <td>${formatNumber(food.calories)}</td>
          <td>${formatNumber(food.carbs)}</td>
          <td>${formatNumber(food.protein)}</td>
          <td>${formatNumber(food.lipids)}</td>
          <td>
            <div class="row-actions">
              <button class="action-button" type="button" data-action="edit-food" data-id="${food.id}">Editar</button>
              <button class="action-button danger" type="button" data-action="delete-food" data-id="${food.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  const currentValue = elements.foodLogFoodId.value;
  elements.foodLogFoodId.innerHTML = state.foods
    .map((food) => `<option value="${food.id}">${food.name}</option>`)
    .join("");
  if (state.foods.some((food) => String(food.id) === currentValue)) {
    elements.foodLogFoodId.value = currentValue;
  }
}

function renderFoodLogs() {
  if (!state.foodLogs.length) {
    elements.foodLogTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum registro encontrado para essa data.</td></tr>';
    updateSummary();
    return;
  }

  elements.foodLogTableBody.innerHTML = state.foodLogs
    .map(
      (log) => `
        <tr>
          <td class="mono">${formatDateTime(log.created_at)}</td>
          <td>${log.food_name || "Sem nome"}</td>
          <td>${formatNumber(log.quantity)} g</td>
          <td>${formatNumber(log.calories)}</td>
          <td>
            <div class="row-actions">
              <button class="action-button" type="button" data-action="edit-log" data-id="${log.id}">Editar</button>
              <button class="action-button danger" type="button" data-action="delete-log" data-id="${log.id}">Excluir</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  updateSummary();
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

async function loadFoods() {
  state.foods = await apiRequest("/food");
  renderFoods();
}

async function loadFoodLogs() {
  const date = elements.logDateFilter.value;
  state.foodLogs = await apiRequest(`/food-log?date=${encodeURIComponent(date)}`);
  renderFoodLogs();
}

function populateFoodForm(foodId) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food) {
    return;
  }

  elements.foodId.value = String(food.id);
  elements.foodName.value = food.name;
  elements.foodCalories.value = food.calories;
  elements.foodCarbs.value = food.carbs;
  elements.foodProtein.value = food.protein;
  elements.foodLipids.value = food.lipids;
  elements.foodSubmit.textContent = "Atualizar alimento";
  elements.foodCancel.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateFoodLogForm(logId) {
  const log = state.foodLogs.find((item) => item.id === logId);
  if (!log) {
    return;
  }

  elements.foodLogId.value = String(log.id);
  elements.foodLogFoodId.value = String(log.food_id);
  elements.foodLogQuantity.value = log.quantity;
  elements.foodLogSubmit.textContent = "Atualizar registro";
  elements.foodLogCancel.classList.remove("hidden");
}

async function handleFoodSubmit(event) {
  event.preventDefault();
  hideStatus();

  const payload = {
    name: elements.foodName.value.trim(),
    calories: Number(elements.foodCalories.value),
    carbs: Number(elements.foodCarbs.value),
    protein: Number(elements.foodProtein.value),
    lipids: Number(elements.foodLipids.value),
  };

  const foodId = elements.foodId.value;
  const method = foodId ? "PUT" : "POST";
  const url = foodId ? `/food/${foodId}` : "/food";

  try {
    await apiRequest(url, {
      method,
      body: JSON.stringify(payload),
    });
    resetFoodForm();
    await loadFoods();
    showStatus(foodId ? "Alimento atualizado." : "Alimento cadastrado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleFoodLogSubmit(event) {
  event.preventDefault();
  hideStatus();

  const payload = {
    food_id: Number(elements.foodLogFoodId.value),
    quantity: Number(elements.foodLogQuantity.value),
  };

  const logId = elements.foodLogId.value;
  const method = logId ? "PUT" : "POST";
  const url = logId ? `/food-log/${logId}` : "/food-log";

  try {
    await apiRequest(url, {
      method,
      body: JSON.stringify(payload),
    });
    resetFoodLogForm();
    await loadFoodLogs();
    showStatus(logId ? "Registro atualizado." : "Registro lançado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  const numericId = Number(id);

  try {
    if (action === "edit-food") {
      populateFoodForm(numericId);
      return;
    }

    if (action === "delete-food") {
      if (!window.confirm("Excluir este alimento?")) {
        return;
      }
      await apiRequest(`/food/${numericId}`, { method: "DELETE", headers: {} });
      await loadFoods();
      showStatus("Alimento excluído.");
      return;
    }

    if (action === "edit-log") {
      populateFoodLogForm(numericId);
      return;
    }

    if (action === "delete-log") {
      if (!window.confirm("Excluir este registro?")) {
        return;
      }
      await apiRequest(`/food-log/${numericId}`, { method: "DELETE", headers: {} });
      await loadFoodLogs();
      showStatus("Registro excluído.");
    }
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleDateChange() {
  hideStatus();
  try {
    resetFoodLogForm();
    await loadFoodLogs();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function bootstrap() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const today = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
  elements.logDateFilter.value = today;

  elements.foodForm.addEventListener("submit", handleFoodSubmit);
  elements.foodLogForm.addEventListener("submit", handleFoodLogSubmit);
  elements.foodReset.addEventListener("click", resetFoodForm);
  elements.foodCancel.addEventListener("click", resetFoodForm);
  elements.foodLogCancel.addEventListener("click", resetFoodLogForm);
  elements.logDateFilter.addEventListener("change", handleDateChange);
  elements.foodTableBody.addEventListener("click", handleTableClick);
  elements.foodLogTableBody.addEventListener("click", handleTableClick);

  try {
    await loadFoods();
    await loadFoodLogs();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

bootstrap();

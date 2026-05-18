const state = {
  foods: [],
  foodLogs: [],
  foodHistory: [],
  exercises: [],
  workoutSessions: [],
};

const elements = {
  statusBanner: document.getElementById("status-banner"),
  navButtons: document.querySelectorAll(".nav-button"),
  nutritionView: document.getElementById("view-nutrition"),
  workoutView: document.getElementById("view-workout"),
  foodForm: document.getElementById("food-form"),
  foodId: document.getElementById("food-id"),
  foodName: document.getElementById("food-name"),
  foodBaseQuantity: document.getElementById("food-base-quantity"),
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
  foodLogFoodName: document.getElementById("food-log-food-name"),
  foodOptions: document.getElementById("food-options"),
  foodLogQuantity: document.getElementById("food-log-quantity"),
  foodLogSubmit: document.getElementById("food-log-submit"),
  foodLogCancel: document.getElementById("food-log-cancel"),
  foodLogTableBody: document.getElementById("food-log-table-body"),
  logDateFilter: document.getElementById("log-date-filter"),
  foodHistoryForm: document.getElementById("food-history-form"),
  historyStartDate: document.getElementById("history-start-date"),
  historyEndDate: document.getElementById("history-end-date"),
  foodHistoryList: document.getElementById("food-history-list"),
  summaryCalories: document.getElementById("summary-calories"),
  summaryCarbs: document.getElementById("summary-carbs"),
  summaryProtein: document.getElementById("summary-protein"),
  summaryLipids: document.getElementById("summary-lipids"),
  exerciseForm: document.getElementById("exercise-form"),
  exerciseName: document.getElementById("exercise-name"),
  exerciseMuscleGroups: document.getElementById("exercise-muscle-groups"),
  exerciseTableBody: document.getElementById("exercise-table-body"),
  workoutDateFilter: document.getElementById("workout-date-filter"),
  workoutSessionForm: document.getElementById("workout-session-form"),
  addExecutionButton: document.getElementById("add-execution-button"),
  workoutExecutionList: document.getElementById("workout-execution-list"),
  workoutSessionList: document.getElementById("workout-session-list"),
  executionTemplate: document.getElementById("execution-template"),
  setTemplate: document.getElementById("set-template"),
};

function getLocalDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  elements.foodBaseQuantity.value = "100";
  elements.foodSubmit.textContent = "Salvar alimento";
  elements.foodCancel.classList.add("hidden");
}

function resetFoodLogForm() {
  elements.foodLogForm.reset();
  elements.foodLogId.value = "";
  elements.foodLogFoodId.value = "";
  elements.foodLogSubmit.textContent = "Salvar registro";
  elements.foodLogCancel.classList.add("hidden");
  syncFoodLogSelection();
}

function resetExerciseForm() {
  elements.exerciseForm.reset();
}

function renderFoodOptions() {
  if (!state.foods.length) {
    elements.foodOptions.innerHTML = "";
    elements.foodLogFoodName.placeholder = "Cadastre um alimento primeiro";
    elements.foodLogFoodName.disabled = true;
    elements.foodLogSubmit.disabled = true;
    return;
  }

  elements.foodLogFoodName.disabled = false;
  elements.foodLogFoodName.placeholder = "Digite para buscar";
  elements.foodOptions.innerHTML = state.foods
    .map((food) => `<option value="${escapeHtml(food.name)}"></option>`)
    .join("");

  syncFoodLogSelection();
}

function findFoodByTypedName(value) {
  const normalizedValue = value.trim().toLocaleLowerCase("pt-BR");
  return state.foods.find(
    (food) => food.name.trim().toLocaleLowerCase("pt-BR") === normalizedValue
  );
}

function syncFoodLogSelection() {
  const selectedFood = findFoodByTypedName(elements.foodLogFoodName.value);
  elements.foodLogFoodId.value = selectedFood ? String(selectedFood.id) : "";
  elements.foodLogSubmit.disabled = !selectedFood || !state.foods.length;
}

function renderFoods() {
  if (!state.foods.length) {
    elements.foodTableBody.innerHTML =
      '<tr><td colspan="7" class="empty-state">Nenhum alimento cadastrado.</td></tr>';
    renderFoodOptions();
    return;
  }

  elements.foodTableBody.innerHTML = state.foods
    .map(
      (food) => `
        <tr>
          <td>${escapeHtml(food.name)}</td>
          <td>${formatNumber(food.base_quantity)}</td>
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

  renderFoodOptions();
}

function renderFoodLogs() {
  if (!state.foodLogs.length) {
    elements.foodLogTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">Nenhum registro encontrado para essa data.</td></tr>';
    updateNutritionSummary();
    return;
  }

  elements.foodLogTableBody.innerHTML = state.foodLogs
    .map(
      (log) => `
        <tr>
          <td class="mono">${new Date(log.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}</td>
          <td>${escapeHtml(log.food_name || "Sem nome")}</td>
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

  updateNutritionSummary();
}

function updateNutritionSummary() {
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

function renderFoodHistory() {
  if (!state.foodHistory.length) {
    elements.foodHistoryList.innerHTML =
      '<div class="empty-state">Nenhum registro alimentar encontrado nesse período.</div>';
    return;
  }

  elements.foodHistoryList.innerHTML = state.foodHistory
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
                    <span class="mono">${new Date(log.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</span>
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

function renderExercises() {
  if (!state.exercises.length) {
    elements.exerciseTableBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Nenhum exercício cadastrado.</td></tr>';
    renderWorkoutExecutionSelects();
    return;
  }

  elements.exerciseTableBody.innerHTML = state.exercises
    .map(
      (exercise) => `
        <tr>
          <td>${escapeHtml(exercise.name)}</td>
          <td>${escapeHtml(exercise.muscle_groups.join(", "))}</td>
        </tr>
      `
    )
    .join("");

  renderWorkoutExecutionSelects();
}

function renderWorkoutSessions() {
  if (!state.workoutSessions.length) {
    elements.workoutSessionList.innerHTML =
      '<div class="empty-state">Nenhuma sessão de treino encontrada para essa data.</div>';
    return;
  }

  elements.workoutSessionList.innerHTML = state.workoutSessions
    .map(
      (session) => `
        <article class="workout-session-card">
          <div class="workout-session-head">
            <strong>${formatDateTime(session.created_at)}</strong>
            <span class="mono">${session.exercises.length} exercício(s)</span>
          </div>
          ${session.exercises
            .map(
              (exercise) => `
                <div class="exercise-line">
                  <div>
                    <strong>${escapeHtml(exercise.exercise_name)}</strong>
                    <div class="muscle-badge-list">
                      ${exercise.muscle_groups
                        .map((group) => `<span class="muscle-badge">${escapeHtml(group)}</span>`)
                        .join("")}
                    </div>
                  </div>
                  <div class="set-pill-list">
                    ${exercise.sets
                      .map(
                        (setItem) => `
                          <span class="set-pill">
                            <strong>S${setItem.order}</strong>
                            <span>${setItem.reps} reps</span>
                            <span>${formatNumber(setItem.weight)} kg</span>
                          </span>
                        `
                      )
                      .join("")}
                  </div>
                </div>
              `
            )
            .join("")}
        </article>
      `
    )
    .join("");
}

function populateFoodForm(foodId) {
  const food = state.foods.find((item) => item.id === foodId);
  if (!food) {
    return;
  }

  elements.foodId.value = String(food.id);
  elements.foodName.value = food.name;
  elements.foodBaseQuantity.value = food.base_quantity;
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
  elements.foodLogFoodName.value = log.food_name || "";
  elements.foodLogQuantity.value = log.quantity;
  elements.foodLogSubmit.textContent = "Atualizar registro";
  elements.foodLogCancel.classList.remove("hidden");
  syncFoodLogSelection();
}

function renderWorkoutExecutionSelects() {
  const selects = elements.workoutExecutionList.querySelectorAll(".execution-exercise-select");

  selects.forEach((select) => {
    const currentValue = select.value;
    if (!state.exercises.length) {
      select.innerHTML = '<option value="">Cadastre um exercício primeiro</option>';
      return;
    }

    select.innerHTML = state.exercises
      .map((exercise) => `<option value="${exercise.id}">${escapeHtml(exercise.name)}</option>`)
      .join("");

    if (state.exercises.some((exercise) => String(exercise.id) === currentValue)) {
      select.value = currentValue;
    }
  });
}

function addSetRow(setsList, values = {}) {
  const fragment = elements.setTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".set-row");
  row.querySelector(".set-reps-input").value = values.reps ?? "";
  row.querySelector(".set-weight-input").value = values.weight ?? "0";
  setsList.appendChild(fragment);
}

function addExecutionCard(initialData = null) {
  const fragment = elements.executionTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".execution-card");
  const select = card.querySelector(".execution-exercise-select");
  const setsList = card.querySelector(".sets-list");

  elements.workoutExecutionList.appendChild(fragment);
  renderWorkoutExecutionSelects();

  const appendedCard = elements.workoutExecutionList.lastElementChild;
  const appendedSelect = appendedCard.querySelector(".execution-exercise-select");
  const appendedSetsList = appendedCard.querySelector(".sets-list");

  if (initialData?.exercise_id) {
    appendedSelect.value = String(initialData.exercise_id);
  }

  if (initialData?.sets?.length) {
    initialData.sets.forEach((setItem) => addSetRow(appendedSetsList, setItem));
  } else {
    addSetRow(appendedSetsList);
  }
}

function resetWorkoutSessionForm() {
  elements.workoutSessionForm.reset();
  elements.workoutExecutionList.innerHTML = "";
  if (state.exercises.length) {
    addExecutionCard();
  }
}

function collectWorkoutSessionPayload() {
  const cards = [...elements.workoutExecutionList.querySelectorAll(".execution-card")];
  if (!cards.length) {
    throw new Error("Adicione ao menos um exercício à sessão");
  }

  return {
    created_at: `${elements.workoutDateFilter.value}T12:00:00+00:00`,
    exercises: cards.map((card, executionIndex) => {
      const select = card.querySelector(".execution-exercise-select");
      const setRows = [...card.querySelectorAll(".set-row")];

      if (!select.value) {
        throw new Error(`Selecione o exercício da execução ${executionIndex + 1}`);
      }

      if (!setRows.length) {
        throw new Error(`Adicione ao menos uma série na execução ${executionIndex + 1}`);
      }

      return {
        exercise_id: Number(select.value),
        sets: setRows.map((row, setIndex) => {
          const reps = Number(row.querySelector(".set-reps-input").value);
          const weight = Number(row.querySelector(".set-weight-input").value);

          if (!Number.isFinite(reps) || reps <= 0) {
            throw new Error(`Informe reps válidas na execução ${executionIndex + 1}, série ${setIndex + 1}`);
          }
          if (!Number.isFinite(weight) || weight < 0) {
            throw new Error(`Informe peso válido na execução ${executionIndex + 1}, série ${setIndex + 1}`);
          }

          return { reps, weight };
        }),
      };
    }),
  };
}

async function loadFoods() {
  state.foods = await apiRequest("/food");
  renderFoods();
}

async function loadFoodLogs() {
  state.foodLogs = await apiRequest(`/food-log?date=${encodeURIComponent(elements.logDateFilter.value)}`);
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

async function loadExercises() {
  state.exercises = await apiRequest("/exercise");
  renderExercises();
}

async function loadWorkoutSessions() {
  state.workoutSessions = await apiRequest(
    `/workout-session?date=${encodeURIComponent(elements.workoutDateFilter.value)}`
  );
  renderWorkoutSessions();
}

async function handleFoodSubmit(event) {
  event.preventDefault();
  hideStatus();

  const payload = {
    name: elements.foodName.value.trim(),
    base_quantity: Number(elements.foodBaseQuantity.value),
    calories: Number(elements.foodCalories.value),
    carbs: Number(elements.foodCarbs.value),
    protein: Number(elements.foodProtein.value),
    lipids: Number(elements.foodLipids.value),
  };

  const foodId = elements.foodId.value;

  try {
    await apiRequest(foodId ? `/food/${foodId}` : "/food", {
      method: foodId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetFoodForm();
    await loadFoods();
    await loadFoodHistory();
    showStatus(foodId ? "Alimento atualizado." : "Alimento cadastrado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleFoodLogSubmit(event) {
  event.preventDefault();
  hideStatus();
  syncFoodLogSelection();

  if (!elements.foodLogFoodId.value) {
    showStatus("Selecione um alimento existente no catálogo.", "error");
    return;
  }

  const payload = {
    food_id: Number(elements.foodLogFoodId.value),
    quantity: Number(elements.foodLogQuantity.value),
  };

  const logId = elements.foodLogId.value;

  try {
    await apiRequest(logId ? `/food-log/${logId}` : "/food-log", {
      method: logId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    resetFoodLogForm();
    await loadFoodLogs();
    await loadFoodHistory();
    showStatus(logId ? "Registro atualizado." : "Registro lançado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleExerciseSubmit(event) {
  event.preventDefault();
  hideStatus();

  const payload = {
    name: elements.exerciseName.value.trim(),
    muscle_groups: elements.exerciseMuscleGroups.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };

  try {
    await apiRequest("/exercise", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    resetExerciseForm();
    await loadExercises();
    resetWorkoutSessionForm();
    showStatus("Exercício cadastrado.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleWorkoutSessionSubmit(event) {
  event.preventDefault();
  hideStatus();

  try {
    const payload = collectWorkoutSessionPayload();
    await apiRequest("/workout-session", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    resetWorkoutSessionForm();
    await loadWorkoutSessions();
    showStatus("Sessão de treino registrada.");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleFoodTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const numericId = Number(button.dataset.id);

  try {
    if (button.dataset.action === "edit-food") {
      populateFoodForm(numericId);
      return;
    }

    if (button.dataset.action === "delete-food") {
      if (!window.confirm("Excluir este alimento?")) {
        return;
      }
      await apiRequest(`/food/${numericId}`, { method: "DELETE", headers: {} });
      await loadFoods();
      await loadFoodHistory();
      showStatus("Alimento excluído.");
    }
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleFoodLogTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const numericId = Number(button.dataset.id);

  try {
    if (button.dataset.action === "edit-log") {
      populateFoodLogForm(numericId);
      return;
    }

    if (button.dataset.action === "delete-log") {
      if (!window.confirm("Excluir este registro?")) {
        return;
      }
      await apiRequest(`/food-log/${numericId}`, { method: "DELETE", headers: {} });
      await loadFoodLogs();
      await loadFoodHistory();
      showStatus("Registro excluído.");
    }
  } catch (error) {
    showStatus(error.message, "error");
  }
}

function handleWorkoutBuilderClick(event) {
  if (event.target.closest(".execution-remove-button")) {
    event.target.closest(".execution-card").remove();
    return;
  }

  if (event.target.closest(".add-set-button")) {
    const card = event.target.closest(".execution-card");
    addSetRow(card.querySelector(".sets-list"));
    return;
  }

  if (event.target.closest(".remove-set-button")) {
    const row = event.target.closest(".set-row");
    const setsList = row.parentElement;
    row.remove();
    if (!setsList.children.length) {
      addSetRow(setsList);
    }
  }
}

async function handleNutritionDateChange() {
  hideStatus();
  try {
    resetFoodLogForm();
    await loadFoodLogs();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function handleFoodHistorySubmit(event) {
  event.preventDefault();
  hideStatus();

  try {
    await loadFoodHistory();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

function handleFoodLogFoodNameInput() {
  syncFoodLogSelection();
}

function showView(viewName) {
  const isNutrition = viewName === "nutrition";
  elements.nutritionView.classList.toggle("active", isNutrition);
  elements.workoutView.classList.toggle("active", !isNutrition);

  elements.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === viewName);
  });
}

function handleNavClick(event) {
  const button = event.target.closest("[data-view-target]");
  if (!button) {
    return;
  }

  hideStatus();
  showView(button.dataset.viewTarget);
}

async function handleWorkoutDateChange() {
  hideStatus();
  try {
    await loadWorkoutSessions();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function bootstrap() {
  const today = getLocalDateString();
  elements.logDateFilter.value = today;
  elements.workoutDateFilter.value = today;
  elements.historyStartDate.value = addDays(today, -6);
  elements.historyEndDate.value = today;

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", handleNavClick);
  });
  elements.foodForm.addEventListener("submit", handleFoodSubmit);
  elements.foodLogForm.addEventListener("submit", handleFoodLogSubmit);
  elements.foodHistoryForm.addEventListener("submit", handleFoodHistorySubmit);
  elements.exerciseForm.addEventListener("submit", handleExerciseSubmit);
  elements.workoutSessionForm.addEventListener("submit", handleWorkoutSessionSubmit);

  elements.foodReset.addEventListener("click", resetFoodForm);
  elements.foodCancel.addEventListener("click", resetFoodForm);
  elements.foodLogCancel.addEventListener("click", resetFoodLogForm);
  elements.foodLogFoodName.addEventListener("input", handleFoodLogFoodNameInput);
  elements.foodLogFoodName.addEventListener("change", handleFoodLogFoodNameInput);
  elements.addExecutionButton.addEventListener("click", () => addExecutionCard());

  elements.logDateFilter.addEventListener("change", handleNutritionDateChange);
  elements.workoutDateFilter.addEventListener("change", handleWorkoutDateChange);

  elements.foodTableBody.addEventListener("click", handleFoodTableClick);
  elements.foodLogTableBody.addEventListener("click", handleFoodLogTableClick);
  elements.workoutExecutionList.addEventListener("click", handleWorkoutBuilderClick);

  try {
    await loadFoods();
    await loadFoodLogs();
    await loadFoodHistory();
    await loadExercises();
    resetWorkoutSessionForm();
    await loadWorkoutSessions();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

bootstrap();

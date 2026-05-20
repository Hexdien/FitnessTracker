import { apiRequest } from "./api.js";
import {
  escapeHtml,
  formatDateTime,
  formatNumber,
  getLocalDateString,
} from "./helpers.js";
import { showStatus, hideStatus } from "./status.js";

const state = {
  exercises: [],
  workoutSessions: [],
};

const elements = {
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

function resetExerciseForm() {
  elements.exerciseForm.reset();
}

function renderExercises() {
  if (!state.exercises.length) {
    elements.exerciseTableBody.innerHTML =
      '<tr><td colspan="2" class="empty-state">Nenhum exercício cadastrado.</td></tr>';
    renderExecutionSelects();
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

  renderExecutionSelects();
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

function renderExecutionSelects() {
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
  elements.workoutExecutionList.appendChild(fragment);
  renderExecutionSelects();

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

function handleBuilderClick(event) {
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

async function handleDateChange() {
  hideStatus();
  try {
    await loadWorkoutSessions();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function bootstrap() {
  elements.workoutDateFilter.value = getLocalDateString();

  elements.exerciseForm.addEventListener("submit", handleExerciseSubmit);
  elements.workoutSessionForm.addEventListener("submit", handleWorkoutSessionSubmit);
  elements.addExecutionButton.addEventListener("click", () => addExecutionCard());
  elements.workoutDateFilter.addEventListener("change", handleDateChange);
  elements.workoutExecutionList.addEventListener("click", handleBuilderClick);

  try {
    await loadExercises();
    resetWorkoutSessionForm();
    await loadWorkoutSessions();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

bootstrap();

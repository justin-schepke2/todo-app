// ---------- Find the elements we need on the page ----------
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");
const taskCount = document.getElementById("task-count");
const filterButtons = document.querySelectorAll(".filter-btn");

// ---------- App state ----------
// Each task looks like: { id: 123, text: "Buy milk", completed: false }
let tasks = loadTasks();
let currentFilter = "all";

// ---------- localStorage helpers ----------
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem("tasks"));
    // Only trust the saved data if it is a list; otherwise start fresh.
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  } catch (error) {
    // Storage can be blocked (e.g. private mode); the app still works for this visit.
  }
}

// ---------- Actions ----------
function addTask(text) {
  tasks.push({ id: Date.now(), text: text, completed: false });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

// ---------- Draw the list on the page ----------
function render() {
  list.innerHTML = "";

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  visibleTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task as completed");
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text; // textContent keeps user text safe

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "✕";
    deleteButton.setAttribute("aria-label", "Delete task");
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, span, deleteButton);
    list.appendChild(li);
  });

  emptyMessage.style.display = visibleTasks.length === 0 ? "block" : "none";

  const activeCount = tasks.filter((t) => !t.completed).length;
  taskCount.textContent = activeCount + (activeCount === 1 ? " task left" : " tasks left");
}

// ---------- Event listeners ----------
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading
  const text = input.value.trim();
  if (text === "") return;
  addTask(text);
  input.value = "";
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    render();
  });
});

// Draw the list once when the page first loads
render();

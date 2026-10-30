// ---------- Find the elements we need on the page ----------
const setupMessage = document.getElementById("setup-message");
const authSection = document.getElementById("auth-section");
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const todoSection = document.getElementById("todo-section");
const userEmail = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-btn");
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");
const taskCount = document.getElementById("task-count");
const filterButtons = document.querySelectorAll(".filter-btn");
const message = document.getElementById("message");

// ---------- Connect to Supabase ----------
// The URL and anon key come from config.js (see config.example.js).
const config = window.APP_CONFIG || {};
const db =
  window.supabase && config.supabaseUrl && config.supabaseAnonKey
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

// ---------- App state ----------
// Each task looks like: { id: 123, text: "Buy milk", completed: false }
let tasks = [];
let currentFilter = "all";

// ---------- Messages ----------
function showMessage(text, isError) {
  message.textContent = text;
  message.classList.toggle("notice-error", Boolean(isError));
  message.hidden = !text;
}

// ---------- Show the right screen for logged in / logged out ----------
function showScreen(session) {
  authSection.hidden = Boolean(session);
  todoSection.hidden = !session;

  if (session) {
    userEmail.textContent = session.user.email;
    loadTasks();
  } else {
    tasks = [];
    render();
  }
}

// ---------- Accounts: sign up, log in, log out ----------
authForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading
  const mode = event.submitter ? event.submitter.dataset.mode : "login";
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const buttons = authForm.querySelectorAll("button");

  showMessage("");
  buttons.forEach((b) => (b.disabled = true));

  try {
    if (mode === "signup") {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        // After confirming their email, send people back to this site.
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.session) {
        showMessage("Account created! Check your email for a confirmation link, then log in.");
      }
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
    passwordInput.value = "";
  } catch (error) {
    const offline = error.message.includes("fetch");
    showMessage(offline ? "Couldn't reach Supabase. Check your connection and settings." : error.message, true);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
});

logoutButton.addEventListener("click", async () => {
  showMessage("");
  await db.auth.signOut();
});

// ---------- Tasks: read and write the "tasks" table ----------
// Supabase only returns the logged-in user's own tasks (see supabase/schema.sql).
async function loadTasks() {
  const { data, error } = await db
    .from("tasks")
    .select("id, text, completed")
    .order("created_at", { ascending: true });

  if (error) return showMessage("Could not load tasks: " + error.message, true);
  tasks = data;
  render();
}

async function addTask(text) {
  const { data, error } = await db
    .from("tasks")
    .insert({ text: text })
    .select("id, text, completed")
    .single();

  if (error) return showMessage("Could not add task: " + error.message, true);
  tasks.push(data);
  render();
}

async function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  const { error } = await db
    .from("tasks")
    .update({ completed: !task.completed })
    .eq("id", id);

  if (error) return showMessage("Could not update task: " + error.message, true);
  task.completed = !task.completed;
  render();
}

async function deleteTask(id) {
  const { error } = await db.from("tasks").delete().eq("id", id);

  if (error) return showMessage("Could not delete task: " + error.message, true);
  tasks = tasks.filter((t) => t.id !== id);
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
  showMessage("");
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

// ---------- Start the app ----------
if (!db) {
  setupMessage.hidden = false;
} else {
  // Runs on page load (with any saved login) and whenever someone logs in or out.
  // setTimeout keeps Supabase calls out of the auth callback itself.
  db.auth.onAuthStateChange((event, session) => {
    setTimeout(() => showScreen(session), 0);
  });
}

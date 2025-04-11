console.log("✅ JS Loaded");
const API_URL = "https://empradar-backend-1.onrender.com/api/tasks";
let tasks = [];

const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("loginSection");
const loginError = document.getElementById("loginError");
const mainTabs = document.getElementById("mainTabs");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm).entries());
  try {
    const res = await fetch("https://empradar-backend-1.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Login failed");
    const user = await res.json();
    localStorage.setItem("user", JSON.stringify(user));
    loginSection.classList.add("hidden");
    mainTabs.classList.remove("hidden");
    showTab("dashboard");
    fetchTasks();
  } catch {
    loginError.textContent = "Invalid credentials.";
  }
});

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

function showTab(id) {
  localStorage.setItem("activeTab", id);
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.add("hidden");
    t.classList.remove("active");
  });
  const active = document.getElementById(id);
  if (active) {
    active.classList.remove("hidden");
    active.classList.add("active");
  }
}

async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    tasks = await res.json();
    renderTasks();
    renderDashboard();
  } catch (err) {
    alert("Could not load tasks");
  }
}

function renderTasks() {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";
  tasks.forEach(task => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <button onclick="openEdit('${task.id}')">✏️</button>
        <button onclick="deleteTask('${task.id}')">🗑️</button>
      </td>
      <td>${task.task}</td>
      <td>${task.measure}</td>
      <td>${task.target} ${task.unit}</td>
      <td>${task.assignedBy || "—"}</td>
      <td>${task.assignedTime ? new Date(task.assignedTime).toLocaleString() : "—"}</td>
      <td>${task.assignedTo}</td>
      <td>${task.status}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderDashboard() {
  const completed = tasks.filter(t => t.status === "Completed").length;
  document.getElementById("summary").innerHTML = `
    <p>Total Tasks: ${tasks.length}</p>
    <p>Completed Tasks: ${completed}</p>
  `;
}

document.getElementById("addTaskBtn").addEventListener("click", () => {
  const form = document.getElementById("editTaskForm");
  form.reset();
  delete form.dataset.editId;
  document.getElementById("sidebarTitle").textContent = "Create Task";
  const sidebar = document.getElementById("editSidebar");
    sidebar.classList.remove("hidden");  // ✅ FIX HERE
    sidebar.classList.add("show");

});

document.getElementById("closeSidebarBtn").addEventListener("click", () => {
  document.getElementById("editSidebar").classList.remove("show");
});

document.getElementById("editTaskForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const taskData = Object.fromEntries(new FormData(e.target).entries());
  console.log("🔍 Submitting task data:", taskData);
  taskData.target = Number(taskData.target);
  const editId = e.target.dataset.editId;
  const currentUser = JSON.parse(localStorage.getItem("user"));
  taskData.assignedBy = currentUser.username;
  
  console.log("🟢 Sending new task to server:", taskData);


  try {
    if (editId) {
      const existing = tasks.find(t => t.id == editId);
      taskData.assignedTime = existing.assignedTime;
      const res = await fetch(`${API_URL}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      const updated = await res.json();
      tasks = tasks.map(t => t.id == editId ? updated : t);
    } else {
      taskData.assignedTime = new Date().toISOString();
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      const newTask = await res.json();
      tasks.push(newTask);
    }
    e.target.reset();
    delete e.target.dataset.editId;
    document.getElementById("editSidebar").classList.remove("show");
    renderTasks();
    renderDashboard();
    showToast("Task saved");
  } catch (err) {
    alert("Failed to save task");
  }
});

async function deleteTask(id) {
  if (!confirm("Are you sure?")) return;
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  tasks = tasks.filter(t => t.id != id);
  renderTasks();
  renderDashboard();
  showToast("Task deleted");
}

function openEdit(id) {
  const task = tasks.find(t => t.id == id);
  if (!task) return;
  const form = document.getElementById("editTaskForm");
  form.task.value = task.task;
  form.measure.value = task.measure;
  form.target.value = task.target;
  form.unit.value = task.unit;
  form.assignedTo.value = task.assignedTo;
  form.status.value = task.status;
  form.dataset.editId = id;
  document.getElementById("sidebarTitle").textContent = "Edit Task";
  const sidebar = document.getElementById("editSidebar");
    sidebar.classList.remove("hidden");  // ✅ FIX HERE
    sidebar.classList.add("show");

}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 2000);
}

document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("user");
  if (user) {
    loginSection.classList.add("hidden");
    mainTabs.classList.remove("hidden");
    showTab(localStorage.getItem("activeTab") || "dashboard");
    fetchTasks();
  } else {
    loginSection.classList.remove("hidden");
    mainTabs.classList.add("hidden");
    document.querySelectorAll(".tab").forEach(tab => {
      if (tab.id !== "loginSection") tab.classList.add("hidden");
    });
  }
});

window.openEdit = openEdit;
window.deleteTask = deleteTask;

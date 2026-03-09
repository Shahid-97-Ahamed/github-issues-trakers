const BASE_URL = "https://phi-lab-server.vercel.app/api/v1/lab";

const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const issuesContainer = document.getElementById("issuesContainer");
const spinner = document.getElementById("spinner");
const issueCount = document.getElementById("issueCount");

const tabButtons = document.querySelectorAll(".tab-btn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const logoutBtn = document.getElementById("logoutBtn");

const issueModal = document.getElementById("issueModal");
const modalBody = document.getElementById("modalBody");

let allIssues = [];
let currentTab = "all";

/* login */
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "admin123") {
    localStorage.setItem("isLoggedIn", "true");
    loginError.textContent = "";
    showMainPage();
    loadAllIssues();
  } else {
    loginError.textContent = "Invalid username or password";
  }
});
function showMainPage() {
  loginPage.classList.add("hidden");
  mainPage.classList.remove("hidden");
}




function checkAuth() {
  if (localStorage.getItem("isLoggedIn") === "true") {
    showMainPage();
    loadAllIssues();
  }
}
checkAuth();

/* loading */
function showSpinner() {
  spinner.classList.remove("hidden");
}

function hideSpinner() {
  spinner.classList.add("hidden");
}

/* fetch */
async function loadAllIssues() {
  try {
    showSpinner();
    issuesContainer.innerHTML = "";

    const res = await fetch(`${BASE_URL}/issues`);
    const data = await res.json();
    allIssues = data.data || [];
    applyFilterAndRender();
  } catch (error) {
    issuesContainer.innerHTML = `
      <div class="empty-box bg-white rounded-xl p-10 text-center text-slate-500">
        Failed to load issues
      </div>
    `;
  } finally {
    hideSpinner();
  }
}

async function searchIssues(query) {
  try {
    showSpinner();
    issuesContainer.innerHTML = "";

    const res = await fetch(`${BASE_URL}/issues/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const searchedIssues = data.data || [];
    renderIssues(filterByTab(searchedIssues, currentTab));
  } catch (error) {
    issuesContainer.innerHTML = `
      <div class="empty-box bg-white rounded-xl p-10 text-center text-slate-500">
        Search failed
      </div>
    `;
  } finally {
    hideSpinner();
  }
}

async function loadSingleIssue(id) {
  try {
    const res = await fetch(`${BASE_URL}/issue/${id}`);
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

/* tabs */
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.remove("active-tab"));
    btn.classList.add("active-tab");

    currentTab = btn.dataset.tab;

    const searchText = searchInput.value.trim();
    if (searchText) {
      searchIssues(searchText);
    } else {
      applyFilterAndRender();
    }
  });
});

function filterByTab(issues, tabName) {
  if (tabName === "all") return issues;

  return issues.filter((issue) => {
    const status = String(issue.status || "").toLowerCase();
    return status === tabName;
  });
}

function applyFilterAndRender() {
  const filteredIssues = filterByTab(allIssues, currentTab);
  renderIssues(filteredIssues);
}

/* search */
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    applyFilterAndRender();
    return;
  }
  searchIssues(query);
}

/* render */
function renderIssues(issues) {
  issuesContainer.innerHTML = "";
  issueCount.textContent = `${issues.length} Issues`;

  if (!issues.length) {
    issuesContainer.innerHTML = `
      <div class="empty-box bg-white rounded-xl p-10 text-center text-slate-500">
        No issues found
      </div>
    `;
    return;
  }

  issues.forEach((issue) => {
    const status = (issue.status || "").toLowerCase();
    const priorityClass = getPriorityClass(issue.priority);
    const labelsHTML = formatLabels(issue.label);

    const card = document.createElement("div");
    card.className = `issue-card ${status}`;

    card.innerHTML = `
      <div class="p-4">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="w-5 h-5 rounded-full flex items-center justify-center ${
            status === "open" ? "bg-emerald-100 text-emerald-500" : "bg-violet-100 text-violet-500"
          }">
            <span class="text-[10px] font-bold">${status === "open" ? "✓" : "◉"}</span>
          </div>

          <span class="issue-priority ${priorityClass}">
            ${(issue.priority || "LOW").toUpperCase()}
          </span>
        </div>

        <h3 class="text-[15px] font-bold leading-6 mb-2 text-slate-800">
          ${issue.title || "No title"}
        </h3>

        <p class="issue-desc text-[12px] text-slate-400 leading-5 mb-4">
          ${issue.description || "No description available"}
        </p>

        <div class="flex flex-wrap gap-2 mb-4">
          ${labelsHTML}
        </div>
      </div>

      <div class="border-t border-slate-200 px-4 py-3 text-[12px] text-slate-500 space-y-1">
        <p>#${issue.id || issue._id || "N/A"} by ${issue.author || "john_doe"}</p>
        <p>${formatDate(issue.createdAt)}</p>
      </div>
    `;

    card.addEventListener("click", async () => {
      const fullIssue = await loadSingleIssue(issue.id || issue._id);
      openModal(fullIssue || issue);
    });

    issuesContainer.appendChild(card);
  });
}

function openModal(issue) {
  modalBody.innerHTML = `
    <h3 class="text-2xl font-bold mb-4">${issue.title || "No Title"}</h3>
    <div class="space-y-3 text-base">
      <p><span class="font-bold">Description:</span> ${issue.description || "No description available"}</p>
      <p><span class="font-bold">Status:</span> ${issue.status || "N/A"}</p>
      <p><span class="font-bold">Author:</span> ${issue.author || "Unknown"}</p>
      <p><span class="font-bold">Priority:</span> ${issue.priority || "N/A"}</p>
      <p><span class="font-bold">Label:</span> ${Array.isArray(issue.label) ? issue.label.join(", ") : (issue.label || "N/A")}</p>
      <p><span class="font-bold">Created At:</span> ${formatDate(issue.createdAt)}</p>
      <p><span class="font-bold">Issue ID:</span> ${issue.id || issue._id || "N/A"}</p>
    </div>
  `;
  issueModal.showModal();
}

/* helpers */
function formatDate(dateString) {
  if (!dateString) return "1/15/2024";
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString();
}

function getPriorityClass(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "high") return "priority-high";
  if (value === "medium") return "priority-medium";
  return "priority-low";
}

function formatLabels(label) {
  if (!label) {
    return `<span class="issue-label label-bug">BUG</span>`;
  }

  const labels = Array.isArray(label) ? label : [label];

  return labels.map((item) => {
    const text = String(item).toLowerCase();

    if (text.includes("help")) {
      return `<span class="issue-label label-help-wanted">HELP WANTED</span>`;
    }

    if (text.includes("enhancement")) {
      return `<span class="issue-label label-enhancement">ENHANCEMENT</span>`;
    }

    return `<span class="issue-label label-bug">${String(item).toUpperCase()}</span>`;
  }).join("");
}

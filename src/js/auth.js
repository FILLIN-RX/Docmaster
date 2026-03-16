/**
 * AUTH.JS - Mock Authentication System for DocMaster
 * Handles login, registration, and session management using localStorage.
 */

const AUTH_KEY = "docmaster_user_session";
const USERS_KEY = "docmaster_users_db";

function getInitials(name) {
  return (name || "DM")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Initialize mock DB with a default user if empty
 */
function initDB() {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers = [
      {
        email: "user@example.com",
        password: "password123",
        name: "Jean-Marc D.",
        initial: "JM",
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
}

/**
 * Login function
 */
function login(email, password) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY));
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return { success: true, user };
  }
  return { success: false, message: "Email ou mot de passe incorrect." };
}

/**
 * Register function
 */
function register(name, email, password) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY));

  if (users.some((u) => u.email === email)) {
    return { success: false, message: "Cet email est déjà utilisé." };
  }

  const newUser = {
    name,
    email,
    password,
    initial: getInitials(name),
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Auto-login
  localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
  return { success: true, user: newUser };
}

/**
 * Logout function
 */
function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "login.html";
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
  const session = localStorage.getItem(AUTH_KEY);
  const currentPage = window.location.pathname.split("/").pop();
  const publicPages = ["index.html", "login.html", "rechercher.html", "rechercher.old.html"];
  const isLoginPage = currentPage === "login.html";
  const isPublicPage = publicPages.includes(currentPage);

  if (!session && !isPublicPage) {
    window.location.href = "login.html";
  } else if (session && isLoginPage) {
    window.location.href = "dashboard.html";
  }

  if (session) {
    const user = JSON.parse(session);
    updateUI(user);
    markActiveSidebar();
  }
}

/**
 * Update UI elements with user data
 */
function updateUI(user) {
  const nameEls = ["userName", "topName", "helloName"];
  const initialEls = ["userInitial", "topInitial"];

  nameEls.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = user.name;
  });

  initialEls.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = user.initial;
  });
}

function getCurrentUser() {
  const session = localStorage.getItem(AUTH_KEY);
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

function saveCurrentUserProfile(updates) {
  const currentUser = getCurrentUser();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

  if (!currentUser) {
    return { success: false, message: "Aucune session active." };
  }

  const currentIndex = users.findIndex((user) => user.email === currentUser.email);
  if (currentIndex === -1) {
    return { success: false, message: "Utilisateur introuvable." };
  }

  const nextName = (updates.name || currentUser.name || "").trim();
  const nextEmail = (updates.email || currentUser.email || "").trim();

  if (!nextName || !nextEmail) {
    return { success: false, message: "Nom et email sont obligatoires." };
  }

  const emailAlreadyUsed = users.some((user, index) => {
    return index !== currentIndex && user.email === nextEmail;
  });

  if (emailAlreadyUsed) {
    return { success: false, message: "Cet email est déjà utilisé." };
  }

  const mergedUser = {
    ...users[currentIndex],
    ...currentUser,
    ...updates,
    name: nextName,
    email: nextEmail,
    initial: getInitials(nextName),
  };

  users[currentIndex] = mergedUser;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(AUTH_KEY, JSON.stringify(mergedUser));

  updateUI(mergedUser);
  markActiveSidebar();

  return { success: true, user: mergedUser };
}

// Highlight the active sidebar link based on current URL
function markActiveSidebar() {
  const current = window.location.pathname.split("/").pop();
  document.querySelectorAll(".sb-item").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && href !== "#" && href.split("/").pop() === current) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });
}

// sidebar open/close helpers (used by the hamburger & overlay)
function openSb() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('show');
}
function closeSb() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

function startButtonLoader(button) {
  if (!button || button.classList.contains('btn-is-loading')) return;
  button.dataset.originalHtml = button.innerHTML;
  button.classList.add('btn-is-loading');
  button.disabled = true;
  const loadingText = button.dataset.loadingText || 'Chargement...';
  button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="margin-right:8px"></i>${loadingText}`;
}

function stopButtonLoader(button) {
  if (!button || !button.classList.contains('btn-is-loading')) return;
  button.classList.remove('btn-is-loading');
  button.disabled = false;
  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
}

function setupGlobalButtonLoaders() {
  if (!document.getElementById('global-loader-style')) {
    const style = document.createElement('style');
    style.id = 'global-loader-style';
    style.textContent = `.btn-is-loading{pointer-events:none;opacity:.9}`;
    document.head.appendChild(style);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-loading-text]');
    if (!button || button.disabled) return;
    startButtonLoader(button);
    const delay = Number(button.dataset.loadingDelay || 900);
    setTimeout(() => stopButtonLoader(button), Number.isFinite(delay) ? delay : 900);
  });
}

// ensure sidebar starts closed on mobile
if (window.innerWidth < 900) closeSb();

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  initDB();
  checkAuth();
  setupGlobalButtonLoaders();

  // Setup login forms (handles both mobile and desktop)
  document.querySelectorAll(".form-login").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;

      const result = login(email, password);
      if (result.success) {
        window.location.href = "dashboard.html";
      } else {
        alert(result.message);
      }
    });
  });

  // Setup register forms (handles both mobile and desktop)
  document.querySelectorAll(".form-register").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector('input[type="text"]').value;
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;

      const result = register(name, email, password);
      if (result.success) {
        window.location.href = "dashboard.html";
      } else {
        alert(result.message);
      }
    });
  });

  // Setup logout buttons
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });

  // close sidebar on mobile when a navigation link is tapped
  document.querySelectorAll(".sb-item").forEach((a) => {
    a.addEventListener("click", () => {
      if (window.innerWidth < 900) closeSb();
    });
  });
});

/**
 * ═════════════════════════════════════════════════════════════════
 * SIDEBAR HELPERS - Sidebar navigation management
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Open sidebar and overlay
 */
export function openSb() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('show');
}

/**
 * Close sidebar and overlay
 */
export function closeSb() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

/**
 * Mark active page in sidebar
 */
export function markActiveSidebar() {
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
  const navLinks = document.querySelectorAll("[data-nav-link]");
  
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage || (href === "dashboard.html" && currentPage === "")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

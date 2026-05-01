/**
 * ═════════════════════════════════════════════════════════════════
 * BUTTON LOADERS - Loading state management for buttons
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Start button loading state with spinner
 */
export function startButtonLoader(button) {
  if (!button || button.classList.contains('btn-is-loading')) return;
  button.dataset.originalHtml = button.innerHTML;
  button.classList.add('btn-is-loading');
  button.disabled = true;
  const loadingText = button.dataset.loadingText || 'Chargement...';
  button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="margin-right:8px"></i>${loadingText}`;
}

/**
 * Stop button loading state
 */
export function stopButtonLoader(button) {
  if (!button || !button.classList.contains('btn-is-loading')) return;
  button.classList.remove('btn-is-loading');
  button.disabled = false;
  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
}

/**
 * Setup global button loaders with click event
 */
export function setupGlobalButtonLoaders() {
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

/**
 * ═════════════════════════════════════════════════════════════════
 * ERROR MODAL - Reusable error notification component
 * Uses Tailwind CSS for styling
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Show error modal with message
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {number} duration - Auto-close duration in ms (0 = no auto-close)
 */
export function showErrorModal(title = 'Erreur', message = '', duration = 5000) {
  // Remove existing modal if any
  const existing = document.getElementById('error-modal-container');
  if (existing) existing.remove();

  // Create modal container
  const container = document.createElement('div');
  container.id = 'error-modal-container';
  container.className = 'fixed inset-0 flex items-center justify-center z-50 p-4';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200';

  modal.innerHTML = `
    <div class="bg-red-50 border-l-4 border-red-500 p-4">
      <div class="flex">
        <div class="shrink-0">
          <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-red-800">${title}</h3>
          <p class="mt-2 text-sm text-red-700">${message}</p>
        </div>
      </div>
    </div>
    <div class="p-4 flex justify-end gap-2">
      <button id="error-modal-close" class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
        Fermer
      </button>
    </div>
  `;

  container.appendChild(modal);
  document.body.appendChild(container);

  // Close button handler
  const closeBtn = document.getElementById('error-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.style.opacity = '0';
      container.style.transform = 'scale(0.95)';
      setTimeout(() => container.remove(), 200);
    });
  }

  // Close on backdrop click
  container.addEventListener('click', (e) => {
    if (e.target === container) {
      container.style.opacity = '0';
      container.style.transform = 'scale(0.95)';
      setTimeout(() => container.remove(), 200);
    }
  });

  // Auto-close after duration (if specified)
  if (duration > 0) {
    setTimeout(() => {
      if (document.body.contains(container)) {
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        setTimeout(() => container.remove(), 200);
      }
    }, duration);
  }
}

/**
 * Show success modal with message
 * @param {string} title - Success title
 * @param {string} message - Success message
 * @param {number} duration - Auto-close duration in ms
 */
export function showSuccessModal(title = 'Succès', message = '', duration = 3000) {
  // Remove existing modal if any
  const existing = document.getElementById('success-modal-container');
  if (existing) existing.remove();

  // Create modal container
  const container = document.createElement('div');
  container.id = 'success-modal-container';
  container.className = 'fixed inset-0 flex items-center justify-center z-50 p-4';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200';

  modal.innerHTML = `
    <div class="bg-green-50 border-l-4 border-green-500 p-4">
      <div class="flex">
        <div class="shrink-0">
          <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-green-800">${title}</h3>
          <p class="mt-2 text-sm text-green-700">${message}</p>
        </div>
      </div>
    </div>
    <div class="p-4 flex justify-end">
      <button id="success-modal-close" class="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors">
        Fermer
      </button>
    </div>
  `;

  container.appendChild(modal);
  document.body.appendChild(container);

  // Close button handler
  const closeBtn = document.getElementById('success-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.style.opacity = '0';
      container.style.transform = 'scale(0.95)';
      setTimeout(() => container.remove(), 200);
    });
  }

  // Auto-close after duration
  setTimeout(() => {
    if (document.body.contains(container)) {
      container.style.opacity = '0';
      container.style.transform = 'scale(0.95)';
      setTimeout(() => container.remove(), 200);
    }
  }, duration);
}

/**
 * Show info/warning modal
 * @param {string} title - Title
 * @param {string} message - Message
 * @param {string} type - 'info' or 'warning'
 * @param {number} duration - Auto-close duration in ms (0 = no auto-close)
 */
export function showInfoModal(title = 'Info', message = '', type = 'info', duration = 0) {
  // Remove existing modal if any
  const existing = document.getElementById('info-modal-container');
  if (existing) existing.remove();

  const bgColor = type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';
  const borderColor = type === 'warning' ? 'border-yellow-500' : 'border-blue-500';
  const textColor = type === 'warning' ? 'text-yellow-800' : 'text-blue-800';
  const btnColor = type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600';
  const iconColor = type === 'warning' ? 'text-yellow-500' : 'text-blue-500';

  // Create modal container
  const container = document.createElement('div');
  container.id = 'info-modal-container';
  container.className = 'fixed inset-0 flex items-center justify-center z-50 p-4';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200';

  modal.innerHTML = `
    <div class="${bgColor} border-l-4 ${borderColor} p-4">
      <div class="flex">
        <div class="shrink-0">
          ${type === 'warning' ? `
            <svg class="h-5 w-5 ${iconColor}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          ` : `
            <svg class="h-5 w-5 ${iconColor}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zm3 1a1 1 0 100-2 1 1 0 000 2zm2-1a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
            </svg>
          `}
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium ${textColor}">${title}</h3>
          <p class="mt-2 text-sm ${textColor.replace('800', '700')}">${message}</p>
        </div>
      </div>
    </div>
    <div class="p-4 flex justify-end">
      <button id="info-modal-close" class="px-4 py-2 rounded-lg ${btnColor} text-white font-medium transition-colors">
        Fermer
      </button>
    </div>
  `;

  container.appendChild(modal);
  document.body.appendChild(container);

  // Close button handler
  const closeBtn = document.getElementById('info-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.style.opacity = '0';
      container.style.transform = 'scale(0.95)';
      setTimeout(() => container.remove(), 200);
    });
  }

  // Auto-close after duration (if specified)
  if (duration > 0) {
    setTimeout(() => {
      if (document.body.contains(container)) {
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        setTimeout(() => container.remove(), 200);
      }
    }, duration);
  }
}

/**
 * ═════════════════════════════════════════════════════════════════
 * ERROR MODAL - Unified with premium showAlert system
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Show error modal with message
 */
export function showErrorModal(title = 'Erreur', message = '') {
  if (window.showAlert) {
    window.showAlert(message, 'error');
  } else {
    window.showAlert(message);
  }
}

/**
 * Show success modal with message
 */
export function showSuccessModal(title = 'Succès', message = '') {
  if (window.showAlert) {
    window.showAlert(message, 'success');
  } else {
    window.showAlert(message);
  }
}

/**
 * Show info/warning modal
 */
export function showInfoModal(title = 'Info', message = '', type = 'info') {
  if (window.showAlert) {
    window.showAlert(message, type);
  } else {
    window.showAlert(message);
  }
}

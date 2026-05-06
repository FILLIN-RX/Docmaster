/**
 * ═════════════════════════════════════════════════════════════════
 * UI HELPERS - Authentication form UI helpers
 * ═════════════════════════════════════════════════════════════════
 */

/**
 * Switch between login and register tabs
 */
export function switchTab(tab) {
  const forms = document.querySelectorAll('.auth-form');
  const tabButtons = document.querySelectorAll('[id^="tab-"]');
  const slider = document.getElementById('toggle-slider');

  forms.forEach(form => form.classList.remove('visible'));
  tabButtons.forEach(btn => btn.classList.remove('text-white'));

  if (tab === 'login') {
    document.getElementById('form-login')?.classList.add('visible');
    document.getElementById('dform-login')?.classList.add('visible');
    document.getElementById('tab-login').classList.add('text-white');
    if (slider) slider.style.transform = 'translateX(0)';
  } else {
    document.getElementById('form-register')?.classList.add('visible');
    document.getElementById('dform-register')?.classList.add('visible');
    document.getElementById('tab-register').classList.add('text-white');
    if (slider) slider.style.transform = 'translateX(calc(100% + 6px))';
  }
}

/**
 * Toggle password visibility
 */
export function togglePw(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  button.innerHTML = `<i class="fa-regular fa-${isPassword ? 'eye-slash' : 'eye'}"></i>`;
}

/**
 * Check password strength
 */
export function checkStrength(input, prefix) {
  const value = input.value;
  const strengthBar = document.querySelector(`#${prefix}-pw-bar`);
  if (!strengthBar) return;

  let strength = 'weak';
  if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) {
    strength = 'strong';
  } else if (value.length >= 8) {
    strength = 'medium';
  }

  strengthBar.className = `pw-bar ${strength}`;
}

/**
 * Check if passwords match
 */
export function checkMatch(prefix) {
  const pw1 = document.getElementById(`${prefix}-pw1`)?.value || '';
  const pw2 = document.getElementById(`${prefix}-pw2`)?.value || '';
  const okMsg = document.getElementById(`${prefix}-pw-ok`);

  if (okMsg) {
    okMsg.classList.toggle('hidden', pw1 !== pw2 || !pw1);
  }
}

/**
 * Check pseudo availability
 */
export function checkPseudo(input, prefix) {
  const value = input.value.toLowerCase();
  const suggestionsDiv = document.getElementById(`${prefix}-suggestions`);
  
  if (!suggestionsDiv || value.length < 3) return;

  // Mock pseudo suggestions
  const suggestions = [
    `${value}_42`,
    `${value}_pro`,
    `${value}_official`,
    `${value}_2024`,
  ];

  suggestionsDiv.innerHTML = suggestions
    .map(s => `<button type="button" class="pseudo-chip" onclick="selectPseudo('${s}', '${prefix}')">${s}</button>`)
    .join('');
}

/**
 * Select a pseudo suggestion
 */
export function selectPseudo(pseudo, prefix) {
  const pseudoInput = document.getElementById(`${prefix}-pseudo`);
  if (pseudoInput) {
    pseudoInput.value = pseudo;
    document.querySelectorAll('.pseudo-chip').forEach(chip => chip.classList.remove('selected'));
    event?.target?.classList.add('selected');
  }
}

/**
 * Toggle referral field
 */
export function toggleReferral(prefix) {
  const field = document.getElementById(`${prefix}-referral-field`);
  const chevron = document.getElementById(`${prefix}-referral-chevron`);
  
  if (field) field.classList.toggle('hidden');
  if (chevron) chevron.style.transform = field?.classList.contains('hidden') ? '' : 'rotate(180deg)';
}

/**
 * Resend PIN code
 */
export function resendPin(event) {
  event?.preventDefault();
  showAlert('Un nouveau code a été envoyé à votre adresse email.');
}

/**
 * Show a custom modal instead of native alert
 */
export function showAlert(message, type = 'info') {
  // Check if modal container already exists
  let modalContainer = document.getElementById('global-alert-modal');
  
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'global-alert-modal';
    modalContainer.innerHTML = `
      <dialog id="alert_modal_element" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box bg-white border-none shadow-2xl rounded-[32px] p-8 relative overflow-hidden">
          <!-- Background decoration -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-[#f5a64b]/10 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-[#f5a64b]/5 rounded-full blur-3xl"></div>

          <!-- Close button top right -->
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
          </form>

          <div class="flex flex-col items-center text-center gap-6 relative z-10">
            <div id="modal-icon-container" class="w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl transform rotate-3 transition-transform hover:rotate-0 duration-300">
              <i id="modal-icon" class="fa-solid fa-circle-info"></i>
            </div>
            
            <div class="space-y-2">
              <h3 id="modal-title" class="font-bricolage text-3xl font-extrabold tracking-tight text-gray-900">Notification</h3>
              <p id="modal-message" class="text-gray-500 leading-relaxed text-lg max-w-[280px] mx-auto"></p>
            </div>

            <div class="modal-action w-full mt-2">
              <form method="dialog" class="w-full">
                <button class="btn border-none w-full rounded-2xl text-white font-bold h-14 text-lg shadow-lg shadow-[#f5a64b]/20 hover:shadow-[#f5a64b]/40 transition-all duration-300" style="background-color: #f5a64b;">
                  D'accord
                </button>
              </form>
            </div>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm">
          <button class="cursor-default outline-none">close</button>
        </form>
      </dialog>
    `;
    document.body.appendChild(modalContainer);
  }

  const modal = document.getElementById('alert_modal_element');
  const titleEl = document.getElementById('modal-title');
  const messageEl = document.getElementById('modal-message');
  const iconEl = document.getElementById('modal-icon');
  const iconCont = document.getElementById('modal-icon-container');

  // Set message
  messageEl.textContent = message;

  // Set type-specific styles
  iconCont.className = 'w-20 h-20 rounded-[24px] flex items-center justify-center text-4xl transform rotate-3 transition-transform hover:rotate-0 duration-300';
  
  const msgLower = message.toLowerCase();
  const isError = type === 'error' || 
                  msgLower.includes('erreur') || 
                  msgLower.includes('impossible') || 
                  msgLower.includes('échouée') || 
                  msgLower.includes('échec') || 
                  msgLower.includes('incorrect') || 
                  msgLower.includes('invalide') || 
                  msgLower.includes('manquant') || 
                  message.includes('❌');
                  
  const isSuccess = type === 'success' || 
                    msgLower.includes('succès') || 
                    msgLower.includes('félicitations') || 
                    msgLower.includes('bravo') || 
                    msgLower.includes('réussie') || 
                    msgLower.includes('réussi') || 
                    msgLower.includes('terminé') || 
                    msgLower.includes('envoyée') || 
                    msgLower.includes('confirmé') || 
                    message.includes('✅') || 
                    message.includes('✓') ||
                    message.includes('success');

  if (isError) {
    titleEl.textContent = 'Oups !';
    iconEl.className = 'fa-solid fa-circle-xmark';
    iconCont.classList.add('bg-red-50', 'text-red-500');
  } else if (isSuccess) {
    titleEl.textContent = 'Génial !';
    iconEl.className = 'fa-solid fa-circle-check';
    iconCont.classList.add('bg-green-50', 'text-green-500');
  } else {
    titleEl.textContent = 'Notification';
    iconEl.className = 'fa-solid fa-circle-info';
    iconCont.classList.add('bg-[#f5a64b]/10', 'text-[#f5a64b]');
  }

  modal.showModal();
}

// Make it global so it can be used easily everywhere
window.showAlert = showAlert;

// Override native alert to use our custom modal
window.alert = function(message) {
  showAlert(message);
};

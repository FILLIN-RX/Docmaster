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
  alert('Un nouveau code a été envoyé à votre adresse email.');
}

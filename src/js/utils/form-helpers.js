/**
 * ═════════════════════════════════════════════════════════════════
 * FORM HELPERS - Multi-step form navigation and submission
 * ═════════════════════════════════════════════════════════════════
 */

import { startButtonLoader, stopButtonLoader } from './button-loaders.js';

/**
 * Navigate to next step in multi-step register form
 */
export function nextStep(prefix, currentStep) {
  const currentStepDiv = document.getElementById(`${prefix}-step-${currentStep}`);
  const nextStepDiv = document.getElementById(`${prefix}-step-${currentStep + 1}`);
  const currentDot = document.getElementById(`${prefix}-dot-${currentStep}`);
  const nextDot = document.getElementById(`${prefix}-dot-${currentStep + 1}`);
  const currentLine = document.getElementById(`${prefix}-line-${currentStep}`);

  if (currentStepDiv && nextStepDiv) {
    currentStepDiv.classList.remove('active');
    nextStepDiv.classList.add('active');
    
    if (currentDot) {
      currentDot.classList.remove('active');
      currentDot.classList.add('done');
    }
    if (nextDot) nextDot.classList.add('active');
    if (currentLine) currentLine.classList.add('done');

    // Update step title/subtitle if they exist
    const titles = {
      1: { title: 'Créer un compte', subtitle: 'Rejoignez la communauté DocMaster' },
      2: { title: 'Sécurisez votre compte', subtitle: 'Choisissez un mot de passe fort' },
      3: { title: 'Vérification email', subtitle: 'Entrez le code reçu dans votre email' },
      4: { title: 'Presque fini !', subtitle: 'Choisissez votre pseudo' }
    };
    
    const nextTitle = titles[currentStep + 1];
    if (nextTitle) {
      const titleEl = document.getElementById(`${prefix}-step-title`);
      const subtitleEl = document.getElementById(`${prefix}-step-subtitle`);
      if (titleEl) titleEl.innerText = nextTitle.title;
      if (subtitleEl) subtitleEl.innerText = nextTitle.subtitle;
    }
  }
}

/**
 * Navigate to previous step
 */
export function prevStep(prefix, currentStep) {
  const currentStepDiv = document.getElementById(`${prefix}-step-${currentStep}`);
  const prevStepDiv = document.getElementById(`${prefix}-step-${currentStep - 1}`);
  const currentDot = document.getElementById(`${prefix}-dot-${currentStep}`);
  const prevDot = document.getElementById(`${prefix}-dot-${currentStep - 1}`);
  const prevLine = document.getElementById(`${prefix}-line-${currentStep - 1}`);

  if (currentStepDiv && prevStepDiv) {
    currentStepDiv.classList.remove('active');
    prevStepDiv.classList.add('active');
    
    if (currentDot) currentDot.classList.remove('active');
    if (prevDot) {
      prevDot.classList.remove('done');
      prevDot.classList.add('active');
    }
    if (prevLine) prevLine.classList.remove('done');

    const titles = {
      1: { title: 'Créer un compte', subtitle: 'Rejoignez la communauté DocMaster' },
      2: { title: 'Sécurisez votre compte', subtitle: 'Choisissez un mot de passe fort' },
      3: { title: 'Vérification email', subtitle: 'Entrez le code reçu dans votre email' }
    };
    
    const prevTitle = titles[currentStep - 1];
    if (prevTitle) {
      const titleEl = document.getElementById(`${prefix}-step-title`);
      const subtitleEl = document.getElementById(`${prefix}-step-subtitle`);
      if (titleEl) titleEl.innerText = prevTitle.title;
      if (subtitleEl) subtitleEl.innerText = prevTitle.subtitle;
    }
  }
}

/**
 * Submit the multi-step register form
 */
export async function submitRegister(prefix) {
  try {
    // Get form inputs
    const nomInput = document.getElementById(`${prefix}-nom`);
    const prenomInput = document.getElementById(`${prefix}-prenom`);
    const emailInput = document.getElementById(`${prefix}-email`);
    const passwordInput = document.getElementById(`${prefix}-pw1`);

    // Validate inputs exist
    if (!nomInput || !emailInput || !passwordInput) {
      alert("Erreur: Formulaire incomplet");
      return;
    }

    // Get values
    const nom = nomInput.value.trim();
    const prenom = prenomInput?.value.trim() || "";
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate data
    if (!nom || !email || !password) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    // Validate pseudo
    const pseudoVal = document.getElementById(`${prefix}-pseudo`)?.value.trim() || '';
    if (pseudoVal.length < 3 || !/^[a-zA-Z0-9_]+$/.test(pseudoVal)) {
      alert("Veuillez choisir un pseudo valide (min. 3 caractères).");
      return;
    }

    console.log("📝 Inscription en cours...");
    
    // Show loader if possible
    const submitBtn = document.querySelector('button[onclick*="submitRegister"]');
    if (submitBtn && typeof startButtonLoader === 'function') startButtonLoader(submitBtn);

    // Call register from window global scope (set in auth.js)
    const result = await window.register(nom, prenom, email, password);

    if (submitBtn && typeof stopButtonLoader === 'function') stopButtonLoader(submitBtn);

    if (result.success) {
      console.log("✓ Inscription réussie! Code d'invitation:", result.code_invitation);
      // Show referral code to user
      alert(`✓ Inscription réussie!\nVotre code d'invitation: ${result.code_invitation}`);
      window.location.href = "/login.html";
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    alert("Une erreur est survenue lors de l'inscription.");
  }
}

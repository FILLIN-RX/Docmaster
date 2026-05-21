import { fr } from './fr.js';
import { en } from './en.js';

const translations = { fr, en };
let currentLang = localStorage.getItem('lang') || 'fr';

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        applyTranslations();
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
    }
}

export function translate(key) {
    return translations[currentLang][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = translate(key);
        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
            el.setAttribute('placeholder', translated);
        } else {
            el.textContent = translated;
        }
    });

    const currentLangName = document.getElementById('currentLangName');
    if (currentLangName) {
        currentLangName.textContent = currentLang === 'fr' ? 'Français' : 'English';
    }

    // Reveal the page after translations are applied (anti-FOUC)
    document.documentElement.style.visibility = '';
}

window.setLanguage = setLanguage;
window.translate = translate;

document.addEventListener('DOMContentLoaded', applyTranslations);

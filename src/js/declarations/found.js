import { createFoundDeclaration } from '../services/api.js';

/**
 * Found Declaration Module
 * Handles UI interactions and API submission for found documents.
 */

// State
let selectedType = null;
const tags = [];
let currentStep = 1;

// Metadata for document types
const DOC_TYPES = [
  { key: "cni", title: "CNI", subtitle: "Carte d'identité", icon: "fa-id-card", iconWrap: "bg-green-light", iconCls: "text-green-mid", hasExpiration: true },
  { key: "passport", title: "Passeport", subtitle: "International", icon: "fa-passport", iconWrap: "bg-blue-50", iconCls: "text-blue-500", hasExpiration: true },
  { key: "permis", title: "Permis", subtitle: "Conduire", icon: "fa-car", iconWrap: "bg-amber-50", iconCls: "text-amber-500", hasExpiration: true },
  { key: "carte-pro", title: "Carte pro", subtitle: "Pro, étudiant…", icon: "fa-id-badge", iconWrap: "bg-teal-50", iconCls: "text-teal-500", hasExpiration: true },
  { key: "autre", title: "Autre", subtitle: "Attestation, etc.", icon: "fa-ellipsis", iconWrap: "bg-gray-100", iconCls: "text-gray-500", hasExpiration: true },
  { key: "diplome", title: "Diplôme", subtitle: "BAC, Licence…", icon: "fa-graduation-cap", iconWrap: "bg-purple-50", iconCls: "text-purple-500", hasExpiration: false },
  { key: "acte", title: "Acte civil", subtitle: "Naissance, mariage", icon: "fa-file-lines", iconWrap: "bg-pink-50", iconCls: "text-pink-500", hasExpiration: false },
];

/**
 * Render document type cards grouped by expiration
 */
function renderDocTypes() {
  const expGrid = document.getElementById("type-grid-expiring");
  const nexGrid = document.getElementById("type-grid-non-expiring");
  
  if (!expGrid || !nexGrid) return;
  
  expGrid.innerHTML = '';
  nexGrid.innerHTML = '';

  DOC_TYPES.forEach(d => {
    const html = `
      <button class="doc-type-card" onclick="selectDocType(this,'${d.key}')">
        <div class="w-9 h-9 rounded-[10px] ${d.iconWrap} flex items-center justify-center mx-auto mb-2">
          <i class="fa-solid ${d.icon} ${d.iconCls} text-lg"></i>
        </div>
        <div class="text-[12px] font-bold text-textMain">${d.title}</div>
        <div class="text-[10px] text-textMuted mt-0.5">${d.subtitle}</div>
      </button>
    `;
    
    if (d.hasExpiration) {
      expGrid.insertAdjacentHTML('beforeend', html);
    } else {
      nexGrid.insertAdjacentHTML('beforeend', html);
    }
  });
}

/**
 * Initialize the found declaration page
 */
export function initFoundDeclaration() {
  // Navigation
  window.goToStep = goToStep;
  window.selectDocType = selectDocType;
  window.submitDeclaration = submitDeclaration;
  window.handleTag = handleTag;
  window.removeTag = removeTag;
  window.selectReward = selectReward;
  window.simulateMapClick = simulateMapClick;
  
  // File previews
  window.fileChg = fileChg;
  window.drgOver = drgOver;
  window.drgLeave = drgLeave;
  window.drgDrop = drgDrop;

  // Render types
  renderDocTypes();

  // Defaults
  const dateInput = document.getElementById("lieu-date");
  if (dateInput) dateInput.valueAsDate = new Date();
}

/**
 * Change wizard step
 */
function goToStep(n) {
  // Simple validation before moving
  if (n === 2 && !selectedType) {
    alert("Veuillez sélectionner un type de document.");
    return;
  }

  for (let i = 1; i <= 5; i++) {
    const panel = document.getElementById("panel-" + i);
    if (!panel) continue;
    
    panel.classList.add("hidden");
    const si = document.getElementById("si-" + i);
    const sc = document.getElementById("sc-" + i);
    
    if (i < n) {
      si.className = "step-item done";
      sc.className = "step-circle done";
      sc.innerHTML = '<i class="fa-solid fa-check text-[9px]"></i>';
    } else if (i === n) {
      si.className = "step-item active";
      sc.className = "step-circle active";
      sc.textContent = i;
    } else {
      si.className = "step-item pending";
      sc.className = "step-circle pending";
      sc.textContent = i;
    }
  }

  const activePanel = document.getElementById("panel-" + n);
  if (activePanel) {
    activePanel.classList.remove("hidden");
    activePanel.classList.add("panel-content");
  }
  
  currentStep = n;
  if (n === 5) fillRecap();
  
  const panelArea = document.getElementById("panel-area");
  if (panelArea) panelArea.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Document type selection
 */
function selectDocType(btn, type) {
  document.querySelectorAll(".doc-type-card").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedType = type;
  
  const btnNext = document.getElementById("btn-s1");
  if (btnNext) btnNext.disabled = false;
  
  const autreInput = document.getElementById("autre-input");
  if (autreInput) autreInput.classList.toggle("hidden", type !== "autre");
}

/**
 * Handle tags (mots-clés)
 */
function handleTag(e) {
  if ((e.key === "Enter" || e.key === ",") && e.target.value.trim()) {
    e.preventDefault();
    const v = e.target.value.trim().replace(",", "");
    if (v && !tags.includes(v)) {
      tags.push(v);
      const t = document.createElement("span");
      t.className = "tag";
      t.innerHTML = `${v}<button onclick="removeTag(this,'${v}')">✕</button>`;
      document.getElementById("tags-list").appendChild(t);
    }
    e.target.value = "";
  }
}

function removeTag(btn, v) {
  const i = tags.indexOf(v);
  if (i > -1) tags.splice(i, 1);
  btn.parentElement.remove();
}

/**
 * Reward selection UI
 */
function selectReward(card, type) {
  document.querySelectorAll(".reward-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
}

/**
 * File handling
 */
function fileChg(input, prevId, imgId, zoneId) {
  const file = input.files[0];
  if (!file) return;
  showPreview(file, prevId, imgId, zoneId);
}

function drgOver(e, id) { e.preventDefault(); document.getElementById(id).classList.add("drag-over"); }
function drgLeave(id) { document.getElementById(id).classList.remove("drag-over"); }
function drgDrop(e, zoneId, prevId, imgId) {
  e.preventDefault();
  drgLeave(zoneId);
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) showPreview(file, prevId, imgId, zoneId);
}

function showPreview(file, prevId, imgId, zoneId) {
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(imgId).src = e.target.result;
    document.getElementById(prevId).classList.remove("hidden");
    const ph = prevId.replace("prev", "phold");
    const phEl = document.getElementById(ph);
    if (phEl) phEl.classList.add("hidden");
    if (zoneId) document.getElementById(zoneId).classList.add("has-file");
  };
  reader.readAsDataURL(file);
}

/**
 * Fill Recap sidebar
 */
function fillRecap() {
  const recapType = document.getElementById("recap-doc-type");
  if (recapType) {
    const meta = DOC_TYPES.find(d => d.key === selectedType);
    recapType.textContent = meta ? meta.title : "Autre";
  }
  
  const addr = document.getElementById("lieu-adresse");
  const recapLieu = document.getElementById("recap-lieu");
  if (recapLieu) recapLieu.textContent = addr ? (addr.value || "—") : "—";
  
  const dateInput = document.getElementById("lieu-date");
  const recapDate = document.getElementById("recap-date");
  if (recapDate && dateInput && dateInput.value) {
    recapDate.textContent = new Date(dateInput.value).toLocaleDateString("fr-FR");
  }
  
  let photosCount = 0;
  ["file-main", "file-extra1", "file-extra2", "file-extra3"].forEach(id => {
    const input = document.getElementById(id);
    if (input && input.files.length) photosCount++;
  });
  const recapPhotos = document.getElementById("recap-photos");
  if (recapPhotos) recapPhotos.textContent = `${photosCount} photo(s)`;
}

/**
 * Submit to API
 */
async function submitDeclaration() {
  const consent = document.getElementById("consent-found");
  if (!consent || !consent.checked) {
    alert("Veuillez accepter les conditions d'utilisation.");
    return;
  }

  const btn = document.getElementById("btn-submit");
  const wrap = document.getElementById("prog-wrap");
  const bar = document.getElementById("upload-bar");
  const pct = document.getElementById("prog-pct");
  const lbl = document.getElementById("prog-label");

  if (wrap) wrap.classList.remove("hidden");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-[12px]"></i> Publication…';
  }

  // Build FormData
  const formData = new FormData();
  const details = document.getElementById('doc-details').value;
  const otherType = document.getElementById('autre-type-input').value;
  const docTypeLabel = selectedType === 'autre' ? otherType : selectedType;
  
  formData.append('doc_type', docTypeLabel);
  formData.append('owner_name', document.getElementById('owner-name').value);
  formData.append('document_number', document.getElementById('doc-num').value);
  
  const etat = document.querySelector('input[name="etat"]:checked');
  formData.append('etat_physique', etat ? etat.value : 'bon');
  
  formData.append('description', `${details}\n\nMots-clés: ${tags.join(', ')}`);
  
  formData.append('ville', document.getElementById('lieu-adresse').value);
  
  const contactMode = document.querySelector('input[name="contact-mode"]:checked');
  formData.append('mode_contact', contactMode ? contactMode.value : 'APP_CHAT');

  // Files
  const fileMain = document.getElementById('file-main').files[0];
  if (fileMain) formData.append('photo_recto', fileMain);
  
  const fileExtra1 = document.getElementById('file-extra1').files[0];
  if (fileExtra1) formData.append('photo_verso', fileExtra1);

  // Progress animation simulation (actual upload progress is harder without axios/xhr hooks here, but let's keep the UI alive)
  let p = 0;
  const interval = setInterval(() => {
    p += 10;
    if (p > 90) clearInterval(interval);
    if (bar) bar.style.width = p + "%";
    if (pct) pct.textContent = p + "%";
  }, 200);

  const result = await createFoundDeclaration(formData);

  clearInterval(interval);
  if (bar) bar.style.width = "100%";
  if (pct) pct.textContent = "100%";

  if (result.success) {
    document.getElementById("panel-5").classList.add("hidden");
    const successPanel = document.getElementById("panel-success");
    successPanel.classList.remove("hidden");
    successPanel.classList.add("panel-content");
    
    // Set ref
    document.getElementById("decl-ref").textContent = result.data.identifiant_doc_dm || "DOC-FND-SUCCESS";
    
    // Update steps
    for (let i = 1; i <= 5; i++) {
      const sc = document.getElementById("sc-" + i);
      if (sc) {
        sc.className = "step-circle done";
        sc.innerHTML = '<i class="fa-solid fa-check text-[9px]"></i>';
      }
      const si = document.getElementById("si-" + i);
      if (si) si.className = "step-item done";
    }
  } else {
    alert(result.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane text-[12px]"></i> Réessayer';
    }
    if (wrap) wrap.classList.add("hidden");
  }
}

/**
 * Placeholder for map logic
 */
function simulateMapClick() {
  const mapBtn = document.getElementById("map-btn");
  if (mapBtn) {
    mapBtn.innerHTML = `
      <i class="fa-solid fa-location-dot text-green-mid text-3xl"></i>
      <div class="text-center">
        <p class="text-[13px] font-bold text-green-mid">📍 Lieu sélectionné</p>
        <p class="text-[11px] text-textMuted">Cliquez pour repositionner</p>
      </div>`;
  }
}

// Global exposure for non-module scripts if needed
window.copyRef = function() {
  const ref = document.getElementById("decl-ref").textContent;
  navigator.clipboard.writeText(ref).then(() => alert("Référence copiée !"));
};

import { createLostDeclaration } from '../services/api.js';

/**
 * Lost Declaration Module
 * Handles UI interactions and API submission for lost documents.
 */

/* ════════════════════════════════════════
   MÉTADONNÉES PAR TYPE DE DOCUMENT
════════════════════════════════════════ */
export const DOC_META = {
  cni: {
    label:"Carte d'identité", icon:'fa-id-card', color:'#3B82F6',
    fields:[
      { id:'titulaire', label:'Nom du titulaire', type:'text', placeholder:'Nom complet sur le document', icon:'fa-user', optional:false },
      { id:'date_naissance', label:'Date de naissance', type:'date', icon:'fa-cake-candles', optional:false },
      { id:'numero',    label:'Numéro du document', type:'text', placeholder:'Ex: CMR1234567', icon:'fa-barcode', optional:true },
      { id:'expiration',label:"Date d'expiration", type:'date', placeholder:'', icon:'fa-calendar', optional:true },
      { id:'pays',      label:'Pays émetteur', type:'select', icon:'fa-earth-africa', optional:false,
        options:['Cameroun','Sénégal','Côte d\'Ivoire','Mali','Gabon','RD Congo','France','Autre…'] },
      { id:'desc',      label:'Description physique', type:'textarea', placeholder:'Couleur, état, particularités…', icon:'', optional:true },
    ]
  },
  passeport: {
    label:'Passeport', icon:'fa-passport', color:'#8B5CF6',
    fields:[
      { id:'titulaire', label:'Nom du titulaire', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'date_naissance', label:'Date de naissance', type:'date', icon:'fa-cake-candles', optional:false },
      { id:'numero',    label:'Numéro de passeport', type:'text', placeholder:'Ex: P1234567', icon:'fa-barcode', optional:true },
      { id:'expiration',label:"Date d'expiration", type:'date', placeholder:'', icon:'fa-calendar', optional:true },
      { id:'pays',      label:'Pays émetteur', type:'select', icon:'fa-earth-africa', optional:false,
        options:['Cameroun','Sénégal','Côte d\'Ivoire','Mali','Gabon','RD Congo','France','Autre…'] },
      { id:'desc',      label:'Description physique', type:'textarea', placeholder:'Couleur, état, particularités…', icon:'', optional:true },
    ]
  },
  permis: {
    label:'Permis de conduire', icon:'fa-car-side', color:'#F59E0B',
    fields:[
      { id:'titulaire', label:'Nom du titulaire', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'numero',    label:'Numéro du permis', type:'text', placeholder:'Ex: PC-23-0012345', icon:'fa-barcode', optional:true },
      { id:'categorie', label:'Catégorie', type:'select', icon:'fa-layer-group', optional:true,
        options:['A (Moto)','B (Voiture)','C (Poids lourd)','D (Bus)','BE','CE','Autre'] },
      { id:'expiration',label:"Date d'expiration", type:'date', placeholder:'', icon:'fa-calendar', optional:true },
      { id:'pays',      label:'Pays émetteur', type:'select', icon:'fa-earth-africa', optional:false,
        options:['Cameroun','Sénégal','Côte d\'Ivoire','Mali','Gabon','France','Autre…'] },
      { id:'desc',      label:'Description physique', type:'textarea', placeholder:'Couleur, état…', icon:'', optional:true },
    ]
  },
  acte: {
    label:'Acte de naissance', icon:'fa-file-lines', color:'#10B981',
    fields:[
      { id:'titulaire', label:'Nom de la personne concernée', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'date_naissance', label:'Date de naissance', type:'date', icon:'fa-cake-candles', optional:false },
      { id:'numero',    label:'Numéro de l\'acte', type:'text', placeholder:'Ex: 2024-YDE-000123', icon:'fa-hashtag', optional:true },
      { id:'dateEtab',  label:'Date d\'établissement', type:'date', placeholder:'', icon:'fa-calendar', optional:true },
      { id:'commune',   label:'Commune / Mairie émettrice', type:'text', placeholder:'Ex: Mairie de Yaoundé 1er', icon:'fa-building', optional:false },
      { id:'desc',      label:'Observations', type:'textarea', placeholder:'Annotations, état du document…', icon:'', optional:true },
    ]
  },
  banque: {
    label:'Carte bancaire', icon:'fa-credit-card', color:'#EF4444',
    fields:[
      { id:'titulaire', label:'Nom du titulaire', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'derniers',  label:'4 derniers chiffres', type:'text', placeholder:'Ex: 4521', icon:'fa-hashtag', optional:true },
      { id:'banque',    label:'Banque émettrice', type:'text', placeholder:'Ex: Afriland First Bank, UBA…', icon:'fa-building-columns', optional:false },
      { id:'expiration',label:"Date d'expiration", type:'month', placeholder:'MM/AA', icon:'fa-calendar', optional:true },
      { id:'desc',      label:'Description', type:'textarea', placeholder:'Couleur, type Visa/Mastercard…', icon:'', optional:true },
    ]
  },
  titre: {
    label:'Titre foncier', icon:'fa-house', color:'#6366F1',
    fields:[
      { id:'titulaire', label:'Nom du propriétaire', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'numero',    label:'Numéro de parcelle', type:'text', placeholder:'Ex: TF/2345/B', icon:'fa-hashtag', optional:true },
      { id:'localisation', label:'Localisation du bien', type:'text', placeholder:'Ex: Bastos, Yaoundé', icon:'fa-map-pin', optional:false },
      { id:'superficie',label:'Superficie (m²)', type:'number', placeholder:'Ex: 500', icon:'fa-ruler-combined', optional:true },
      { id:'desc',      label:'Description', type:'textarea', placeholder:'État, particularités du document…', icon:'', optional:true },
    ]
  },
  diplome: {
    label:'Diplôme', icon:'fa-graduation-cap', color:'#EC4899',
    fields:[
      { id:'titulaire', label:'Nom du diplômé', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'etablissement', label:'Établissement', type:'text', placeholder:'Ex: Université de Yaoundé 1', icon:'fa-school', optional:false },
      { id:'specialite',label:'Specialité / Filière', type:'text', placeholder:'Ex: Droit privé, Médecine…', icon:'fa-book', optional:true },
      { id:'annee',     label:'Année d\'obtention', type:'number', placeholder:'Ex: 2022', icon:'fa-calendar', optional:true },
      { id:'desc',      label:'Description', type:'textarea', placeholder:'État, couleur, mentions…', icon:'', optional:true },
    ]
  },
  autre: {
    label:'Autre document', icon:'fa-folder', color:'#9CA3AF',
    fields:[
      { id:'typePrec',  label:'Type précis du document', type:'text', placeholder:'Ex: Carte grise, Carte d\'étudiant…', icon:'fa-file', optional:false },
      { id:'titulaire', label:'Nom du titulaire', type:'text', placeholder:'Nom complet', icon:'fa-user', optional:false },
      { id:'numero',    label:'Numéro ou référence', type:'text', placeholder:'Numéro si disponible', icon:'fa-barcode', optional:true },
      { id:'desc',      label:'Description', type:'textarea', placeholder:'Couleur, état, particularités…', icon:'', optional:true },
    ]
  },
};

/* ════ ÉTAT ════ */
let isThirdParty = false;
const selectedDocs = [];
let activeDocIdx = 0;
let currentStep = 1;
const totalSteps = 6;
let checked = false;
export let lastDeclarationData = null;

/**
 * Initialize the module
 */
export function initLostDeclaration() {
  window.selectOwner = selectOwner;
  window.toggleDocType = toggleDocType;
  window.removeDoc = removeDoc;
  window.goToNextStep = goToNextStep;
  window.goToPrevStep = goToPrevStep;
  window.jumpToDoc = jumpToDoc;
  window.selectPlace = selectPlace;
  window.setUrgency = setUrgency;
  window.toggleReward = toggleReward;
  window.toggleCheckbox = toggleCheckbox;
  window.previewFile = previewFile;
  window.dragOver = dragOver;
  window.dragLeave = dragLeave;
  window.dropFile = dropFile;
  window.submitDeclaration = submitDeclaration;
  window.closeConfirmModal = closeConfirmModal;
  window.validateAndSubmit = validateAndSubmit;
  window.downloadDeclarationPdf = downloadDeclarationPdf;

  // Initial load
  const sessionRaw = localStorage.getItem("docmaster_user_session");
  if (sessionRaw) {
    try {
      window.USER_SESSION = JSON.parse(sessionRaw);
    } catch(e) {}
  }

  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('lossDate');
  if (dateInput) dateInput.value = today;

  // Pre-fill contact if session exists
  if (window.USER_SESSION) {
    const phoneInput = document.querySelector('input[type="tel"]');
    const emailInput = document.querySelector('input[type="email"]');
    if (phoneInput && window.USER_SESSION.telephone) phoneInput.value = window.USER_SESSION.telephone;
    if (emailInput && window.USER_SESSION.email) emailInput.value = window.USER_SESSION.email;
  }

  showStep(1);

  // URL params
  const urlParams = new URLSearchParams(window.location.search);
  const docType = urlParams.get('doc');
  if (docType && DOC_META[docType]) {
    const card = document.querySelector(`.doc-card[onclick*="'${docType}'"]`);
    if (card) toggleDocType(card, docType);
  }
}

function selectOwner(type){
  isThirdParty = (type === 'other');
  document.getElementById('ownerMe').classList.toggle('selected', type==='me');
  document.getElementById('ownerOther').classList.toggle('selected', type==='other');
  
  Object.keys(DOC_META).forEach(key => {
    const fields = DOC_META[key].fields;
    const existingLien = fields.find(f => f.id === 'lien_parente');
    if(isThirdParty && !existingLien){
      fields.splice(1, 0, { id:'lien_parente', label:'Lien avec le titulaire', type:'select', icon:'fa-people-arrows', optional:false, options:['Enfant','Époux/Épouse','Parent','Frère/Sœur','Employé','Ami','Autre'] });
    } else if(!isThirdParty && existingLien){
      const lIdx = fields.indexOf(existingLien);
      fields.splice(lIdx, 1);
    }
  });

  if(currentStep === 3) buildStep2('right');
}

function toggleDocType(card, type){
  const idx = selectedDocs.indexOf(type);
  if(idx > -1){
    selectedDocs.splice(idx,1);
    card.classList.remove('selected');
  } else {
    selectedDocs.push(type);
    card.classList.add('selected');
  }
  renderSelectionUI();
  updateRecapSidebar();
}

function renderSelectionUI(){
  const info = document.getElementById('selectionInfo');
  const tags = document.getElementById('selectionTags');
  const count = selectedDocs.length;
  if(count === 0){ info.style.display='none'; tags.innerHTML=''; return; }
  info.style.display='flex';
  document.getElementById('selCount').textContent = count;
  document.getElementById('selText').textContent = count > 1 ? 'documents sélectionnés' : 'document sélectionné';
  tags.innerHTML = selectedDocs.map(type => {
    const m = DOC_META[type];
    return `<span class="sel-tag" onclick="removeDoc('${type}')">
      <i class="fa-solid ${m.icon}"></i> ${m.label} <i class="fa-solid fa-xmark"></i>
    </span>`;
  }).join('');
}

function removeDoc(type){
  const idx = selectedDocs.indexOf(type);
  if(idx > -1) selectedDocs.splice(idx,1);
  document.querySelectorAll('.doc-type-card').forEach(c=>{
    if(c.getAttribute('onclick') && c.getAttribute('onclick').includes(`'${type}'`)) c.classList.remove('selected');
  });
  renderSelectionUI();
  updateRecapSidebar();
}

function updateRecapSidebar(){
  const el = document.getElementById('recapDocList');
  if(!el) return;
  if(selectedDocs.length === 0){
    el.innerHTML='<span style="font-size:11px;color:rgba(255,255,255,.4);font-style:italic;">Aucun sélectionné</span>';
    return;
  }
  el.innerHTML = selectedDocs.map(type => {
    const m = DOC_META[type];
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,.08);border-radius:10px;">
      <i class="fa-solid ${m.icon}" style="color:#F5A64B;font-size:13px;width:16px;text-align:center;"></i>
      <span style="font-size:11.5px;font-weight:600;color:white;">${m.label}</span>
    </div>`;
  }).join('');
}

function buildStep2(direction){
  if(selectedDocs.length === 0) return;
  const type = selectedDocs[activeDocIdx];
  const meta = DOC_META[type];
  const total = selectedDocs.length;

  document.getElementById('step2Title').textContent = `Détails : ${meta.label}`;
  document.getElementById('step2Sub').textContent = total > 1
    ? `Renseignez les infos de ce document. Vous passerez au suivant après.`
    : `Renseignez les informations connues.`;
  document.getElementById('currentDocIcon').innerHTML = `<i class="fa-solid ${meta.icon}" style="color:${meta.color};font-size:16px;"></i>`;
  document.getElementById('currentDocName').textContent = meta.label;
  document.getElementById('currentDocCounter').textContent = total > 1 ? `Document ${activeDocIdx+1} / ${total}` : '';

  const subProg = document.getElementById('docSubProgress');
  if(total > 1){
    subProg.style.display='block';
    document.getElementById('docSubProgressBar').style.width = `${((activeDocIdx+1)/total)*100}%`;
  } else {
    subProg.style.display='none';
  }

  const tabs = document.getElementById('docTabs');
  if(total > 1){
    tabs.style.display='block';
    document.getElementById('docTabsInner').innerHTML = selectedDocs.map((t,i) => {
      const m2 = DOC_META[t];
      const cls = i < activeDocIdx ? 'done' : (i === activeDocIdx ? 'active' : '');
      const icon = i < activeDocIdx ? 'fa-check' : `fa-solid ${m2.icon}`;
      return `<button type="button" class="doc-nav-tab ${cls}" onclick="jumpToDoc(${i})">
        <span class="tab-num">${i < activeDocIdx ? '<i class="fa-solid fa-check" style="font-size:8px;"></i>' : (i+1)}</span>
        <i class="fa-solid ${m2.icon}" style="font-size:11px;"></i>
        ${m2.label}
      </button>`;
    }).join('');
  } else {
    tabs.style.display='none';
  }

  const container = document.getElementById('dynamicFields');
  const animClass = direction === 'left' ? 'slide-left' : 'slide-right';
  
  let html = `<div class="${animClass}"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">`;
  let inGrid = true;
  
  meta.fields.forEach(f => {
    let defaultValue = '';
    if (!isThirdParty && window.USER_SESSION) {
      if (f.id === 'titulaire') defaultValue = `${window.USER_SESSION.prenom || ''} ${window.USER_SESSION.nom || ''}`.trim();
      if (f.id === 'date_naissance' && window.USER_SESSION.date_naissance) {
        defaultValue = window.USER_SESSION.date_naissance.split('T')[0];
      }
    }

    if(f.type === 'textarea'){
      if(inGrid){ html += '</div>'; inGrid=false; }
      html += buildField(f, 'margin-top:14px;', defaultValue);
    } else {
      if(!inGrid){ html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'; inGrid=true; }
      html += buildField(f, '', defaultValue);
    }
  });
  if(inGrid) html += '</div></div>';
  container.innerHTML = html;

  if (typeof flatpickr !== 'undefined') {
    flatpickr(container.querySelectorAll('input[type="date"]'), {
      locale: "fr",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d F Y",
      allowInput: true
    });
  }
}

function buildField(f, extra, defaultValue = ''){
  const optBadge = f.optional ? `<span class="opt-badge">Optionnel</span>` : '';
  const iconHtml = f.icon ? `<i class="fa-solid ${f.icon} field-icon"></i>` : '';
  const noIcon   = !f.icon ? ' no-icon' : '';
  const valAttr  = defaultValue ? `value="${defaultValue}"` : '';

  if(f.type === 'select'){
    const opts = (f.options || []).map(o => `<option value="${o}" ${o===defaultValue?'selected':''}>${o}</option>`).join('');
    return `<div class="field-group" style="${extra}">
      <label class="field-label"><i class="fa-solid ${f.icon}" style="color:#F5A64B;font-size:10px;"></i> ${f.label} ${optBadge}</label>
      <div class="field-wrapper">
        ${iconHtml}
        <select class="field-input"><option value="">Sélectionner…</option>${opts}</select>
        <i class="fa-solid fa-chevron-down" style="position:absolute;right:14px;color:#C4BAB0;font-size:11px;pointer-events:none;"></i>
      </div>
    </div>`;
  }
  if(f.type === 'textarea'){
    return `<div class="field-group" style="${extra}">
      <label class="field-label">${f.icon ? `<i class="fa-solid ${f.icon}" style="color:#F5A64B;font-size:10px;"></i>` : ''} ${f.label} ${optBadge}</label>
      <div class="field-wrapper"><textarea class="field-input no-icon" placeholder="${f.placeholder}">${defaultValue}</textarea></div>
    </div>`;
  }
  return `<div class="field-group" style="${extra}">
    <label class="field-label">${f.icon ? `<i class="fa-solid ${f.icon}" style="color:#F5A64B;font-size:10px;"></i>` : ''} ${f.label} ${optBadge}</label>
    <div class="field-wrapper">${iconHtml}<input type="${f.type}" class="field-input${noIcon}" placeholder="${f.placeholder||''}" ${valAttr}/></div>
  </div>`;
}

function jumpToDoc(idx){
  const dir = idx > activeDocIdx ? 'right' : 'left';
  activeDocIdx = idx;
  buildStep2(dir);
}

function showStep(step){
  currentStep=Math.max(1,Math.min(totalSteps,step));
  document.querySelectorAll('.form-step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===currentStep));
  updateProgressUI();
  document.getElementById('formLeft').scrollTop=0;
  if(currentStep===3){ activeDocIdx=0; buildStep2('right'); }
  if(currentStep===6) fillSummary();
}

function updateProgressUI(){
  for(let i=1;i<=totalSteps;i++){
    const dot=document.getElementById(`ps${i}`);
    if(!dot) continue;
    dot.className='progress-dot';
    if(i<currentStep)       { dot.classList.add('done');    dot.innerHTML='<i class="fa-solid fa-check" style="font-size:9px;"></i>'; }
    else if(i===currentStep){ dot.classList.add('current'); dot.textContent=String(i); }
    else                    { dot.textContent=String(i); }
    if(i<totalSteps){ const l=document.getElementById(`pl${i}`); if(l) l.className=i<currentStep?'progress-vline done':'progress-vline'; }
  }
  document.getElementById('progressBar').style.width=`${(currentStep/totalSteps)*100}%`;
  document.getElementById('stepCounter').textContent=`Étape ${currentStep} / ${totalSteps}`;
  const prev=document.getElementById('prevStepBtn'),next=document.getElementById('nextStepBtn'),actions=document.getElementById('stepActions');
  prev.disabled=currentStep===1; prev.style.opacity=currentStep===1?'0.45':'1';
  next.style.display=currentStep===totalSteps?'none':'flex';
  actions.classList.toggle('active',currentStep===totalSteps);
}

function goToNextStep(){
  if(currentStep===1){
    const me = document.getElementById('ownerMe').classList.contains('selected');
    const other = document.getElementById('ownerOther').classList.contains('selected');
    if(!me && !other) return;
  }
  if(currentStep===2 && selectedDocs.length===0) return;
  
  if(currentStep === 3 && activeDocIdx < selectedDocs.length - 1){
    jumpToDoc(activeDocIdx + 1);
    return;
  }

  if(currentStep < totalSteps) showStep(currentStep+1);
}

function goToPrevStep(){
  if(currentStep===3 && activeDocIdx > 0){ jumpToDoc(activeDocIdx-1); return; }
  if(currentStep>1) showStep(currentStep-1);
}

function selectPlace(btn){ document.querySelectorAll('.place-tag').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }

function setUrgency(level,btn){ 
  document.querySelectorAll('.urgency-btn').forEach(b=>b.className='urgency-btn'); 
  btn.classList.add('sel-'+level); 
  const urgTexts={low:'Situation non urgente, quelques semaines acceptables.',medium:'Document important, situation gérable sous quelques jours.',high:'URGENT — Ce document est indispensable dès maintenant !'};
  document.getElementById('urgencyDesc').textContent=urgTexts[level]; 
}

function toggleReward(on){ 
  document.getElementById('rewardField').style.display=on?'block':'none'; 
  document.getElementById('rewardSlider').style.background=on?'#F5A64B':'#E0D5C4'; 
  document.getElementById('rewardThumb').style.transform=on?'translateX(20px)':'translateX(0)'; 
}

function toggleCheckbox(){ 
  checked=!checked; 
  const ui=document.getElementById('checkboxUI'),icon=document.getElementById('checkIcon'); 
  ui.style.background=checked?'#1E3A2F':'white'; 
  ui.style.borderColor=checked?'#1E3A2F':'#E0D5C4'; 
  icon.style.display=checked?'block':'none'; 
}

function previewFile(input,previewId,zoneId,textId,iconId){ 
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    document.getElementById(previewId).src=e.target.result;
    document.getElementById(previewId).style.display='block';
    document.getElementById(textId).style.display='none';
    document.getElementById(iconId).style.display='none';
    document.getElementById(zoneId).classList.add('has-file');
  };
  reader.readAsDataURL(file); 
}

function dragOver(e,z){e.preventDefault();z.classList.add('dragover')} 
function dragLeave(z){z.classList.remove('dragover')}
function dropFile(e,z,previewId){
  e.preventDefault();
  z.classList.remove('dragover');
  const file=e.dataTransfer.files[0];
  if(!file||!file.type.startsWith('image/'))return;
  const reader=new FileReader();
  reader.onload=ev=>{
    document.getElementById(previewId).src=ev.target.result;
    document.getElementById(previewId).style.display='block';
    z.classList.add('has-file');
  };
  reader.readAsDataURL(file);
}

function fillSummary(){
  const data = collectDeclarationData('DRAFT');
  document.getElementById('summary-type').textContent = data.documents;
  document.getElementById('summary-date').textContent = data.datePerte;
  document.getElementById('summary-lieu').textContent = data.lieu;
}

function collectDeclarationData(ref) {
  const docs = selectedDocs.map(key => DOC_META[key].label).join(', ');
  const datePerte = document.getElementById('lossDate')?.value || '';
  let lieu = document.getElementById('lossPlace')?.value || '';
  const lieuEl = document.querySelector('.place-tag.active');
  if(!lieu && lieuEl) lieu = lieuEl.textContent.trim();

  return {
    ref: ref,
    datePerte: datePerte,
    documents: docs,
    lieu: lieu || 'Non précisé',
  };
}

function submitDeclaration() {
  if (!checked) {
    const ui = document.getElementById('checkboxUI');
    ui.style.borderColor = '#ef4444';
    setTimeout(() => ui.style.borderColor = '#E0D5C4', 2000);
    return;
  }
  document.getElementById('confirmOverlay').classList.add('show');
}

function closeConfirmModal() {
  document.getElementById('confirmOverlay').classList.remove('show');
}

async function validateAndSubmit() {
  const passInput = document.getElementById('confirmPassword');
  const btn = document.getElementById('finalSubmitBtn');

  if (passInput.value.length < 4) {
    alert("Veuillez saisir votre code secret.");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';

  try {
    const formData = new FormData();
    const type = selectedDocs[0];
    formData.append('doc_type', type);
    
    // Collect from all fields (one doc for now as backend supports single)
    const container = document.getElementById('dynamicFields');
    const inputs = container.querySelectorAll('input, select, textarea');
    DOC_META[type].fields.forEach((f, idx) => {
      if(inputs[idx]) {
        let key = f.id;
        if(key === 'titulaire') key = 'owner_name';
        if(key === 'numero') key = 'document_number';
        formData.append(key, inputs[idx].value);
      }
    });

    formData.append('date_perte', document.getElementById('lossDate').value);
    
    let lieu = document.getElementById('lossPlace')?.value || '';
    const lieuEl = document.querySelector('.place-tag.active');
    if(!lieu && lieuEl) lieu = lieuEl.textContent.trim();
    formData.append('ville', lieu);

    const circ = document.getElementById('lossDesc')?.value || '';
    formData.append('description', circ);

    const phoneEl = document.querySelector('input[type="tel"]');
    const emailEl = document.querySelector('input[type="email"]');
    if(phoneEl) formData.append('telephone_contact', phoneEl.value);
    if(emailEl) formData.append('email_contact', emailEl.value);
    
    const urgEl = document.querySelector('.urgency-btn.sel-low, .urgency-btn.sel-medium, .urgency-btn.sel-high');
    formData.append('urgence_niveau', urgEl ? urgEl.textContent.trim() : 'Modérée');

    const rewardAmtEl = document.querySelector('#rewardField input[type="number"]');
    if(rewardAmtEl && rewardAmtEl.parentElement.style.display !== 'none') {
      formData.append('recompense_montant', rewardAmtEl.value);
    }

    const fileRecto = document.getElementById('fileRecto')?.files[0];
    const fileVerso = document.getElementById('fileVerso')?.files[0];
    if(fileRecto) formData.append('photo_recto', fileRecto);
    if(fileVerso) formData.append('photo_verso', fileVerso);

    const result = await createLostDeclaration(formData);

    if (result.success) {
      closeConfirmModal();
      document.getElementById('refNumber').textContent = result.data.data.identifiant_doc_dm || 'DOC-SUCCESS';
      document.getElementById('successOverlay').classList.add('show');
    } else {
      throw new Error(result.message || "Erreur lors de l'enregistrement");
    }
  } catch (error) {
    alert("Erreur: " + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Confirmer';
  }
}

function downloadDeclarationPdf() {
  alert('Téléchargement du récépissé de déclaration...');
}

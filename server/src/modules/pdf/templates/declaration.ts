import type { DeclarationPdfParams, DeclarationPdfData } from '../pdf.types.ts';

// ─── Identité visuelle (Simplifiée et plus institutionnelle) ───────────────────
const C = {
  primary: '#1B4332',
  gray: '#4B5563',
  lightGray: '#9CA3AF',
  black: '#000000',
  border: '#374151',
  bg: '#FFFFFF', // Fond blanc pour l'impression professionnelle
  bgAlt: '#F3F4F6', // Fond gris léger pour les en-têtes de section
};

const STATUS_META: Record<string, string> = {
  AVAILABLE: 'DISPONIBLE / AVAILABLE',
  MATCHED: 'CORRESPONDANCE / MATCHED',
  PENDING: 'EN ATTENTE / PENDING',
  RETURNED: 'RESTITUÉ / RETURNED',
  RECOVERED: 'RÉCUPÉRÉ / RECOVERED',
  SEARCHING: 'EN RECHERCHE / SEARCHING',
  CANCELLED: 'ANNULÉ / CANCELLED',
  CLAIMED: 'RÉCLAMÉ / CLAIMED',
  FOUND: 'TROUVÉ / FOUND',
};

const MODE_CONTACT: Record<string, string> = {
  PHONE: 'Téléphone / Phone',
  EMAIL: 'E-mail / Email',
  APP_CHAT: 'Chat intégré / App Chat',
  WHATSAPP: 'WhatsApp',
};

const URGENCE: Record<string, string> = {
  Faible: 'FAIBLE / LOW',
  MODEREE: 'MODÉRÉE / MODERATE',
  'Modérée': 'MODÉRÉE / MODERATE',
  Eleve: 'ÉLEVÉE / HIGH',
  'Élevée': 'ÉLEVÉE / HIGH',
  Urgente: 'URGENTE / URGENT',
  CRITIQUE: 'CRITIQUE / CRITICAL',
};

const KNOWN_META_KEYS = new Set([
  'date_naissance',
  'lieu_naissance',
  'date_delivrance',
  'numero',
  'titulaire',
  'date_expiration',
  'ville',
  'sexe',
  'nationalite',
]);

// ─── Helpers ───────────────────────────────────────────────────────────────────
function esc(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function raw(v: any): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function fmtDate(v: any): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return raw(v);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(v: any): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return raw(v);
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function humanizeKey(key: string): string {
  const labels: Record<string, string> = {
    banque_nom: 'BANQUE / BANK',
    intitule: 'INTITULÉ / TITLE',
    specialite: 'SPÉCIALITÉ / SPECIALTY',
    annee: "ANNÉE D'OBTENTION / YEAR",
    adresse: 'ADRESSE / ADDRESS',
    sexe: 'SEXE / GENDER',
    nationalite: 'NATIONALITÉ / NATIONALITY',
    profession: 'PROFESSION / OCCUPATION',
    numero: 'NUMÉRO / NUMBER',
    titulaire: 'TITULAIRE / HOLDER',
  };
  if (labels[key]) return labels[key];
  return key.replace(/_/g, ' ').toUpperCase();
}

function gps(v: any): string {
  if (!v) return '—';
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return gps(p);
    } catch {
      return raw(v);
    }
  }
  if (typeof v === 'object' && (v.lat !== undefined || v.lon !== undefined)) {
    const lat = typeof v.lat === 'number' ? v.lat.toFixed(6) : v.lat;
    const lon = typeof v.lon === 'number' ? v.lon.toFixed(6) : v.lon;
    return `${lat}, ${lon}`;
  }
  return raw(v);
}

// ─── Code Barre (Simulation visuelle) ──────────────────────────────────────────
function generateBarcodeSvg(): string {
  // Génère un motif aléatoire mais fixe pour simuler un code-barres comme sur le doc officiel
  return `<svg width="180" height="30" preserveAspectRatio="none" viewBox="0 0 180 30" style="display:block;">
    ${Array.from({length: 60}).map((_, i) => {
      const w = Math.random() > 0.5 ? 1 : 2.5;
      const x = i * 3;
      return `<rect x="${x}" y="0" width="${w}" height="30" fill="#000"/>`;
    }).join('')}
  </svg>`;
}

// ─── Template principal ────────────────────────────────────────────────────────
export function renderDeclarationTemplate(params: DeclarationPdfParams): string {
  const { declarationType, documentType, declaration, options } = params;
  const isLost = declarationType !== 'FOUND';
  const generatedAt = fmtDateTime(options?.generatedAt || new Date());

  const certified = !!options?.certified;
  const certifierName = options?.certifierName || declaration.certified_by_name || 'Autorité DocMaster';
  const certDate = fmtDate(declaration.certified_at || (certified ? new Date() : null));

  const ref =
    declaration.identifiant_doc_dm && declaration.identifiant_doc_dm !== ''
      ? declaration.identifiant_doc_dm
      : (declaration.id || '').slice(0, 8).toUpperCase() || 'DM-000000';

  const docTypeNom = documentType.nom ? documentType.nom.toUpperCase() : 'DOCUMENT';
  const statusLabel = STATUS_META[String(declaration.status || '').toUpperCase()] || STATUS_META.PENDING;

  const d = declaration;
  const metadata: Record<string, any> = d.metadata && typeof d.metadata === 'object' ? d.metadata : {};
  const dateNaissance = d.date_naissance || metadata.date_naissance;
  const lieuNaissance = d.lieu_naissance || metadata.lieu_naissance;
  const dateDelivrance = d.date_delivrance || metadata.date_delivrance;

  const extraMeta: Array<[string, string]> = Object.entries(metadata)
    .filter(([k]) => !KNOWN_META_KEYS.has(k))
    .filter(([, v]) => v !== null && v !== undefined && String(v) !== '')
    .map(([k, v]) => [humanizeKey(k), String(v)]);

  const gpsLoc = d.found_location ? gps(d.found_location) : null;
  const dateDeclaree = fmtDate(d.date_perte);
  const dateDeclaration = fmtDateTime(d.created_at);
  const modeContact = MODE_CONTACT[String(d.mode_contact || '').toUpperCase()] || (d.mode_contact ? raw(d.mode_contact) : '—');
  const urgence = URGENCE[String(d.urgence_niveau || '')] || (d.urgence_niveau ? raw(d.urgence_niveau) : '—');

  const titleFr = isLost ? 'ATTESTATION DE DÉCLARATION DE PERTE' : 'ATTESTATION DE DÉCLARATION DE DÉCOUVERTE';
  const titleEn = isLost ? 'CERTIFICATE OF LOSS DECLARATION' : 'CERTIFICATE OF FOUND DECLARATION';
  const declarantTitleFr = isLost ? 'INFORMATIONS SUR LE PROPRIÉTAIRE' : 'INFORMATIONS SUR LE TROUVEUR';
  const declarantTitleEn = isLost ? 'OWNER DETAILS' : 'FINDER DETAILS';

  const extraMetaCells = extraMeta
    .map(([k, v]) => `<div class="cell"><div class="lbl">${esc(k)}</div><div class="val">${esc(v)}</div></div>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Arial", "Helvetica Neue", Helvetica, sans-serif;
    background: ${C.bg};
    color: ${C.black};
    font-size: 10px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    padding: 12mm 15mm;
    overflow: hidden;
  }

  /* ── En-tête officiel ── */
  .header-table {
    width: 100%;
    margin-bottom: 20px;
    border-bottom: 2px solid ${C.black};
    padding-bottom: 10px;
  }
  .header-table td { vertical-align: top; }
  .header-center { text-align: center; }
  .republic { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
  .motto { font-size: 8px; font-style: italic; margin-bottom: 5px; }
  .doc-title-fr { font-size: 16px; font-weight: bold; margin-top: 10px; }
  .doc-title-en { font-size: 11px; color: ${C.gray}; margin-bottom: 10px; }
  
  .barcode-container { margin-top: 5px; display: inline-block; }
  .ref-number { font-size: 11px; font-weight: bold; font-family: monospace; letter-spacing: 1px; margin-top: 2px; }

  /* ── Grille de formulaire stricte ── */
  .form-section { margin-bottom: 15px; }
  .sec-title {
    background: ${C.bgAlt};
    border: 1px solid ${C.border};
    padding: 4px 8px;
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
    color: ${C.primary};
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid ${C.border};
    border-top: none;
  }
  .cell {
    border-right: 1px solid ${C.border};
    border-bottom: 1px solid ${C.border};
    padding: 5px 8px;
  }
  .cell:nth-child(4n) { border-right: none; }
  .cell.col-span-2 { grid-column: span 2; }
  .cell.col-span-4 { grid-column: span 4; border-right: none; }
  
  .lbl {
    font-size: 7.5px;
    color: ${C.gray};
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .val {
    font-size: 10.5px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .desc-box {
    border: 1px solid ${C.border};
    border-top: none;
    padding: 8px;
    min-height: 40px;
    font-size: 10px;
  }

  /* ── Pied de page ── */
  .footer {
    position: absolute;
    bottom: 15mm;
    left: 15mm;
    right: 15mm;
    font-size: 8px;
    text-align: center;
    border-top: 1px solid ${C.black};
    padding-top: 5px;
    color: ${C.gray};
  }

  /* ── Signatures ── */
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 20px;
  }
  .sig-box {
    border: 1px solid ${C.border};
    height: 80px;
    position: relative;
    padding: 5px;
  }
  .sig-title {
    font-size: 8px;
    font-weight: bold;
    text-align: center;
  }
  .stamp-placeholder {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 40px;
    height: 40px;
    border: 2px dashed ${C.lightGray};
    border-radius: 50%;
  }

  /* ── Filigrane de certification ── */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-32deg);
    font-size: 74px;
    font-weight: bold;
    letter-spacing: 10px;
    color: rgba(40, 40, 40, 0.07);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Cachet de certification ── */
  .stamp-official {
    position: absolute;
    bottom: 4px;
    right: 5px;
    width: 56px;
    height: 56px;
  }
  .stamp-circle {
    width: 56px;
    height: 56px;
    border: 2.5px solid ${C.primary};
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    transform: rotate(-12deg);
    color: ${C.primary};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .stamp-cert { font-size: 8.5px; font-weight: bold; letter-spacing: 0.5px; }
  .stamp-name { font-size: 4.8px; font-weight: bold; line-height: 1.1; margin-top: 2px; max-width: 46px; }
  .stamp-date { font-size: 4.8px; font-weight: bold; margin-top: 1px; }

</style>
</head>
<body>
  <div class="page">

    ${certified ? '<div class="watermark">CERTIFIÉ</div>' : ''}

    <!-- EN-TÊTE OFFICIEL -->
    <table class="header-table">
      <tr>
        <td width="30%">
          <div class="republic">DOCMASTER</div>
          <div class="motto">Plateforme de gestion documentaire</div>
        </td>
        <td width="40%" class="header-center">
          <div class="doc-title-fr">${titleFr}</div>
          <div class="doc-title-en">${titleEn}</div>
        </td>
        <td width="30%" style="text-align: right;">
          <div class="barcode-container">
            ${generateBarcodeSvg()}
          </div>
          <div class="ref-number">RÉF: ${esc(ref)}</div>
        </td>
      </tr>
    </table>

    <!-- 01 · DÉTAILS DE LA DEMANDE -->
    <div class="form-section">
      <div class="sec-title">DÉTAILS DE LA DÉCLARATION / DECLARATION DETAILS</div>
      <div class="form-grid">
        <div class="cell col-span-2">
          <div class="lbl">DATE DE DÉCLARATION / DECLARATION DATE</div>
          <div class="val">${esc(dateDeclaration)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">STATUT / STATUS</div>
          <div class="val">${esc(statusLabel)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">TYPE DE DEMANDE / APPLICATION REASON</div>
          <div class="val">${isLost ? 'PERTE / LOSS' : 'DÉCOUVERTE / FOUND'}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">NIVEAU D'URGENCE / URGENCY LEVEL</div>
          <div class="val">${esc(urgence)}</div>
        </div>
      </div>
    </div>

    <!-- 02 · INFORMATIONS SUR LE DOCUMENT -->
    <div class="form-section">
      <div class="sec-title">INFORMATIONS SUR LE DOCUMENT / DOCUMENT DETAILS</div>
      <div class="form-grid">
        <div class="cell col-span-2">
          <div class="lbl">TYPE DE DOCUMENT / DOCUMENT TYPE</div>
          <div class="val">${esc(docTypeNom)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">NUMÉRO DU DOCUMENT / DOCUMENT NUMBER</div>
          <div class="val">${esc(d.document_number)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">DATE DE DÉLIVRANCE / DATE OF ISSUANCE</div>
          <div class="val">${esc(fmtDate(dateDelivrance))}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">DATE D'EXPIRATION / DATE OF EXPIRY</div>
          <div class="val">${esc(fmtDate(d.date_expiration))}</div>
        </div>
        <div class="cell col-span-4">
          <div class="lbl">ÉTAT PHYSIQUE / PHYSICAL CONDITION</div>
          <div class="val">${esc(d.etat_physique)}</div>
        </div>
      </div>
    </div>

    <!-- 03 · INFORMATIONS SUR LE DÉCLARANT -->
    <div class="form-section">
      <div class="sec-title">${declarantTitleFr} / ${declarantTitleEn}</div>
      <div class="form-grid">
        <div class="cell col-span-4">
          <div class="lbl">NOM(S) ET PRÉNOM(S) / FULL NAME</div>
          <div class="val">${esc(d.owner_name)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">DATE DE NAISSANCE / DATE OF BIRTH</div>
          <div class="val">${esc(fmtDate(dateNaissance))}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">LIEU DE NAISSANCE / PLACE OF BIRTH</div>
          <div class="val">${esc(lieuNaissance)}</div>
        </div>
        ${d.cni_declarant ? `
        <div class="cell col-span-4">
          <div class="lbl">NUMÉRO DE LA CNI / CNI NUMBER</div>
          <div class="val">${esc(d.cni_declarant)}</div>
        </div>` : ''}
        <div class="cell col-span-2">
          <div class="lbl">NO. DE TÉLÉPHONE / PHONE #</div>
          <div class="val">${esc(d.telephone_contact)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">ADRESSE E-MAIL / E-MAIL ADDRESS</div>
          <div class="val">${esc(d.email_contact)}</div>
        </div>
        <div class="cell col-span-4">
          <div class="lbl">MODE DE CONTACT / PREFERRED CONTACT</div>
          <div class="val">${esc(modeContact)}</div>
        </div>
        ${extraMetaCells}
      </div>
    </div>

    <!-- 04 · LOCALISATION & CIRCONSTANCES -->
    <div class="form-section">
      <div class="sec-title">LIEU DE RÉSIDENCE ET CIRCONSTANCES / PLACE OF RESIDENCE & CIRCUMSTANCES</div>
      <div class="form-grid">
        <div class="cell">
          <div class="lbl">PAYS / COUNTRY</div>
          <div class="val">${esc(d.pays || 'CAMEROUN')}</div>
        </div>
        <div class="cell">
          <div class="lbl">RÉGION / REGION</div>
          <div class="val">${esc(d.region)}</div>
        </div>
        <div class="cell">
          <div class="lbl">DÉPARTEMENT / DEPARTMENT</div>
          <div class="val">${esc(d.department)}</div>
        </div>
        <div class="cell">
          <div class="lbl">VILLE / CITY</div>
          <div class="val">${esc(d.ville)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">QUARTIER / NEIGHBORHOOD</div>
          <div class="val">${esc(d.quartier)}</div>
        </div>
        <div class="cell col-span-2">
          <div class="lbl">DATE DE PERTE/DÉCOUVERTE / DATE OF INCIDENT</div>
          <div class="val">${esc(dateDeclaree)}</div>
        </div>
        ${gpsLoc ? `
        <div class="cell col-span-4">
          <div class="lbl">COORDONNÉES GPS / GPS COORDINATES</div>
          <div class="val">${esc(gpsLoc)}</div>
        </div>` : ''}
      </div>
      <div class="desc-box">
        <div class="lbl">DESCRIPTION DÉTAILLÉE / DETAILED DESCRIPTION</div>
        ${d.description ? esc(d.description) : 'AUCUNE CIRCONSTANCE DÉTAILLÉE FOURNIE / NO DETAILED CIRCUMSTANCES PROVIDED'}
      </div>
    </div>

    <!-- SIGNATURES -->
    <div class="sig-grid">
      <div class="sig-box">
        <div class="sig-title">SIGNATURE DU DÉCLARANT / APPLICANT'S SIGNATURE</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">CACHET DOCMASTER / DOCMASTER STAMP</div>
        ${certified ? `
        <div class="stamp-official">
          <div class="stamp-circle">
            <div class="stamp-cert">CERTIFIÉ</div>
            <div class="stamp-name">${esc(certifierName)}</div>
            <div class="stamp-date">${esc(certDate)}</div>
          </div>
        </div>` : '<div class="stamp-placeholder"></div>'}
      </div>
    </div>

    <!-- PIED DE PAGE -->
    <div class="footer">
      CE DOCUMENT EST GÉNÉRÉ ÉLECTRONIQUEMENT. VEUILLEZ VOUS PRÉSENTER AVEC CE DOCUMENT IMPRIMÉ LORS DE VOS DÉMARCHES.<br/>
      THIS DOCUMENT IS GENERATED ELECTRONICALLY. PLEASE PRESENT THIS PRINTED DOCUMENT DURING YOUR PROCEDURES.<br/>
      Généré le / Generated on : ${esc(generatedAt)}
    </div>

  </div>
</body>
</html>`;
}
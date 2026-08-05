import PDFDocument from 'pdfkit';
import { Response } from 'express';
import path from 'path';
import fs from 'fs';

// ─── Palette Premium & Minimaliste ────────────────────────────────────────────
const C = {
  primary:    '#1B4332',   // Vert DocMaster profond
  primaryLight: '#E8F5EE', // Vert très clair pour les fonds
  primaryMid:   '#2D6A4F', // Vert moyen
  accent:     '#D98A30',   // Orange DocMaster (éléments d'action)
  black:      '#0F172A',   // Slate 900 (Typographie principale)
  darkGray:   '#334155',   // Slate 700
  gray:       '#64748B',   // Slate 500 (Labels)
  lightGray:  '#94A3B8',   // Slate 400
  border:     '#E2E8F0',   // Slate 200 (Bordures Bento très fines)
  bg:         '#F8FAFC',   // Slate 50 (Fond de section optionnel)
  white:      '#FFFFFF',
  success:    '#10B981',   // Emerald (certifié / trouvé)
  successLight: '#ECFDF5',
  warning:    '#F59E0B',   // Amber (perdu / en recherche)
  warningLight: '#FFFBEB',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function val(v: any, fallback = '—'): string {
  return (v === null || v === undefined || v === '') ? fallback : String(v);
}
function fmtDateShort(d: any): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return String(d); }
}

function resolveLogoPath(): string | null {
  const candidate = path.join(process.cwd(), 'assets', 'pdf', 'docmaster.png');
  if (fs.existsSync(candidate)) return candidate;
  return null;
}

const DOC_TYPE_NOMS: Record<string, string> = {
  'carte-nationale-identite': "Carte Nationale d'Identité",
  'Carte Nationale d\'Identité': "Carte Nationale d'Identité",
  'CNI': "Carte Nationale d'Identité",
  'passeport': 'Passeport',
  'Passeport': 'Passeport',
  'permis-conduire': 'Permis de conduire',
  'Permis de conduire': 'Permis de conduire',
  'carte-grise': 'Carte grise',
  'Carte grise': 'Carte grise',
  'titre-foncier': 'Titre foncier',
  'Titre foncier': 'Titre foncier',
  'diplome': 'Diplôme',
  'Diplôme': 'Diplôme',
  'diploma': 'Diplôme',
};

export class PdfService {
  async generateDeclarationPdf(declaration: any, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 0,
          size: 'A4',
          info: { Title: 'Attestation de Déclaration – DocMaster' },
        });

        doc.pipe(res);

        const PW = 595.28;
        const PH = 841.89;
        const ML = 40;
        const MR = 40;
        const CW = PW - ML - MR;

        // ── Données réelles de la déclaration ──
        const ref = val(declaration?.identifiant_doc_dm && declaration.identifiant_doc_dm !== '' ? declaration.identifiant_doc_dm : (declaration?.id?.substring(0, 8) || 'DM-000000'), 'DM-000000');
        const isLost = declaration?.declaration_type !== 'FOUND';
        const todayLong = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const docType = val(declaration?.docTypeInfo?.nom || declaration?.doc_type, 'Document');
        const docTypeName = DOC_TYPE_NOMS[docType] || docType;
        const status = String(declaration?.status || 'PENDING').toUpperCase();
        const certified = !!declaration?.is_certified;
        const certifier = val(declaration?.certified_by_name, 'Autorité DocMaster');

        // Statut réel avec libellés français
        const STATUS_LABELS: Record<string, string> = {
          AVAILABLE: 'DISPONIBLE', MATCHED: 'CORRESPONDANCE', PENDING: 'EN ATTENTE',
          RETURNED: 'RESTITUÉ', SEARCHING: 'EN RECHERCHE', CANCELLED: 'ANNULÉ',
          CLAIMED: 'RÉCLAMÉ', FOUND: 'TROUVÉ',
        };
        const statusLabel = isLost
          ? (STATUS_LABELS[status] || 'EN RECHERCHE')
          : 'TROUVÉ';
        const statusColor = isLost ? (certified ? C.success : C.warning) : C.success;

        const ownerName = val(declaration?.owner_name, 'Déclarant');
        const fullAddress = [val(declaration?.quartier), val(declaration?.ville), val(declaration?.region), val(declaration?.pays, 'Cameroun')]
          .filter((v) => v !== '—')
          .join(', ') || val(declaration?.ville, '—');

        let y = 30;

        // ─────────────────────────────────────────────────────────────────────
        // 1. EN-TÊTE PREMIUM — LOGO + SLOGAN
        // ─────────────────────────────────────────────────────────────────────
        // Bande supérieure fine verte
        doc.rect(0, 0, PW, 6).fill(C.primary);

        // Logo DocMaster (à gauche)
        const logoPath = resolveLogoPath();
        let logoBlockW = 0;
        if (logoPath) {
          const logoH = 34;
          const logoW = Math.round(logoH * (854 / 278));
          doc.image(logoPath, ML, 20, { width: logoW, height: logoH });
          logoBlockW = logoW + 16;
        }

        // Titre DocMaster + slogan (à gauche du logo)
        doc.font('Helvetica-Bold').fontSize(17).fillColor(C.primary)
          .text('DocMaster', ML + logoBlockW, 18);
        doc.font('Helvetica').fontSize(8.5).fillColor(C.gray)
          .text('Retrouvez vos documents perdus au Cameroun', ML + logoBlockW, 38, { width: 260 });

        // Badge Type (Perdu / Trouvé) — pilule alignée en haut à droite
        const typeW = 78;
        const badgeY = 20;
        doc.roundedRect(PW - MR - typeW, badgeY, typeW, 20, 10)
          .fill(isLost ? C.warning : C.success);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white)
          .text(isLost ? 'PERDU' : 'TROUVÉ', PW - MR - typeW, badgeY + 6.5, { width: typeW, align: 'center' });

        // Référence & date (en dessous du badge)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.black)
          .text(`RÉF : ${ref}`, PW - MR - 180, 44, { width: 180, align: 'right' });
        doc.font('Helvetica').fontSize(7.5).fillColor(C.lightGray)
          .text(`Émis le ${todayLong}`, PW - MR - 180, 58, { width: 180, align: 'right' });

        y = 82;

        // ── Statut (pilule sous l'en-tête)
        doc.roundedRect(ML, y, 118, 20, 10).fill(statusColor);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.white)
          .text(statusLabel, ML, y + 6.5, { width: 118, align: 'center' });
        y += 32;

        // ─────────────────────────────────────────────────────────────────────
        // MOTEUR DE GRILLE BENTO
        // ─────────────────────────────────────────────────────────────────────
        const drawBentoHeader = (title: string, startY: number) => {
          doc.rect(ML, startY, 4, 14).fill(C.accent);
          doc.font('Helvetica-Bold').fontSize(9).fillColor(C.black)
            .text(title.toUpperCase(), ML + 12, startY + 3);
          return startY + 24;
        };

        const drawBentoCell = (cx: number, cy: number, cw: number, ch: number, label: string, value: string) => {
          doc.rect(cx, cy, cw, ch).lineWidth(0.5).strokeColor(C.border).stroke();
          doc.font('Helvetica-Bold').fontSize(6).fillColor(C.gray)
            .text(label.toUpperCase(), cx + 8, cy + 8, { characterSpacing: 0.5 });
          doc.font('Helvetica').fontSize(9).fillColor(C.black)
            .text(value, cx + 8, cy + 20, { width: cw - 16, ellipsis: true });
        };

        let rowH = 40;

        // ─────────────────────────────────────────────────────────────────────
        // 2. IDENTITÉ DU DÉCLARANT
        // ─────────────────────────────────────────────────────────────────────
        y = drawBentoHeader('Identité du déclarant', y);

        y = (() => {
          drawBentoCell(ML, y, CW * 0.6, rowH, 'Nom et prénoms', ownerName);
          drawBentoCell(ML + (CW * 0.6), y, CW * 0.4, rowH, 'N° CNI', val(declaration?.cni_declarant));
          return y + rowH;
        })();

        y = (() => {
          drawBentoCell(ML, y, CW * 0.3, rowH, 'Date de naissance', fmtDateShort(declaration?.date_naissance));
          drawBentoCell(ML + (CW * 0.3), y, CW * 0.35, rowH, 'Téléphone', val(declaration?.telephone_contact));
          drawBentoCell(ML + (CW * 0.65), y, CW * 0.35, rowH, 'Email', val(declaration?.email_contact));
          return y + rowH;
        })();

        y = (() => {
          drawBentoCell(ML, y, CW, rowH, 'Adresse', fullAddress);
          return y + rowH + 20;
        })();

        // ─────────────────────────────────────────────────────────────────────
        // 3. SPÉCIFICATIONS DU DOCUMENT
        // ─────────────────────────────────────────────────────────────────────
        y = drawBentoHeader('Document déclaré', y);

        y = (() => {
          drawBentoCell(ML, y, CW * 0.5, rowH, 'Type de document', docTypeName);
          drawBentoCell(ML + (CW * 0.5), y, CW * 0.5, rowH, 'Numéro du document', val(declaration?.document_number));
          return y + rowH;
        })();

        y = (() => {
          drawBentoCell(ML, y, CW * 0.5, rowH, "Date d'expiration", fmtDateShort(declaration?.date_expiration));
          drawBentoCell(ML + (CW * 0.5), y, CW * 0.5, rowH, 'État physique', val(declaration?.etat_physique, 'Bon'));
          return y + rowH;
        })();

        // ── Circonstances (large) ──
        y = (() => {
          const descH = 56;
          doc.rect(ML, y, CW, descH).lineWidth(0.5).strokeColor(C.border).stroke();
          doc.font('Helvetica-Bold').fontSize(6).fillColor(C.gray)
            .text(isLost ? 'CIRCONSTANCES DE LA PERTE' : 'CIRCONSTANCES DE LA DÉCOUVERTE', ML + 8, y + 8, { characterSpacing: 0.5 });
          doc.font('Helvetica').fontSize(9).fillColor(C.darkGray)
            .text(val(declaration?.description, '—'), ML + 8, y + 20, { width: CW - 16, lineGap: 3 });
          return y + descH;
        })();

        // ── Récompense éventuelle ──
        if (declaration?.recompense_montant && parseFloat(declaration.recompense_montant) > 0) {
          y += 10;
          doc.roundedRect(ML, y, CW, 22, 6).fill(C.warningLight).strokeColor('#FCD34D').lineWidth(0.6).stroke();
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#B45309')
            .text(`RÉCOMPENSE OFFERTE : ${Number(declaration.recompense_montant).toLocaleString('fr-FR')} FCFA`, ML + 14, y + 6, { width: CW - 28 });
          y += 24;
        }

        y += 10;

        // ─────────────────────────────────────────────────────────────────────
        // 4. CERTIFICATION & SIGNATURES
        // ─────────────────────────────────────────────────────────────────────
        const sigY = y;
        const sigW = (CW - 20) / 2;

        // Bloc Signature Déclarant
        doc.roundedRect(ML, sigY, sigW, 78, 6).lineWidth(0.5).strokeColor(C.border).stroke();
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.black)
          .text('SIGNATURE DU DÉCLARANT', ML, sigY + 10, { width: sigW, align: 'center' });
        doc.font('Helvetica-Oblique').fontSize(6).fillColor(C.lightGray)
          .text('Lu et approuvé', ML, sigY + 20, { width: sigW, align: 'center' });
        doc.moveTo(ML + 20, sigY + 55).lineTo(ML + sigW - 20, sigY + 55)
          .lineWidth(0.6).strokeColor(C.primary).stroke();
        doc.font('Helvetica').fontSize(6.5).fillColor(C.darkGray)
          .text(ownerName, ML, sigY + 60, { width: sigW, align: 'center' });

        // Bloc Cachet Plateforme (neutre)
        doc.roundedRect(ML + sigW + 20, sigY, sigW, 78, 6).lineWidth(0.5).strokeColor(C.border).stroke();
        doc.rect(ML + sigW + 20, sigY, sigW, 6).fill(C.primaryLight);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.primary)
          .text('CERTIFICATION DOCMASTER', ML + sigW + 20, sigY + 10, { width: sigW, align: 'center' });

        // Petit tampon discret (toujours présent)
        const stampCX = (ML + sigW + 20) + (sigW / 2);
        const stampCY = sigY + 42;
        doc.circle(stampCX, stampCY, 15).lineWidth(1.2).strokeColor(C.primary).stroke();
        doc.circle(stampCX, stampCY, 12).lineWidth(0.4).strokeColor(C.primary).stroke();
        doc.font('Helvetica-Bold').fontSize(4.5).fillColor(C.primary)
          .text('DOCMASTER', stampCX - 14, stampCY - 6, { width: 28, align: 'center' });
        doc.font('Helvetica').fontSize(4).fillColor(C.primary)
          .text('OFFICIEL', stampCX - 14, stampCY + 1, { width: 28, align: 'center' });
        doc.font('Helvetica').fontSize(3.5).fillColor(C.primary)
          .text(String(new Date().getFullYear()), stampCX - 14, stampCY + 6, { width: 28, align: 'center' });

        y = sigY + 78 + 12;

        // ─────────────────────────────────────────────────────────────────────
        // GRAND CACHET DE CERTIFICATION (apposé sur le document)
        // ─────────────────────────────────────────────────────────────────────
        if (certified) {
          const radius = 58;
          const ccx = (ML + sigW + 20) + (sigW / 2);
          const ccy = sigY + 39;
          const certDate = declaration?.certified_at
            ? fmtDateShort(declaration.certified_at)
            : fmtDateShort(new Date());

          doc.save();
          doc.rotate(-18, { origin: [ccx, ccy] });

          const inner0 = radius - 7;
          const inner1 = radius - 14;
          doc.circle(ccx, ccy, radius + 4).lineWidth(9).strokeColor(C.successLight).stroke();
          doc.circle(ccx, ccy, radius).lineWidth(2.5).strokeColor(C.success).stroke();
          doc.circle(ccx, ccy, inner1).lineWidth(0.6).strokeColor(C.success).stroke();

          // Texte circulaire en haut : DOCMASTER • CERTIFIÉ •
          const topArcText = 'DOCMASTER  ·  CERTIFIÉE  ·  DOCMASTER  ·  CERTIFIÉE';
          const numChars = topArcText.length;
          const startAngle = Math.PI * 1.05; // commencer en bas à gauche pour remonter à droite
          for (let i = 0; i < numChars; i++) {
            const angle = startAngle + (i / (numChars - 1)) * Math.PI * 1.3;
            const x = ccx + radius * Math.cos(angle);
            const ybase = ccy + radius * Math.sin(angle);
            doc.save();
            doc.translate(x, ybase);
            doc.rotate(angle * 180 / Math.PI + 90);
            doc.font('Helvetica-Bold').fontSize(8).fillColor(C.success)
              .text(topArcText[i], 0, -3, { width: 6, align: 'center' });
            doc.restore();
          }

          // Centre : CERTIFIÉ
          doc.font('Helvetica-Bold').fontSize(13).fillColor(C.success)
            .text('CERTIFIÉ', ccx - 28, ccy - 6, { width: 56, align: 'center' });

          // Sous-centre : autorité + date
          doc.save();
          doc.font('Helvetica-Oblique').fontSize(6.5).fillColor(C.success)
            .text(certifier.length > 24 ? certifier.slice(0, 24) + '…' : certifier, ccx - 26, ccy + 8, { width: 52, align: 'center' });
          doc.font('Helvetica-Bold').fontSize(6).fillColor(C.success)
            .text(certDate, ccx - 26, ccy + 15, { width: 52, align: 'center' });
          doc.restore();

          // Étoile décorative en bas
          doc.font('Helvetica-Bold').fontSize(9).fillColor(C.success)
            .text('★', ccx - 3, ccy + 22, { width: 6, align: 'center' });

          doc.restore();
        }

        // ─────────────────────────────────────────────────────────────────────
        // PIED DE PAGE
        // ─────────────────────────────────────────────────────────────────────
        doc.moveTo(ML, y).lineTo(PW - MR, y).lineWidth(0.8).strokeColor(C.primary);
        y += 8;
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.primary)
          .text('DocMaster', ML, y, { continued: true })
          .font('Helvetica').fillColor(C.gray)
          .text('  ·  Plateforme certifiée de gestion documentaire au Cameroun', { continued: false });
        doc.font('Helvetica').fontSize(6).fillColor(C.lightGray)
          .text(`Document généré électroniquement · Référence ${ref} · ${todayLong}`, ML, y + 10, { width: CW, align: 'center' });

        doc.end();
        res.on('finish', () => resolve());
        res.on('error', (err) => reject(err));

      } catch (err) {
        console.error('[PDF Service Error]', err);
        reject(err);
      }
    });
  }
}
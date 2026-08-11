import { pdfRenderer } from './pdf.renderer.ts';
import { renderDeclarationTemplate } from './templates/declaration.ts';
import type { DeclarationPdfParams, DeclarationPdfData, DocumentTypePdf } from './pdf.types.ts';

function mapDeclarationData(declaration: any, declarationType: 'LOST' | 'FOUND'): DeclarationPdfData {
  const metadata: Record<string, any> =
    declaration?.metadata && typeof declaration.metadata === 'object' ? declaration.metadata : {};
  return {
    id: declaration?.id,
    identifiant_doc_dm: declaration?.identifiant_doc_dm,
    declaration_type: declarationType,
    status: declaration?.status,
    is_certified: !!declaration?.is_certified,
    certified_at: declaration?.certified_at,
    certified_by_name: declaration?.certified_by_name,
    owner_name: declaration?.owner_name,
    cni_declarant: declaration?.cni_declarant,
    date_naissance: declaration?.date_naissance || metadata.date_naissance,
    lieu_naissance: metadata.lieu_naissance,
    telephone_contact: declaration?.telephone_contact,
    email_contact: declaration?.email_contact,
    quartier: declaration?.quartier,
    ville: declaration?.ville,
    region: declaration?.region,
    pays: declaration?.pays,
    department: declaration?.department,
    arrondissement: declaration?.arrondissement,
    document_number: declaration?.document_number,
    date_expiration: declaration?.date_expiration,
    date_delivrance: metadata.date_delivrance,
    date_perte: declaration?.date_perte,
    etat_physique: declaration?.etat_physique,
    description: declaration?.description,
    urgence_niveau: declaration?.urgence_niveau,
    mode_contact: declaration?.mode_contact,
    payment_status: declaration?.payment_status,
    recompense_montant: declaration?.recompense_montant,
    reward_amount: declaration?.reward_amount,
    reward_points: declaration?.reward_points,
    photo_recto: declaration?.photo_recto || declaration?.photo_face,
    photo_verso: declaration?.photo_verso || declaration?.photo_serial,
    found_location: declaration?.found_location,
    reporter_type: declaration?.reporter_type,
    reporter_partenaire_nom: declaration?.reporter_partenaire_nom,
    metadata: declaration?.metadata || null,
    created_at: declaration?.created_at,
  };
}

function mapDocumentType(declaration: any): DocumentTypePdf {
  const info = declaration?.docTypeInfo || {};
  return {
    code: info?.code || declaration?.doc_type,
    nom: info?.nom || declaration?.doc_type || 'Document',
    icone: info?.icone,
    description: info?.description,
    categorie: info?.categorie,
    prix_retrouvaille: info?.prix_retrouvaille,
    finder_percent: info?.finder_percent,
    app_percent: info?.app_percent,
    points_recompense: info?.points_recompense,
  };
}

export class PdfModule {
  /**
   * Génère l'attestation PDF d'une déclaration (Puppeteer / Chromium headless).
   * Renvoie un Buffer PDF A4. Lève une erreur si le rendu échoue
   * (l'appelant peut basculer sur le fallback pdfkit).
   */
  async generateDeclarationPdf(declaration: any, declarationType: 'LOST' | 'FOUND'): Promise<Buffer> {
    const params: DeclarationPdfParams = {
      declarationType,
      documentType: mapDocumentType(declaration),
      declaration: mapDeclarationData(declaration, declarationType),
      options: {
        certified: !!declaration?.is_certified,
        certifierName: declaration?.certified_by_name || 'Autorité DocMaster',
        generatedAt: new Date(),
      },
    };
    const html = renderDeclarationTemplate(params);
    return pdfRenderer.renderHtml(html);
  }

  async close(): Promise<void> {
    await pdfRenderer.close();
  }
}

export const pdfModule = new PdfModule();

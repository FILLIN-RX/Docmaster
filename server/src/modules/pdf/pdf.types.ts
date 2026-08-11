export interface DeclarationPdfData {
  id?: string;
  identifiant_doc_dm?: string | null;
  declaration_type?: string | null;
  status?: string | null;
  is_certified?: boolean;
  certified_at?: string | null;
  certified_by_name?: string | null;
  owner_name?: string | null;
  cni_declarant?: string | null;
  date_naissance?: string | null;
  lieu_naissance?: string | null;
  telephone_contact?: string | null;
  email_contact?: string | null;
  quartier?: string | null;
  ville?: string | null;
  region?: string | null;
  pays?: string | null;
  department?: string | null;
  arrondissement?: string | null;
  document_number?: string | null;
  date_expiration?: string | null;
  date_delivrance?: string | null;
  date_perte?: string | null;
  etat_physique?: string | null;
  description?: string | null;
  urgence_niveau?: string | null;
  mode_contact?: string | null;
  payment_status?: string | null;
  recompense_montant?: number | string | null;
  reward_amount?: number | string | null;
  reward_points?: number | string | null;
  photo_recto?: string | null;
  photo_verso?: string | null;
  found_location?: { lat?: number; lon?: number } | string | null;
  reporter_type?: string | null;
  reporter_partenaire_nom?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
}

export interface DocumentTypePdf {
  code?: string | null;
  nom?: string | null;
  icone?: string | null;
  description?: string | null;
  categorie?: string | null;
  prix_retrouvaille?: number | string;
  finder_percent?: number | string;
  app_percent?: number | string;
  points_recompense?: number | string;
}

export interface DeclarationPdfParams {
  /** Type de déclaration : PERDU ou TROUVÉ */
  declarationType: 'LOST' | 'FOUND';
  /** Type de document déclaré (CNI, passeport, permis…) */
  documentType: DocumentTypePdf;
  /** Données complètes de la déclaration */
  declaration: DeclarationPdfData;
  options?: {
    certified?: boolean;
    certifierName?: string | null;
    generatedAt?: Date;
  };
}

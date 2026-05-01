/**
 * DocMaster Type Definitions
 */

export interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    mot_de_passe: string;
    pays: string;
    ville: string;
    is_verified: boolean;
    code_invitation?: string;
    parrain_id?: string;
    points: number;
    wallet_balance: number;
    date_naissance?: Date;
    lieu_naissance?: string;
    currency: string;
    role: 'USER' | 'ADMIN';
    created_at: Date;
    updated_at: Date;
}

export type DeclarationType = 'LOST' | 'FOUND';
export type DocumentStatus = 'AVAILABLE' | 'SEARCHING' | 'RETURNED';

export interface DocumentDeclaration {
    id: string;
    identifiant_doc_dm: string;
    doc_type: string;
    owner_name: string;
    document_number: string;
    declaration_type: DeclarationType;
    status: DocumentStatus;
    reporter_id: string;
    ville: string;
    region: string;
    pays: string;
    fingerprint: string;
    found_location?: {
        city: string;
        lat: number;
        long: number;
    };
    etat_physique: string;
    photo_recto?: string;
    photo_verso?: string;
    description?: string;
    date_expiration?: string;
    mode_contact: string;
    payment_status: 'PENDING' | 'PAID';
    transactions_id?: string;
    date_naissance?: string;
    urgence_niveau?: string;
    recompense_montant?: number;
    date_perte?: string;
    created_at: Date;
}

export interface UserDocument {
    id: string;
    user_id: string;
    type_doc: string;
    numero_doc: string;
    nom_sur_doc: string;
    date_expiration?: Date;
    fingerprint: string;
    photo_recto?: string;
    photo_verso?: string;
    is_protected: boolean;
    created_at: Date;
}

export interface Claim {
    id: string;
    doc_id: string;
    owner_id: string;
    finder_id: string;
    verificat_code: string;
    status: 'PENDING' | 'VALIDATED' | 'FAILED';
    verificat_attempts: number;
    created_at: Date;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    payment_method: string;
    transact_id_external?: string;
    type: 'subscription' | 'declarat_fee' | 'finder_payout';
    metadata?: any;
    created_at: Date;
}

export interface PasswordResetToken {
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    used: boolean;
    used_at?: Date;
    created_at: Date;
}

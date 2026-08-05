import axios from "axios";

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "") + "/api/";
  }
  return "/api/";
};

const partenairesApi = axios.create({
  baseURL: resolveBaseUrl() + "partenaires",
  withCredentials: true,
  headers: {},
});

partenairesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/partenaire/connexion")) {
      window.location.href = "/partenaire/connexion";
    }
    return Promise.reject(error);
  }
);

export interface PartenaireSession {
  id: string;
  nom_organisation: string;
  email: string;
  telephone?: string | null;
  nom_contact?: string | null;
  prenom_contact?: string | null;
  ville?: string | null;
  region?: string | null;
  adresse?: string | null;
  logo_url?: string | null;
  statut: "ACTIF" | "SUSPENDU" | "INACTIF";
  must_change_password: boolean;
  wallet_balance: number;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PartenaireStats {
  total_declarations: number;
  found: number;
  matched: number;
  returned: number;
  available: number;
  wallet_balance: number;
}

export interface PartenaireDeclaration {
  id: string;
  identifiant_doc_dm?: string | null;
  doc_type?: string | null;
  doc_type_name?: string | null;
  doc_type_code?: string | null;
  owner_name: string;
  document_number?: string | null;
  status?: string | null;
  ville?: string | null;
  quartier?: string | null;
  description?: string | null;
  photo_recto?: string | null;
  photo_verso?: string | null;
  created_at: string;
}

export interface PartenaireWalletTransaction {
  id: string;
  partenaire_id: string;
  amount: string;
  balance_before: string;
  balance_after: string;
  type: "CREDIT" | "DEBIT";
  reason: string;
  reference_id?: string | null;
  reference_type?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface PartenaireWallet {
  balance: number;
  history: PartenaireWalletTransaction[];
}

export const partenairesService = {
  login(email: string, motDePasse: string) {
    return partenairesApi.post<{ success: boolean; data: { token: string; partenaire: PartenaireSession } }>("/login", {
      email,
      mot_de_passe: motDePasse,
    });
  },

  logout() {
    return partenairesApi.post<{ success: boolean; message: string }>("/logout");
  },

  me() {
    return partenairesApi.get<{ success: boolean; data: PartenaireSession }>("/me");
  },

  updateProfile(payload: Partial<Pick<PartenaireSession, "nom_organisation" | "telephone" | "nom_contact" | "prenom_contact" | "adresse" | "ville" | "region">>) {
    return partenairesApi.put<{ success: boolean; data: PartenaireSession }>("/profil", payload);
  },

  changePassword(ancienMotDePasse: string, nouveauMotDePasse: string) {
    return partenairesApi.post<{ success: boolean; message: string }>("/change-password", {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    });
  },

  getStats() {
    return partenairesApi.get<{ success: boolean; data: PartenaireStats }>("/stats");
  },

  getDeclarations(params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    doc_type?: string;
  }) {
    return partenairesApi.get<{ success: boolean; rows: PartenaireDeclaration[]; total: number; page: number; limit: number }>(
      "/declarations",
      { params }
    );
  },

  createDeclaration(formData: FormData) {
    return partenairesApi.post<{ success: boolean; message: string; data: PartenaireDeclaration }>("/declarations", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteDeclaration(declarationId: string) {
    return partenairesApi.delete<{ success: boolean; message: string }>(`/declarations/${declarationId}`);
  },

  getWallet(params?: { limit?: number; offset?: number }) {
    return partenairesApi.get<{ success: boolean; data: PartenaireWallet }>("/wallet", { params });
  },
};

export default partenairesApi;
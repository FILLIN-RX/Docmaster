import axios from "axios";

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "") + "/api/";
  }
  return "/api/";
};

const autoritesApi = axios.create({
  baseURL: resolveBaseUrl() + "autorites",
  withCredentials: true,
  headers: {},
});

autoritesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/autorite/connexion")) {
      window.location.href = "/autorite/connexion";
    }
    return Promise.reject(error);
  }
);

export interface AutoriteSession {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  niveau: "HAUTE" | "NORMAL";
  ville: string;
  region?: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface AutoriteStats {
  total: number;
  certified: number;
  lost: number;
  found: number;
  by_me: number;
}

export interface AutoriteDeclaration {
  id: string;
  identifiant_doc_dm?: string | null;
  doc_type?: string | null;
  doc_type_nom?: string | null;
  owner_name: string;
  document_number?: string | null;
  declaration_type: "PERDU" | "TROUVE";
  status?: string | null;
  ville?: string | null;
  region?: string | null;
  pays?: string | null;
  quartier?: string | null;
  description?: string | null;
  etat_physique?: string | null;
  urgence_niveau?: string | null;
  recompense_montant?: number | null;
  date_perte?: string | null;
  date_expiration?: string | null;
  date_naissance?: string | null;
  telephone_contact?: string | null;
  email_contact?: string | null;
  mode_contact?: string | null;
  found_location?: any;
  photo_recto?: string | null;
  photo_verso?: string | null;
  is_certified: boolean;
  certified_by?: string | null;
  certified_at?: string | null;
  certified_by_nom?: string | null;
  certified_by_prenom?: string | null;
  reporter_nom?: string | null;
  reporter_prenom?: string | null;
  finder_name?: string | null;
  created_at: string;
}

export interface AutoriteForCreate {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  ville: string;
  region?: string;
}

export interface AutoriteActivityLog {
  id: string;
  autorite_id: string | null;
  autorite_nom: string | null;
  autorite_prenom: string | null;
  autorite_niveau: "HAUTE" | "NORMAL" | null;
  autorite_ville: string | null;
  autorite_region: string | null;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export const autoritesService = {
  getDeclarationPdf(declarationId: string) {
    return autoritesApi.get(`/declarations/${declarationId}/pdf`, { responseType: "blob" });
  },
  login(email: string, motDePasse: string) {
    return autoritesApi.post<{ success: boolean; data: { token: string; autorite: AutoriteSession } }>("/login", {
      email,
      mot_de_passe: motDePasse,
    });
  },

  logout() {
    return autoritesApi.post<{ success: boolean; message: string }>("/logout");
  },

  me() {
    return autoritesApi.get<{ success: boolean; data: AutoriteSession }>("/me");
  },

  createByHaute(payload: AutoriteForCreate) {
    return autoritesApi.post<{ success: boolean; message: string; data: { temp_password: string } }>(
      "/create",
      payload
    );
  },

  getManagedAutorites() {
    return autoritesApi.get<{ success: boolean; data: AutoriteSession[] }>("/managed");
  },

  deleteManaged(id: string) {
    return autoritesApi.delete<{ success: boolean; message: string }>(`/managed/${id}`);
  },

  changePassword(ancienMotDePasse: string, nouveauMotDePasse: string) {
    return autoritesApi.post<{ success: boolean; message: string }>("/change-password", {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    });
  },

  getStats() {
    return autoritesApi.get<{ success: boolean; data: AutoriteStats }>("/stats");
  },

  getDeclarations(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    declaration_type?: string;
    status?: string;
    is_certified?: boolean;
  }) {
    return autoritesApi.get<{ success: boolean; count: number; data: AutoriteDeclaration[] }>("/declarations", {
      params,
    });
  },

  certify(declarationId: string) {
    return autoritesApi.post<{ success: boolean; message: string; data: AutoriteDeclaration }>(
      `/declarations/${declarationId}/certify`
    );
  },

  getActivityLogs(params?: { limit?: number; offset?: number; action_type?: string; entity_type?: string }) {
    return autoritesApi.get<{ success: boolean; total: number; data: AutoriteActivityLog[] }>("/activity", {
      params,
    });
  },

  uncertify(declarationId: string) {
    return autoritesApi.post<{ success: boolean; message: string; data: AutoriteDeclaration }>(
      `/declarations/${declarationId}/uncertify`
    );
  },
};

export default autoritesApi;

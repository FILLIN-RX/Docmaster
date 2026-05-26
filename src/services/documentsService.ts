import apiClient from "./api";
import type { ApiResponse, Document } from "../types/api";

export const documentsService = {
  async register(data: {
    type_id: string;
    numero: string;
    nom_complet?: string;
    date_naissance?: string;
    lieu_naissance?: string;
    photo_url?: string;
    recto_url?: string;
    verso_url?: string;
    date_delivrance?: string;
    date_expiration?: string;
    delivered_at?: string;
  }) {
    const res = await apiClient.post<ApiResponse<Document>>("documents", data);
    return res.data;
  },

  async getAll() {
    const res = await apiClient.get<ApiResponse<Document[]>>("documents");
    return res.data;
  },

  async delete(id: string) {
    const res = await apiClient.delete<ApiResponse>(`documents/${id}`);
    return res.data;
  },

  async reportLost(id: string) {
    const res = await apiClient.patch<ApiResponse>(`documents/${id}/report-lost`);
    return res.data;
  },

  async share(data: { document_id: string; email?: string; code_partage?: string }) {
    const res = await apiClient.post<ApiResponse>("documents/share", data);
    return res.data;
  },

  async getSharedDocument(code: string) {
    const res = await apiClient.get<ApiResponse<Document>>(`documents/share/${code}`);
    return res.data;
  },

  async getDocumentShares(docId: string) {
    const res = await apiClient.get<ApiResponse>(`documents/${docId}/shares`);
    return res.data;
  },

  async revokeShare(shareId: string) {
    const res = await apiClient.delete<ApiResponse>(`documents/shares/${shareId}`);
    return res.data;
  },
};

import apiClient from "./api";
import type { ApiResponse } from "../types/api";

export interface PromoPlan {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  duration_months: number;
  features: Record<string, unknown>;
  is_active?: boolean;
}

export interface PromoSubscribePayload {
  paymentMethod: string;
  phone?: string;
}

export const promoService = {
  async getActivePromo() {
    const res = await apiClient.get<ApiResponse<PromoPlan | null>>("promos/active");
    return res.data;
  },

  async subscribeToPromo(data: PromoSubscribePayload) {
    const res = await apiClient.post<ApiResponse>("promos/subscribe", data);
    return res.data;
  },

  async getAdminPromo() {
    const res = await apiClient.get<ApiResponse<PromoPlan | null>>("promos/admin");
    return res.data;
  },

  async updateAdminPromo(data: Partial<PromoPlan>) {
    const res = await apiClient.put<ApiResponse>("promos/admin", data);
    return res.data;
  },
};

import apiClient from "./api";
import type { ApiResponse, Referral } from "../types/api";

export const referralsService = {
  async getMyReferrals() {
    const res = await apiClient.get<ApiResponse & { referrals: Referral[]; stats?: unknown }>("referrals");
    return res.data;
  },
};

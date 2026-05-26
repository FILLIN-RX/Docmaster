import apiClient from "./api";
import type { ApiResponse } from "../types/api";

export const settingsService = {
  async getAll() {
    const res = await apiClient.get<ApiResponse<Record<string, string>>>("settings");
    return res.data;
  },
};

import apiClient from "./api";
import type { ApiResponse, Transaction } from "../types/api";

export const paymentsService = {
  async getMyTransactions() {
    const res = await apiClient.get<ApiResponse<Transaction[]>>("payments/transactions");
    return res.data;
  },
};

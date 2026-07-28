import apiClient from "./api";

export const deviceTransferService = {
  async initiate(deviceId: string, email: string) {
    const res = await apiClient.post("device-transfers/initiate", { deviceId, email });
    return res.data;
  },

  async accept(token: string) {
    const res = await apiClient.post("device-transfers/accept", { token });
    return res.data;
  },

  async reject(token: string) {
    const res = await apiClient.post("device-transfers/reject", { token });
    return res.data;
  },

  async getByToken(token: string) {
    const res = await apiClient.get(`device-transfers/token/${token}`);
    return res.data;
  },

  async getPending() {
    const res = await apiClient.get("device-transfers/pending");
    return res.data;
  },

  async getSent() {
    const res = await apiClient.get("device-transfers/sent");
    return res.data;
  },
};

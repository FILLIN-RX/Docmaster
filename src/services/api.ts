import axios from "axios";
import { getToken, saveToken, deleteToken } from "../utils/cookie";
import { emitToast } from "../utils/toastEmitter";

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "") + "/api/";
  }
  // If no env var, default to relative path /api/
  return "/api/";
};

const API_BASE_URL = resolveBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {},
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      deleteToken();
      localStorage.removeItem("docmaster_user_session");
      localStorage.removeItem("dm_devices_cache");
      if (
        !window.location.pathname.includes("/login") &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    } else if (!error.response) {
      emitToast({ type: "error", message: "Erreur réseau. Vérifiez votre connexion internet." });
    } else if (error.response.status >= 500) {
      emitToast({ type: "error", message: "Le serveur est temporairement indisponible. Veuillez réessayer." });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };

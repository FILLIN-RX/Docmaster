import { useState, useCallback } from "react";
import { authService } from "../services/authService";
import { useAuth as useAuthContext } from "../context/AuthContext";

export function useAuth() {
  return useAuthContext();
}

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.requestPasswordReset({ email });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur d'envoi";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, motDePasse: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.resetPassword({ token, mot_de_passe: motDePasse });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur de réinitialisation";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, requestReset, resetPassword };
}

export function useEmailVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPin = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.sendVerificationPin({ email });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur d'envoi du PIN";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPin = useCallback(async (email: string, pin: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.verifyEmailPin({ email, pin });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Code invalide";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, sendPin, verifyPin };
}

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.updateProfile(data);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur de mise à jour";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, updateProfile };
}

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useCallback(async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.googleOAuthLogin({ credential });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur Google";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, googleLogin };
}

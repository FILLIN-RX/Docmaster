import { useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

export function useEarnings() {
  const [earnings, setEarnings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.getEarningsStats();
      setEarnings(res.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { earnings, loading, error, fetch };
}

import { useState, useCallback } from "react";
import { smsService } from "../services/smsService";

export function useSmsBalance() {
  const [balance, setBalance] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await smsService.getBalance();
      setBalance(res.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  return { balance, loading, error, fetch };
}

export function useSmsUsage() {
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await smsService.getUsage();
      setUsage(res.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  return { usage, loading, error, fetch };
}

export function useSmsPurchaseHistory() {
  const [history, setHistory] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await smsService.getPurchaseHistory();
      setHistory(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  return { history, loading, error, fetch };
}

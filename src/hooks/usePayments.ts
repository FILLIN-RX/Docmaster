import { useState, useEffect, useCallback } from "react";
import { paymentsService } from "../services/paymentsService";
import type { Transaction } from "../types/api";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsService.getMyTransactions();
      setTransactions(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, loading, error, fetch };
}

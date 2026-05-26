import { useState, useEffect, useCallback } from "react";
import { referralsService } from "../services/referralsService";
import type { Referral } from "../types/api";

export function useReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await referralsService.getMyReferrals();
      setReferrals(res.referrals || []);
      setStats(res.stats || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { referrals, stats, loading, error, fetch };
}

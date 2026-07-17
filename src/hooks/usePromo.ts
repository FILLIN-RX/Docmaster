import { useState, useEffect, useCallback } from "react";
import { promoService, type PromoPlan } from "../services/promoService";

const PROMO_DISMISSED_KEY = "dm_promo_dismissed";

export function usePromo() {
  const [promo, setPromo] = useState<PromoPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promoService.getActivePromo();
      if (res.success && res.data) {
        setPromo(res.data);
      } else {
        setPromo(null);
      }
    } catch {
      setPromo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const subscribe = useCallback(async (paymentMethod: string, phone?: string) => {
    setSubscribing(true);
    setError(null);
    try {
      const res = await promoService.subscribeToPromo({ paymentMethod, phone });
      if (!res.success) {
        setError(res.message || "Erreur lors de l'activation du promo");
        throw new Error(res.message);
      }
      return res;
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'activation");
      throw err;
    } finally {
      setSubscribing(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setPromo(null);
    localStorage.setItem(PROMO_DISMISSED_KEY, "true");
  }, []);

  const isDismissed = localStorage.getItem(PROMO_DISMISSED_KEY) === "true";

  return { promo, loading, subscribing, error, check, subscribe, dismiss, isDismissed };
}

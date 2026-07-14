import { useState, useEffect, useCallback } from "react";
import { subscriptionsService } from "../services/subscriptionsService";
import { useToast } from "../context/ToastContext";
import { extractApiError } from "../utils/extractApiError";
import type { Plan, Subscription } from "../types/api";

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    subscriptionsService.getAllPlans()
      .then((res) => setPlans(res.data || []))
      .catch((err) => setError(err.response?.data?.error || "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading, error };
}

export function useMySubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionsService.getMySubscription();
      setSubscription(res.data || null);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || "Erreur de chargement");
      }
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const subscribe = useCallback(async (planId: string, months = 1, paymentMethod = "card") => {
    try {
      const res = await subscriptionsService.subscribe({ planId, months, paymentMethod });
      toast.success("Abonnement activé avec succès");
      await fetch();
      return res;
    } catch (err: any) {
      toast.error(extractApiError(err));
      throw err;
    }
  }, [fetch, toast]);

  return { subscription, loading, error, fetch, subscribe };
}

export function useSubscriptionUsage() {
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (userId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionsService.getUsage(userId);
      setUsage(res.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Erreur de chargement de l'utilisation");
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { usage, loading, error, fetch };
}

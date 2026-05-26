import { useState, useCallback } from "react";
import { claimsService } from "../services/claimsService";
import type { Claim } from "../types/api";

export function useCreateClaim() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: Parameters<typeof claimsService.create>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await claimsService.create(data);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur de création";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, create };
}

export function useActiveClaim(id?: string) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await claimsService.getActive(id);
      setClaim(res.data || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Réclamation introuvable");
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { claim, loading, error, fetch };
}

export function useRecoveryCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (claimId: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await claimsService.validateRecoveryCode({ claim_id: claimId, code });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Code invalide";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const pay = useCallback(async (claimId: string, method: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await claimsService.payRecoveryFee({ claim_id: claimId, method });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur de paiement";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, validate, pay };
}

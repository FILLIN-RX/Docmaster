import { useState, useEffect, useCallback } from "react";
import { statsService } from "../services/statsService";

export function useGlobalStats() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statsService.getGlobal()
      .then((res) => setStats(res.data || null))
      .catch((e: any) => {
        setError(e?.response?.data?.error || "Erreur de chargement des statistiques");
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

export function usePerformanceStats(period?: string) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await statsService.getPerformance(p);
      setStats(res.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Erreur de chargement des performances");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { stats, loading, error, fetch };
}

export function useStatsByType(period?: string) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (p?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await statsService.getStatsByType(p);
      setStats(res.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Erreur de chargement des types de documents");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(period); }, [fetch, period]);

  return { stats, loading, error, fetch };
}

export function useActiveDocumentTypes() {
  const [types, setTypes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statsService.getActiveDocumentTypes()
      .then((res) => setTypes(res.data || []))
      .catch((e: any) => {
        setError(e?.response?.data?.error || "Erreur de chargement des types de documents");
        setTypes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { types, loading, error };
}

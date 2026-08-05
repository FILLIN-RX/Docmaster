import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { autoritesService, type AutoriteSession } from "../services/autoritesService";

interface AutoriteContextValue {
  autorite: AutoriteSession | null;
  loading: boolean;
  login: (email: string, motDePasse: string) => Promise<AutoriteSession>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AutoriteContext = createContext<AutoriteContextValue | undefined>(undefined);

export function AutoriteProvider({ children }: { children: React.ReactNode }) {
  const [autorite, setAutorite] = useState<AutoriteSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await autoritesService.me();
      setAutorite(res.data.data);
    } catch {
      setAutorite(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    autoritesService
      .me()
      .then((res) => {
        if (!cancelled) setAutorite(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setAutorite(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, motDePasse: string) => {
    const res = await autoritesService.login(email, motDePasse);
    setAutorite(res.data.data.autorite);
    return res.data.data.autorite;
  }, []);

  const logout = useCallback(async () => {
    try {
      await autoritesService.logout();
    } catch {
      /* ignore */
    }
    setAutorite(null);
    window.location.href = "/autorite/connexion";
  }, []);

  const value = useMemo(
    () => ({ autorite, loading, login, logout, refresh }),
    [autorite, loading, login, logout, refresh]
  );

  return <AutoriteContext.Provider value={value}>{children}</AutoriteContext.Provider>;
}

export function useAutorite() {
  const ctx = useContext(AutoriteContext);
  if (!ctx) {
    throw new Error("useAutorite doit être utilisé dans AutoriteProvider");
  }
  return ctx;
}

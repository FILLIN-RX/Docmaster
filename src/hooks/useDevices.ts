import { useState, useEffect, useCallback } from "react";
import { devicesService } from "../services/devicesService";
import { useToast } from "../context/ToastContext";
import { extractApiError } from "../utils/extractApiError";
import type { Device } from "../types/api";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await devicesService.getAll();
      setDevices(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur de chargement");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const register = useCallback(async (data: Parameters<typeof devicesService.register>[0]) => {
    try {
      const res = await devicesService.register(data);
      toast.success("Appareil enregistré");
      await fetch();
      return res;
    } catch (err: any) {
      toast.error(extractApiError(err));
      throw err;
    }
  }, [fetch, toast]);

  const reportLost = useCallback(async (serial: string) => {
    try {
      const res = await devicesService.reportLost(serial);
      toast.success("Appareil signalé perdu");
      setDevices((prev) =>
        prev.map((d) => (d.serial_number === serial ? { ...d, is_lost: true } : d))
      );
      return res;
    } catch (err: any) {
      toast.error(extractApiError(err));
      throw err;
    }
  }, [toast]);

  const reportFound = useCallback(async (serial: string) => {
    try {
      const res = await devicesService.reportFound(serial);
      toast.success("Appareil retrouvé");
      setDevices((prev) =>
        prev.map((d) => (d.serial_number === serial ? { ...d, is_lost: false } : d))
      );
      return res;
    } catch (err: any) {
      toast.error(extractApiError(err));
      throw err;
    }
  }, [toast]);

  const verify = useCallback(async (code: string, serial: string) => {
    try {
      const res = await devicesService.verify(code, serial);
      toast.success("Appareil vérifié");
      await fetch();
      return res;
    } catch (err: any) {
      toast.error(extractApiError(err));
      throw err;
    }
  }, [fetch, toast]);

  const remove = useCallback(async (id: string) => {
    try {
      const res = await devicesService.delete(id);
      toast.success("Appareil supprimé");
      setDevices((prev) => prev.filter((d) => d.id !== id));
      return res;
    } catch (err: any) {
      toast.error(extractApiError(err));
      throw err;
    }
  }, [toast]);

  return { devices, loading, error, fetch, register, reportLost, reportFound, verify, remove };
}

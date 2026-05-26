import { useState, useEffect, useCallback } from "react";
import { devicesService } from "../services/devicesService";
import type { Device } from "../types/api";

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const res = await devicesService.register(data);
    await fetch();
    return res;
  }, [fetch]);

  const reportLost = useCallback(async (serial: string) => {
    const res = await devicesService.reportLost(serial);
    setDevices((prev) =>
      prev.map((d) => (d.serial_number === serial ? { ...d, is_lost: true } : d))
    );
    return res;
  }, []);

  const reportFound = useCallback(async (serial: string) => {
    const res = await devicesService.reportFound(serial);
    setDevices((prev) =>
      prev.map((d) => (d.serial_number === serial ? { ...d, is_lost: false } : d))
    );
    return res;
  }, []);

  const verify = useCallback(async (code: string, serial: string) => {
    const res = await devicesService.verify(code, serial);
    await fetch();
    return res;
  }, [fetch]);

  const remove = useCallback(async (id: string) => {
    const res = await devicesService.delete(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
    return res;
  }, []);

  return { devices, loading, error, fetch, register, reportLost, reportFound, verify, remove };
}

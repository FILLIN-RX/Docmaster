import { useState, useEffect, useCallback } from "react";
import {
  getRegions,
  getDepartments,
  getArrondissements,
  type RegionSummary,
  type DepartmentSummary,
} from "../services/locationsService";

export interface LocationState {
  region: string;
  department: string;
  arrondissement: string;
}

interface UseLocationsOptions {
  initialRegion?: string;
  initialDepartment?: string;
  initialArrondissement?: string;
}

export function useLocations(opts?: UseLocationsOptions) {
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [arrondissements, setArrondissements] = useState<string[]>([]);

  const [region, setRegion] = useState(opts?.initialRegion || "");
  const [department, setDepartment] = useState(opts?.initialDepartment || "");
  const [arrondissement, setArrondissement] = useState(opts?.initialArrondissement || "");

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingArrs, setLoadingArrs] = useState(false);

  // Load regions on mount
  useEffect(() => {
    setLoadingRegions(true);
    getRegions()
      .then(setRegions)
      .catch(() => {})
      .finally(() => setLoadingRegions(false));
  }, []);

  // Load departments when region changes
  useEffect(() => {
    if (!region) {
      setDepartments([]);
      setDepartment("");
      setArrondissements([]);
      setArrondissement("");
      return;
    }
    setLoadingDepts(true);
    setDepartment("");
    setArrondissements([]);
    setArrondissement("");
    getDepartments(region)
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, [region]);

  // Load arrondissements when department changes
  useEffect(() => {
    if (!region || !department) {
      setArrondissements([]);
      setArrondissement("");
      return;
    }
    setLoadingArrs(true);
    setArrondissement("");
    getArrondissements(region, department)
      .then(setArrondissements)
      .catch(() => {})
      .finally(() => setLoadingArrs(false));
  }, [region, department]);

  const handleRegionChange = useCallback((val: string) => {
    setRegion(val);
  }, []);

  const handleDepartmentChange = useCallback((val: string) => {
    setDepartment(val);
  }, []);

  const handleArrondissementChange = useCallback((val: string) => {
    setArrondissement(val);
  }, []);

  // The final "ville" value is arrondissement if set, else department
  const ville = arrondissement || department || "";

  return {
    regions,
    departments,
    arrondissements,
    region,
    department,
    arrondissement,
    ville,
    loadingRegions,
    loadingDepts,
    loadingArrs,
    setRegion,
    setDepartment,
    setArrondissement,
    handleRegionChange,
    handleDepartmentChange,
    handleArrondissementChange,
  };
}

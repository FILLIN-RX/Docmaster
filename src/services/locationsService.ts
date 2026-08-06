import apiClient from "./api";

export interface RegionSummary {
  id: string;
  region: string;
  capital: string;
  departmentCount: number;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  chefLieu: string;
  arrondissementCount: number;
}

export interface RegionDetail {
  region: string;
  capital: string;
  departments: DepartmentSummary[];
}

export interface DepartmentDetail {
  region: string;
  department: string;
  chefLieu: string;
  arrondissements: string[];
}

export interface LocationResult {
  region: string;
  department: string;
  arrondissement: string;
}

// In-memory cache
let regionsCache: RegionSummary[] | null = null;
const departmentsCache: Map<string, DepartmentSummary[]> = new Map();
const arrondissementsCache: Map<string, string[]> = new Map();

function cacheKey(region: string, department?: string): string {
  return department ? `${region}|${department}` : region;
}

/**
 * Get all regions
 */
export async function getRegions(): Promise<RegionSummary[]> {
  if (regionsCache) return regionsCache;
  console.log("🔍 [Frontend] Fetching all regions...");
  try {
    const { data } = await apiClient.get("locations");
    console.log("✅ [Frontend] Regions fetched:", data);
    regionsCache = data;
    return data;
  } catch (error) {
    console.error("❌ [Frontend] Error fetching regions:", error);
    throw error;
  }
}

/**
 * Get departments for a region
 */
export async function getDepartments(region: string): Promise<DepartmentSummary[]> {
  const key = region;
  if (departmentsCache.has(key)) return departmentsCache.get(key)!;
  console.log(`🔍 [Frontend] Fetching departments for region: ${region}...`);
  try {
    const { data } = await apiClient.get("locations", { params: { region } });
    console.log(`✅ [Frontend] Departments fetched for ${region}:`, data);
    const depts: DepartmentSummary[] = data.departments || [];
    departmentsCache.set(key, depts);
    return depts;
  } catch (error) {
    console.error(`❌ [Frontend] Error fetching departments for ${region}:`, error);
    throw error;
  }
}

/**
 * Get arrondissements for a department
 */
export async function getArrondissements(
  region: string,
  department: string
): Promise<string[]> {
  const key = cacheKey(region, department);
  if (arrondissementsCache.has(key)) return arrondissementsCache.get(key)!;
  console.log(`🔍 [Frontend] Fetching arrondissements for ${region}/${department}...`);
  try {
    const { data } = await apiClient.get("locations", { params: { region, department } });
    console.log(`✅ [Frontend] Arrondissements fetched for ${region}/${department}:`, data);
    const arrs: string[] = data.arrondissements || [];
    arrondissementsCache.set(key, arrs);
    return arrs;
  } catch (error) {
    console.error(`❌ [Frontend] Error fetching arrondissements for ${region}/${department}:`, error);
    throw error;
  }
}

/**
 * Clear all caches (useful on logout)
 */
export function clearLocationsCache(): void {
  regionsCache = null;
  departmentsCache.clear();
  arrondissementsCache.clear();
}

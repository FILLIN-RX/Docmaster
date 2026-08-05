import { Router, Request, Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const router = Router();

// Load and cache the JSON data at startup
interface Arrondissement {
  id: string;
  name: string;
  chefLieu: string;
  arrondissements: string[];
}

interface Region {
  id: string;
  region: string;
  capital: string;
  departments: Arrondissement[];
}

let divisions: Region[] = [];

try {
  const raw = readFileSync(
    join(process.cwd(), "docs/cameroon_administrative_divisions.json"),
    "utf-8"
  );
  divisions = JSON.parse(raw);
  console.log(`🌍 [Locations] Loaded ${divisions.length} regions from JSON`);
} catch (err: any) {
  console.error("❌ [Locations] Failed to load divisions JSON:", err.message);
}

/**
 * GET /api/locations
 * Query params:
 *   - region?: filter by region name (case-insensitive)
 *   - department?: filter by department name (requires region)
 */
router.get("/", (req: Request, res: Response) => {
  const { region, department } = req.query;

  // No params: return all regions (compact)
  if (!region) {
    return res.json(
      divisions.map((r) => ({
        id: r.id,
        region: r.region,
        capital: r.capital,
        departmentCount: r.departments.length,
      }))
    );
  }

  // Find region
  const regionData = divisions.find(
    (r) => r.region.toLowerCase() === (region as string).toLowerCase()
  );

  if (!regionData) {
    return res.status(404).json({
      success: false,
      message: `Region "${region}" not found`,
    });
  }

  // No department: return departments of this region
  if (!department) {
    return res.json({
      region: regionData.region,
      capital: regionData.capital,
      departments: regionData.departments.map((d) => ({
        id: d.id,
        name: d.name,
        chefLieu: d.chefLieu,
        arrondissementCount: d.arrondissements.length,
      })),
    });
  }

  // Find department
  const deptData = regionData.departments.find(
    (d) => d.name.toLowerCase() === (department as string).toLowerCase()
  );

  if (!deptData) {
    return res.status(404).json({
      success: false,
      message: `Department "${department}" not found in region "${region}"`,
    });
  }

  // Return arrondissements
  return res.json({
    region: regionData.region,
    department: deptData.name,
    chefLieu: deptData.chefLieu,
    arrondissements: deptData.arrondissements,
  });
});

/**
 * Validate location fields against the JSON
 * Used by other services to validate region/department/arrondissement
 */
export function validateLocation(
  region?: string,
  department?: string,
  arrondissement?: string
): { valid: boolean; error?: string } {
  if (!region) return { valid: true };

  const regionData = divisions.find(
    (r) => r.region.toLowerCase() === region.toLowerCase()
  );
  if (!regionData) {
    return { valid: false, error: `Region "${region}" invalide` };
  }

  if (!department) return { valid: true };

  const deptData = regionData.departments.find(
    (d) => d.name.toLowerCase() === department.toLowerCase()
  );
  if (!deptData) {
    return {
      valid: false,
      error: `Département "${department}" invalide pour la région "${region}"`,
    };
  }

  if (!arrondissement) return { valid: true };

  const arrMatch = deptData.arrondissements.find(
    (a) => a.toLowerCase() === arrondissement.toLowerCase()
  );
  if (!arrMatch) {
    return {
      valid: false,
      error: `Arrondissement "${arrondissement}" invalide pour le département "${department}"`,
    };
  }

  return { valid: true };
}

export { router as locationRoutes };

import { Router, Request, Response } from "express";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  // Try finding it at the build output location first, then the root
  let path = join(__dirname, "../../dist/docs/cameroon_administrative_divisions.json");
  if (!existsSync(path)) {
     path = join(__dirname, "../../../docs/cameroon_administrative_divisions.json");
  }
  const raw = readFileSync(path, "utf-8");
  divisions = JSON.parse(raw);
  console.log(`🌍 [Locations] Loaded ${divisions.length} regions from JSON at ${path}`);
  if (divisions.length === 0) {
    console.warn("⚠️ [Locations] Loaded divisions array is empty!");
  } else {
    console.log("🌍 [Locations] First region sample:", JSON.stringify(divisions[0], null, 2).substring(0, 200));
  }
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
  console.log(`🌍 [Locations] Request received: region=${region}, department=${department}`);
  console.log(`🌍 [Locations] Current total regions in memory: ${divisions.length}`);

  // No params: return all regions (compact)
  if (!region) {
    const data = divisions.map((r) => ({
      id: r.id,
      region: r.region,
      capital: r.capital,
      departmentCount: r.departments.length,
    }));
    console.log(`🌍 [Locations] Returning ${data.length} regions. Sample:`, JSON.stringify(data[0]));
    return res.json(data);
  }

  // Find region
  const regionData = divisions.find(
    (r) => r.region.toLowerCase() === (region as string).toLowerCase()
  );

  if (!regionData) {
    console.warn(`⚠️ [Locations] Region "${region}" not found`);
    return res.status(404).json({
      success: false,
      message: `Region "${region}" not found`,
    });
  }

  // No department: return departments of this region
  if (!department) {
    const data = {
      region: regionData.region,
      capital: regionData.capital,
      departments: regionData.departments.map((d) => ({
        id: d.id,
        name: d.name,
        chefLieu: d.chefLieu,
        arrondissementCount: d.arrondissements.length,
      })),
    };
    console.log(`🌍 [Locations] Returning ${data.departments.length} departments for region ${region}`);
    return res.json(data);
  }

  // Find department
  const deptData = regionData.departments.find(
    (d) => d.name.toLowerCase() === (department as string).toLowerCase()
  );

  if (!deptData) {
    console.warn(`⚠️ [Locations] Department "${department}" not found in region "${region}"`);
    return res.status(404).json({
      success: false,
      message: `Department "${department}" not found in region "${region}"`,
    });
  }

  // Return arrondissements
  console.log(`🌍 [Locations] Returning ${deptData.arrondissements.length} arrondissements for ${department}`);
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

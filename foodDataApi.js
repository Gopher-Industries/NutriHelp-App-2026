import { get } from "./baseApi";

/**
 * Food-data lookups — FE-T2-10
 *
 * Catalogue endpoints that return the selectable options. They return the row
 * array directly, e.g. [{ id, name }, ...]. Public (no auth required).
 *
 *   GET /api/fooddata/dietaryrequirements
 *   GET /api/fooddata/allergies
 */

function toRows(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export async function getDietaryRequirements() {
  const res = await get("/api/fooddata/dietaryrequirements", { skipAuth: true });
  return toRows(res);
}

export async function getAllergies() {
  const res = await get("/api/fooddata/allergies", { skipAuth: true });
  return toRows(res);
}

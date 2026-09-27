import { get, post } from "./baseApi";

/**
 * User preferences — FE-T2-10
 *
 * Reuses the backend's structured health-preferences model (as the ticket
 * asks) instead of building new logic.
 *
 *   GET  /api/user/preferences   -> current preferences (authenticated)
 *        returns objects with { id, name } per field
 *   POST /api/user/preferences   -> save preferences (authenticated, 204)
 *        expects arrays of integer IDs for ALL of the fields below
 *
 * Because the backend validator requires every field on write, we always send
 * the full payload: fields the Dietary Requirements screen doesn't edit are
 * preserved from the current preferences so nothing is lost.
 */

export const PREFERENCE_FIELDS = [
  "dietary_requirements",
  "allergies",
  "cuisines",
  "dislikes",
  "health_conditions",
  "spice_levels",
  "cooking_methods",
];

// Accepts [{id,name}], [id], or [{referenceId}] and returns a clean number[].
function toIdArray(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      item && typeof item === "object" ? item.id ?? item.referenceId : item
    )
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
}

/**
 * Read the user's current preferences.
 * Returns { fields: { <field>: number[] }, raw } where `raw` keeps the original
 * {id,name} objects (handy for showing which options are selected).
 */
export async function getUserPreferences() {
  const res = await get("/api/user/preferences");
  const prefs = res?.data ?? res ?? {};
  const fields = {};
  for (const field of PREFERENCE_FIELDS) {
    fields[field] = toIdArray(prefs[field]);
  }
  return { fields, raw: prefs };
}

/**
 * Save preferences. Pass an object keyed by field name; any field you omit is
 * sent as an empty array unless you spread a previously-loaded set in first.
 * The whole seven-field payload is always sent to satisfy backend validation.
 */
export async function saveUserPreferences(fieldsById) {
  const payload = {};
  for (const field of PREFERENCE_FIELDS) {
    payload[field] = toIdArray(fieldsById?.[field]);
  }
  await post("/api/user/preferences", payload); // 204 No Content
  return true;
}

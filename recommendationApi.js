import { post } from "./baseApi";

/**
 * Recommendation API — FE-26
 *
 *   POST /api/recommendations   (authenticated)
 *     body: { dietaryConstraints: {} }   // dietaryConstraints is required
 *     -> { success, data: { items: [ { title, explanation, nutrition,
 *          imageUrl, ... } ] } }
 *
 * Returns the array of recommended items (empty array if none).
 */
export async function getRecommendations() {
  const res = await post("/api/recommendations", { dietaryConstraints: {} });
  const data = res?.data ?? res;
  return Array.isArray(data?.items) ? data.items : [];
}

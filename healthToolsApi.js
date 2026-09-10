import { get } from "./baseApi";

/**
 * Health Tools API — FE-13
 *
 * Wraps the backend nutrition/health calculation endpoint so the screen uses
 * the services layer instead of hard-coded mock values.
 *
 *   GET /api/health-tools/bmi?height=<metres>&weight=<kg>
 *     -> { success, data: { bmi, category, recommendedWaterIntakeMl, inputs } }
 *   Public endpoint (no auth required).
 */
export async function calculateBmi({ height, weight }) {
  const response = await get("/api/health-tools/bmi", {
    query: { height, weight },
    skipAuth: true,
  });
  return response?.data ?? response;
}

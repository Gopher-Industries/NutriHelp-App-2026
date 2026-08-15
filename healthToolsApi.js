import { get } from "./baseApi";

/**
 * Health Tools API — FE-T2-08
 *
 * Wraps the backend nutrition-calculation endpoints so screens call the
 * services layer instead of holding hardcoded/mock values.
 *
 * Backend (Nutrihelp-api):
 *   GET /api/health-tools/bmi?height=<metres>&weight=<kg>
 *     -> { success, data: { bmi, category, recommendedWaterIntakeMl, inputs } }
 *   Public endpoint (no auth required).
 */

/**
 * Calculate BMI + recommended daily water intake for the given height (metres)
 * and weight (kg). Returns the unwrapped data object:
 *   { bmi, category, recommendedWaterIntakeMl, inputs: { height, weight } }
 */
export async function calculateBmi({ height, weight }) {
  const response = await get("/api/health-tools/bmi", {
    query: { height, weight },
    skipAuth: true,
  });
  return response?.data ?? response;
}

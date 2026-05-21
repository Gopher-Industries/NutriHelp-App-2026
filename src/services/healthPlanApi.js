const API_BASE = "https://nutrihelp-backend-deployment.onrender.com";

export const HEALTH_GOALS = ["Weight Loss", "Muscle Gain", "Endurance"];

export async function generateHealthPlan({ medicalReport, healthGoal }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(
      `${API_BASE}/ai-model/medical-report/plan/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medical_report: medicalReport,
          health_goal: healthGoal,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timer);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Server error (${response.status})`);
    }

    return response.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out. The AI is warming up — please try again in a moment."
      );
    }
    throw err;
  }
}

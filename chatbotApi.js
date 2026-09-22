import { post, toErrorMessage } from "../api/baseApi";

/**
 * Chatbot API — FE-06
 *
 * Previously this hardcoded the full backend URL and used a raw fetch(),
 * bypassing baseApi.js and EXPO_PUBLIC_API_BASE_URL entirely (so the chatbot
 * ignored environment config and never attached the auth token).
 *
 * It now goes through the shared baseApi.post(), which:
 *   - builds the URL from EXPO_PUBLIC_API_BASE_URL (works across environments),
 *   - attaches the Bearer auth token via the shared mechanism, and
 *   - applies the request timeout (60s here for slow AI responses).
 *
 * Endpoint: POST {API_BASE_URL}/ai-model/chatbot/chat  { query } -> { msg }
 */
export async function sendChatMessage(query) {
  try {
    const data = await post(
      "/ai-model/chatbot/chat",
      { query },
      { timeoutMs: 60_000 }
    );
    return data?.msg ?? data;
  } catch (err) {
    throw new Error(
      toErrorMessage(err, "Chatbot request failed. Please try again.")
    );
  }
}

# FE-18 Audit: Chatbot Entry Point

**Ticket:** FE-18 — Route ChatScreen or remove; keep FloatingChatbot only
**Repo:** NutriHelp-App-2026
**Scope:** `src/screens/home/ChatScreen.jsx`, `src/components/FloatingChatbot/`,
`src/navigation/HomeStack.jsx`, `src/services/chatbotApi.js`

## Method

Searched for every reference to `ChatScreen` and `FloatingChatbot` across
`src/`, then read both implementations to compare functionality and API
usage before deciding which one should remain.

## Findings

### 1. `ChatScreen` is registered but never navigated to

`HomeStack.jsx` declares a `ChatScreen` route, but a repo-wide search for
`navigate("ChatScreen")` returns zero matches. It is unreachable dead
code, exactly like `ElderlyHomeScreen` was for FE-05 — except here the
correct call is the opposite one.

### 2. `FloatingChatbot` is the actual, working entry point

`FloatingChatbot` is mounted globally inside `AppNavigator`, above all
screens, and the "Ask AI" button on Home already calls `openChatbot()`
from `ChatbotContext` to open it. Its real UI lives in `ChatModal.jsx`.

### 3. `ChatModal` is meaningfully more complete than `ChatScreen`

| | `ChatModal` (FloatingChatbot) | `ChatScreen` |
|---|---|---|
| API call | `sendChatMessage()` from `chatbotApi.js` | raw `post()` from `baseApi` directly |
| Message history | persisted to `AsyncStorage` | resets every mount |
| Text-to-speech | yes (`expo-speech`, read-aloud per bubble) | no |
| Accessibility font scale | yes (`AccessibilityContext`) | no |
| List rendering | `FlatList` | `ScrollView` |

`ChatScreen` also bypasses `chatbotApi.js` with its own duplicate raw API
call — the opposite of what FE-06 is trying to establish.

### 4. `chatbotApi.js` (FE-06) as the single API path

`chatbotApi.js` itself still hardcodes its backend URL rather than using
`baseApi`/the env var — that's FE-06's own unresolved scope, not this
ticket's. What FE-18 requires is that **whichever entry point(s) remain**
route through `chatbotApi.js` as their one API path. `ChatModal` already
does this via `sendChatMessage()`; it is the only network call in the
UI that's kept.

## Decision

**Remove `ChatScreen` entirely, keep `FloatingChatbot` as the sole
chatbot entry point.** Unlike FE-05's `ElderlyHomeScreen` (complete,
working, worth wiring up), `ChatScreen` is an unreachable, inferior,
duplicate implementation with no unique functionality — deleting it is
the lower-risk, lower-maintenance option.

## Resulting changes

1. Removed the `ChatScreen` import and route registration from
   `src/navigation/HomeStack.jsx`.
2. Deleted `src/screens/home/ChatScreen.jsx`.
3. Confirmed no other file in `src/` references `ChatScreen` — no
   orphaned imports or navigation types remain.
4. Confirmed `FloatingChatbot`'s `ChatModal` already uses `chatbotApi.js`
   (`sendChatMessage`) as its single API path, satisfying that
   acceptance criterion without further changes.

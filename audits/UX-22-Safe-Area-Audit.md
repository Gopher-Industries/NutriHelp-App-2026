# UX-22 — Safe Area / Notch Handling Audit (P2)
Prepared by: Venkata | Verified against: `NutriHelp-App-2026` (main) + Dynamic Island simulation

---

## Summary

The ticket's premise — "13 screens including all of Login, Signup, MFA, and Forgot Password don't use SafeAreaView" — doesn't hold up against the actual code. A raw text search for `SafeAreaView`/`useSafeAreaInsets` returns 13 misses, but most of those are false positives once you check *how* each screen gets its layout:

- **6 auth screens** (Login, Signup, MFA, Forgot Password ×3) don't call `useSafeAreaInsets` themselves, but all six are wrapped in the shared `<AuthScreen>` component (`AuthComponents.jsx`), which does apply it — top and bottom — via manual padding math. They're already safe.
- **1 screen** (`MealPlanOverviewScreen`) is a one-line re-export of `WeeklyPlanScreen` (`export default WeeklyPlanScreen`), which already wraps content in `SafeAreaView`. Also already safe.
- **4 files** under `screens/meal/ai-plan/` (`FeedbackCard`, `PersonalisedPlanForm`, `PlanLoadingView`, `WeeklyPlanResults`) aren't standalone routed screens — they're sub-components rendered inside `AiMealPlanScreen`, which already has `SafeAreaView`. They inherit the inset from their parent and don't need their own.

**Real gap: 2 screens, not 13.**

---

## AC1 — Audit: every screen missing safe-area handling, prioritized

| Priority | Screen | Route | Issue |
|---|---|---|---|
| 1 | `HealthToolsScreen` | `HomeStack`, `AccountStack` | Fixed `pt-12` (48px) top padding instead of a real inset — no `SafeAreaView`/`useSafeAreaInsets` at all |
| 2 | `NutritionCalculatorScreen` | `MealStack` | Same issue, same fix |

Both are reachable early from Home (Health Tools is one tap from the home tab; Nutrition Calculator is one tap from Meals), so they're prioritized ahead of anything deeper in the navigation tree, per the "how early it appears in the journey" instruction — there's just nothing deeper in the tree that also qualifies, since everything else checked out.

**Screens confirmed already safe** (for the record, so this doesn't get re-flagged next sprint):

| Screen | How it's covered |
|---|---|
| Login, Signup, MFA, Forgot Password ×3 | Shared `AuthScreen` wrapper applies `useSafeAreaInsets` (top + bottom) |
| `MealPlanOverviewScreen` | Re-exports `WeeklyPlanScreen`, which has its own `SafeAreaView` |
| `FeedbackCard`, `PersonalisedPlanForm`, `PlanLoadingView`, `WeeklyPlanResults` | Sub-components inheriting `SafeAreaView` from parent `AiMealPlanScreen` |

---

## AC2 — Guideline for consistent safe-area application

- **Prefer `SafeAreaView` from `react-native-safe-area-context` with an explicit `edges` prop** over manual inset math. It's what 25 of the app's screens already use, and it's less error-prone than hand-rolling padding (the `AuthScreen` wrapper does the manual version and it works, but it's an extra thing to get right per-screen — no reason to add a third pattern).
- **Default to `edges={["top", "bottom"]}`** unless the screen has its own bottom tab bar or footer already absorbing the bottom inset — several existing screens correctly use `edges={["top"]}` only, for that reason. Check for a tab bar/footer before copying that shortened pattern.
- **Never use a fixed padding value** (`pt-12`, `paddingTop: 48`, etc.) to approximate a safe area. It's guessing a number that happens to work on the device someone tested on — `HealthToolsScreen` and `NutritionCalculatorScreen` are the two screens in the app that currently do this, and it's exactly why they're the two real gaps.
- **New screens should inherit this from a shared layout wrapper**, not reimplement it per screen — raising a follow-up ticket for this so the pattern doesn't drift again once UX-01 lands.

---

## AC3 — Auth screen priority

Ticket asks to treat Login/Signup/MFA/Forgot Password as top priority since they're first impressions. Correcting this rather than quietly following it: **these six screens are already safe** — no work needed on them for this ticket. Flagging in standup so the sprint doesn't spend time "fixing" something that isn't broken. The two screens that actually need the fix (`HealthToolsScreen`, `NutritionCalculatorScreen`) aren't first-impression screens, but they're still prioritized first simply because they're the only real gaps — see AC1.

---

## AC4 — Notched device simulation

Verified both real gaps against a Dynamic Island frame (iPhone 15/16 class — the tightest top-inset case in the current device matrix):

- **`HealthToolsScreen`**: with the current fixed 48px padding, the "Health Tools" heading sits right at the edge of the Dynamic Island cutout — about 28px of clear space, not enough for comfortable reading and at real risk of clipping on some device/OS combinations. Applying `SafeAreaView`/`useSafeAreaInsets` instead measures the actual ~59px inset and pushes content safely below it.
- **`NutritionCalculatorScreen`**: identical issue, identical fix, verified the same way.

Before/after mockups for both are in Figma under the UX-22 section (Dynamic Island frame, side-by-side comparison, red-flagged "28px gap" vs. green-flagged "safe 59px inset").

---

## What to actually change (dev-facing)

Two files, same one-line fix in each:

```
src/screens/health/HealthToolsScreen.jsx
src/screens/health/NutritionCalculatorScreen.jsx
```

Replace the `ScrollView` + `View className="p-4 pt-12"` wrapper with `SafeAreaView` (`edges={["top"]}`) around the existing `ScrollView`, dropping `pt-12` from the inner `View` since the safe area component now handles top spacing.

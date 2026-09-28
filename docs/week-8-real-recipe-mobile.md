# Week 8 — mobile real recipe preview

Branch: `feature/recipe-sources-mobile-hashem`, created from freshly fetched `upstream/main`. Initial worktree was clean. No backend or deployment configuration changes; no push or PR.

Implemented an optional accessible “Start from a real recipe” search in Create Recipe. It uses authenticated `baseApi` GET `/api/recipe-sources/search` and POST `/api/recipe-sources/map`, with three-character minimum, 400 ms debounce, abort signals and stale-response guards. Search failures are distinct from empty results. Preparation can be cancelled. A successful mapping offers an explicit Apply action so in-flight responses cannot overwrite ongoing manual edits. Applying preserves source ingredient measures and matched ids, keeps unsupported units visible, and lists missing fields for review. Preview never calls resolve-ingredients or writes ingredients.

Files: `src/api/recipeSourcesApi.js`, `src/components/RecipeSourceSearch.jsx`, `src/screens/recipes/buildSourcePrefill.js`, integration in `src/screens/recipes/CreateRecipeScreen.jsx`, and colocated tests for each.

Validation on 6 September 2026:

- All 12 new tests passed across four suites: client contract/errors, debounce and stale results, empty/error distinction, mapping retry/cancellation, deliberate application, prefill normalization, screen editing and imported-save guard.
- Full `npm test -- --silent`: 22 passed, 14 failed; six suites passed, four failed. Failures are in unchanged recipeApi (2), mealPlanApi (4), appointmentApi (4), notificationApi (4) tests and concern existing endpoint expectations/fallbacks. Those API modules and tests were not edited.
- `./node_modules/.bin/tsc --noEmit` is blocked by existing syntax errors in `src/utils/deepLinking.js:37–39`.
- Repository has no lint script or ESLint configuration. Babel transformation of all four changed implementation files passed; `git diff --check` passed.
- Native accessibility/device interaction has not been manually verified. Component tests mount React with lightweight native controls mocked.
- Live API verification blocked: no local canonical API listener was available. HTTPS localhost:8443 returned 502 (“orchestrator unreachable”), and localhost:80 was unreachable. No authentication was bypassed.

Local demonstration once the canonical API is running:

1. Launch Expo with `EXPO_PUBLIC_API_BASE_URL=http://localhost:<canonical-api-port> npm start -- --clear` for a simulator whose localhost reaches the host. Use the host LAN address on a physical phone or the emulator host address on Android. The base URL is the API host, without `/api`. This is a process override; the committed deployment configuration remains unchanged.
2. Sign in against that same API through the normal app flow. Open Create Recipe and type “chicken”. Select a search result, wait for preparation, then apply it.
3. Show editable name, cuisine, cooking method, ingredients and instructions; review missing fields. Source quantity text is preserved without inventing grams. Existing photo/nutrition remain entered values and are explicitly called out for review.
4. Try another query, clear it while searching, cancel preparation, and demonstrate failure preserving the form.

Save boundary: this slice demonstrates search → map → editable draft. The existing mobile create payload uses nested ingredients/steps; the canonical create controller expects ingredient_id, ingredient_quantity, ingredient_cost, total_servings and preparation_time arrays/scalars. Imported saving is explicitly guarded instead of risking dropped ingredients. The next slice must adapt the canonical save contract and resolve unmatched ingredients only after Save, with failure preserving the draft. Manual recipes retain the existing save behavior. No imported recipe was saved or claimed to be saved.

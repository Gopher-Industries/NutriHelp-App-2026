# FE-17 Audit: Barcode Lookup Source

**Ticket:** FE-17 — Use EXPO_PUBLIC_API_BARCODE_URL or document Open Food Facts choice
**Repo:** NutriHelp-App-2026
**Scope:** `src/screens/scan/BarcodeScannerScreen.jsx`, `src/screens/scan/ScanProductScreen.jsx`, `.env.example`

## Method

Repo-wide search for every barcode-related reference, every reference to
`EXPO_PUBLIC_API_BARCODE_URL`, and every reference to Open Food Facts, to
establish what the barcode flow actually does today before deciding anything.

```
grep -rniIl "barcode" src/**/*.{jsx,js}
grep -rniIl "openfoodfacts" src/**/*.{jsx,js}
grep -rn "EXPO_PUBLIC_API_BARCODE_URL" .
```

## Findings

### 1. `EXPO_PUBLIC_API_BARCODE_URL` is unused

Declared (blank) in `.env.example`. Zero matches anywhere else in `src/`.
No code path reads this variable. It has been dead config since it was
added.

### 2. The app already uses Open Food Facts, hardcoded directly

`BarcodeScannerScreen.jsx` implements a complete lookup flow against the
Open Food Facts public API:

- `fetchFromOpenFoodFacts(barcode)` calls
  `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
  requesting `product_name`, `allergens_tags`,
  `allergens_from_ingredients`, and `ingredients_text`.
- Response is parsed into a normalized shape (`name`, `barcode`,
  `productAllergens`, `detectedIngredients`) and rendered in the result
  sheet (allergen warning card, ingredient list, save-to-history action).
- `ScanProductScreen.jsx` only renders previously saved scan history and
  links into `BarcodeScannerScreen`; it holds no independent API/data
  logic of its own.

This means the "decision" the ticket asks for has, in effect, already been
made by whoever built the scanner — it was just never wired to the env var
or documented anywhere.

### 3. Not-found / error states (UX-13)

Partially implemented already, inline rather than as a dedicated banner:

- **Not found:** Open Food Facts returns `status: 0` when a barcode isn't
  in its database → surfaced as *"Product not found. Try entering the
  barcode manually."*
- **Network/fetch failure:** non-OK response → surfaced as *"Could not
  reach product database. Please try again."*
- **No dedicated offline-state UI** (e.g. an offline banner) exists yet.
  That's the explicit scope of **FE-10** (OfflineBanner + useOfflineCache
  wiring), not FE-17.

## Decision

**Formally commit to Open Food Facts** as the barcode data source, since
it's already fully implemented, working, and shipped — rebuilding this
against a private/paid barcode API would be redundant work with no
functional upside identified.

## Resulting changes

1. Remove the unused `EXPO_PUBLIC_API_BARCODE_URL=` line from
   `.env.example` (per the ticket's explicit acceptance criteria).
2. Add a short code comment above `fetchFromOpenFoodFacts()` in
   `BarcodeScannerScreen.jsx` documenting that Open Food Facts was a
   deliberate choice, for future contributors.
3. No changes needed to the not-found/offline handling — existing inline
   error states already cover the not-found case; full offline UX is
   tracked under FE-10, not duplicated here.

# NutriHelp Mobile App 2026

A cross-platform mobile application built with Expo (React Native) to help users track nutrition, scan food barcodes, discover recipes, and manage health and wellness goals.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 LTS or later |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` |
| Android Studio | Latest stable |

---

## Backend API

| Resource | URL |
|----------|-----|
| Base URL | https://nutrihelp-backend-deployment.onrender.com |
| Swagger Docs | https://nutrihelp-backend-deployment.onrender.com/api-docs |

The backend is hosted on Render. All API calls from the app go through `EXPO_PUBLIC_API_BASE_URL`. Check the Swagger docs for available endpoints, request/response schemas, and to test calls directly.

> Note: Render free tier spins down after inactivity — the first request may take ~30 seconds to wake the server.

---

## Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/Gopher-Industries/NutriHelp-App-2026.git
cd NutriHelp-App-2026

# 2. Install dependencies
npm install
npx expo install

# 3. Copy environment variables
cp .env.example .env
# EXPO_PUBLIC_API_BASE_URL is already set in .env.example — no change needed

# 4. Start the dev server
npx expo start
```

---

## Run on Android Emulator

1. Open Android Studio → Virtual Device Manager → create a Pixel 6 AVD (API 33).
2. Start the AVD.
3. With the Expo dev server running, press `a` in the terminal.

> Emulator setup steps: Open Android Studio → More Actions → Virtual Device Manager → Create Device → Phone → Pixel 6 → Next → API 33 (download if needed) → Finish.

---

## Run on Physical Android Device

Use the development build APK (see [Build Development APK](#build-development-apk) below). Install the APK on your device, then run:

```bash
npx expo start --dev-client
```

Scan the QR code or connect via LAN — full hot-reload without Expo Go.

---

## Build Development APK

```bash
# Login to EAS
eas login

# Build locally (outputs an .apk)
eas build --platform android --profile development --local
```

Distribute the generated `.apk` to team members for device testing.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Description | Pre-filled? |
|----------|-------------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL | Yes — Render deployment |
| `EXPO_PUBLIC_API_BARCODE_URL` | Barcode lookup API URL | No |
| `EXPO_PUBLIC_AI_MODEL_URL` | AI/ML model endpoint | No |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No |
| `EXPO_PUBLIC_FIREBASE_CONFIG` | Firebase config JSON string | No |

**Never commit `.env` to git.**

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready, protected — PRs required, 1 approval minimum |
| `develop` | Integration branch — merge feature branches here first |
| `feature/M-XX-description` | Individual feature work (e.g. `feature/M-13-login-screen`) |

**Workflow:** create a `feature/` branch from `develop` → open PR into `develop` → squash merge → periodically release `develop` → `master`.

---

## Project Structure

```
src/
├── api/           # API clients and fetch helpers
├── context/       # React context providers
├── hooks/         # Custom React hooks
├── utils/         # Utility/helper functions
├── navigation/    # React Navigation stacks, tabs, drawers
├── screens/       # Screen components grouped by domain
│   ├── auth/
│   ├── home/
│   ├── meal/
│   ├── recipes/
│   ├── scan/
│   ├── health/
│   ├── community/
│   ├── wellness/
│   └── account/
├── components/    # Shared UI components
└── styles/        # Global styles and Tailwind CSS
assets/            # Images, fonts, icons
```

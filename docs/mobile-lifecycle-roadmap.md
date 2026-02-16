# LifeOS Mobile (iOS + Android) Roadmap

## Stack
- Expo SDK 54 + React Native 0.81 + Expo Router
- Secure token storage with `expo-secure-store`
- Existing LifeOS backend (`/api/auth/*`, `/api/lifeos/*`)

## Current implementation (completed)
- Mobile app scaffold at `/Users/pro_coder/Documents/New project/apps/mobile`
- Route model:
  - `/(auth)/login`
  - `/(app)` main mobile home
- Auth flow:
  - login via `/api/auth/login`
  - token validation via `/api/auth/me`
  - per-user session persistence in SecureStore
- Mobile dashboard data:
  - `/api/lifeos/dashboard`
  - `/api/lifeos/live`
- Pull-to-refresh and deep links to live job/news URLs

## Next milestone: workflow actions on mobile
1. Add action buttons for run/approve/toggle:
- `POST /api/lifeos/actions/run`
- `POST /api/lifeos/approvals/update`
- `POST /api/lifeos/automations/toggle`
2. Reflect optimistic + server-confirmed state updates.
3. Add compact interaction feedback (haptics, loading states, error toasts).

## Offline-first milestone
1. Cache last dashboard snapshot locally.
2. Queue user actions offline and replay on reconnect.
3. Add conflict strategy (server-wins for dashboard metadata, merge for timeline append-only entries).

## Push notifications milestone
1. Register Expo push token and link to user profile.
2. Trigger push for approval-required tasks and daily brief.
3. Handle deep links into specific workflow/approval screens.

## Release readiness
1. EAS profiles for development, preview, production.
2. Store metadata, icons/splash, permissions review.
3. Sentry mobile instrumentation and crash monitoring.

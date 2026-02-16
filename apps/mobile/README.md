# LifeOS Mobile

Expo-based iOS/Android client for LifeOS.

## Prerequisites
- Node 20+
- Expo Go app (for quickest test cycle)

## Environment
Copy `.env.example` to `.env` and set backend base URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

If testing on a physical device, use your machine LAN IP instead of localhost.

## Run
```bash
cd apps/mobile
npm run start
```

Then open in:
- iOS simulator: `i`
- Android emulator: `a`
- Expo Go: scan QR code

## Demo credentials
- alex@lifeos.dev / demo1234
- career@lifeos.dev / demo1234
- family@lifeos.dev / demo1234

You can also create new accounts directly from the mobile login screen.

## Mobile features implemented
- Secure auth with token persistence (`expo-secure-store`)
- Live dashboard + pulse data from backend
- Action execution from mobile:
  - Run quick tasks
  - Approve/reject approvals
  - Pause/activate automations
- LLM control from mobile:
  - View active provider and model health
  - Switch LLM mode (`mock`, `openai`, `ollama`, `llamacpp`) per user
  - Run provider check to confirm actual execution provider/model from a live action run
- Offline-first behavior:
  - Cached dashboard/pulse snapshots (`AsyncStorage`)
  - Mutation queue (actions/approvals/automations)
  - Automatic replay on refresh/next successful connection
- Push notification foundation:
  - Device permission request and Expo push token registration
  - Backend token storage per authenticated user/device
  - Notification tap deep-link routing to approvals context
  - "Test Push" button (sends via Expo Push API)

## Push testing notes
- Real push delivery requires a physical device (not iOS simulator).
- `Test Push` uses backend route `/api/lifeos/push/test`.
- Ensure backend is reachable and token registration succeeded.

## Quick offline test
1. Login and load data once online.
2. Disable network on simulator/device.
3. Run a quick action and approve/reject an item.
4. Confirm banner shows queued operations.
5. Re-enable network and pull-to-refresh.
6. Confirm queued operations are replayed and queue count drops.

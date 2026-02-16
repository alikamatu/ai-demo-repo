# LifeOS API Contract

Base path: `/api`

## Authentication
All LifeOS endpoints require a bearer token.

### POST `/auth/login`
Request:
```json
{ "email": "alex@lifeos.dev", "password": "demo1234" }
```
Response includes `token` and `user`.

### GET `/auth/me`
Headers:
- `Authorization: Bearer <token>`

## LifeOS endpoints (`/api/lifeos/*`)
All require `Authorization: Bearer <token>` except SSE token query variant.

### Core
- `GET /dashboard`: per-user persisted snapshot
- `POST /reset`: reset current user workspace
- `POST /actions/run`: execute action
- `POST /approvals/update`: approve/reject
- `POST /automations/toggle`: pause/activate
- `GET /live`: external live pulse
- `GET /stream?token=<token>`: SSE events (`sync`, `pulse`)

### Push notifications
- `POST /push/register`
  - Request:
  ```json
  {
    "deviceId": "device-123",
    "platform": "ios",
    "token": "ExponentPushToken[...]"
  }
  ```
  - Stores/updates push token for authenticated user+device.

- `POST /push/test`
  - Sends a test push notification to all registered tokens for current user.
  - Payload includes deep-link data:
  ```json
  { "url": "/(app)/index?focus=approvals" }
  ```

## Data persistence
- User workspace state:
  - `/Users/pro_coder/Documents/New project/.data/lifeos-db.json`
- Push device/token registry:
  - `/Users/pro_coder/Documents/New project/.data/push-db.json`

## Upstream live providers
- Weather: Open-Meteo
- Jobs: RemoteOK
- News: HN Algolia API

Fallback values are returned when upstream providers fail.

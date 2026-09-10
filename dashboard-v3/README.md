# WhatsApp Bot V3 Dashboard

Mobile-first operations UI for the V3 control plane.

## Development

```bash
cd dashboard-v3
npm install
npm run dev
```

Vite proxies `/api`, `/api/v1/ws`, and `/health` to the V3 server on `127.0.0.1:3000`. Authentication uses the V3 HttpOnly session cookie; mutating REST requests automatically send the `v3_csrf` cookie value in `X-CSRF-Token`.

Current scope: login/logout, current user, instance list, lifecycle controls, realtime worker events, and instance creation with **phone-number pairing codes** (no QR). Production builds are served by the V3 API server (same origin). Commands, scanner, task history, audit views, and settings are subsequent slices.

# Web App (Next.js) – Help Desk Rosters

This app consumes the Flask v2 API and provides Admin (Schedule/Profile) and Assistant (Dashboard/Profile) views. Time Tracking and Requests are stubbed with toasts for now.

## Dev Proxy (No CORS)
Requests are proxied via Next.js rewrites:
- `/api/v2/*` → `http://localhost:8080/api/v2/*`
- `/api/*` → `http://localhost:8080/api/*`

Env uses a relative base so the proxy is used:
```
NEXT_PUBLIC_API_BASE_URL=/api/v2
```

## Auth Transport
Currently uses Bearer tokens in headers:
- `POST /api/v2/auth/login` returns `{ token }` (or `data.token`)
- Token is stored in a cookie named by `NEXT_PUBLIC_AUTH_COOKIE_NAME` and added to `Authorization: Bearer <token>` for all requests.

If your backend only sets HttpOnly cookies and does not return a token, you can:
1) Update Flask to also return `token` in the login JSON, or
2) Switch the client to cookie-based transport (use `credentials: 'include'` and stop sending `Authorization`).

## Env Vars (apps/web/.env)
- `NEXT_PUBLIC_API_BASE_URL=/api/v2`
- `NEXT_PUBLIC_AUTH_COOKIE_NAME=access_token|auth_token` (must match backend)
- `JWT_ALG=HS256` and `JWT_SECRET=...` for HS* or set `JWT_JWKS_URL` and `JWT_ALG=RS256` for RS*.
- `NEXT_PUBLIC_AUTH_MODE=` (set to `mock` to bypass auth in dev)

## CORS & Deployment
With rewrites, you don’t need CORS for local dev. For direct cross-origin deployments:

Flask (using Flask-CORS):
```python
from flask_cors import CORS

CORS(
    app,
    resources={r"/api/v2/*": {"origins": ["https://your-frontend.example", "http://localhost:3001"]}},
    supports_credentials=True,  # if using cookies
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)
```

Cookies (if using HttpOnly):
- Use `SameSite=None; Secure; Path=/` for cross-site cookies (requires HTTPS)
- Ensure `supports_credentials=True` in Flask-CORS and `credentials: 'include'` on the client

## Run
```powershell
cd apps/web
npm install
npm run dev
```

Backend should run at `http://localhost:8080`.

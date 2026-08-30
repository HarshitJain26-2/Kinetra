# Kinetra Backend — Production Deployment & Operations Guide

> **Document Version**: 1.0.0 (Phase 26)  
> **Runtime Target**: Node.js $\ge 20.x$ LTS / TypeScript  
> **Health Probe**: `GET /health`

---

## 1. Environment Configuration

### Required Production Environment Variables

| Variable | Type | Description | Example |
|---|---|---|---|
| `PORT` | `number` | Port for the HTTP server | `5000` |
| `NODE_ENV` | `string` | Environment runtime flag | `production` |
| `SUPABASE_URL` | `string` | HTTPS project URL for Supabase instance | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | `string` | Public anonymous key for client auth SDK operations | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Confidential admin service-role key (server-only) | `eyJhbGciOi...` |

### Optional Performance & Security Tuning

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated for multiple origins, e.g. `https://app.kinetra.com`) |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15m) | Abuse protection sliding window in milliseconds |
| `RATE_LIMIT_MAX` | `500` | Maximum allowed API requests per IP per window |

> 🔒 **Security Rules**:
> - Never commit `.env` files into source control.
> - Never share `SUPABASE_SERVICE_ROLE_KEY` with mobile clients or web frontends.
> - On server startup in `NODE_ENV=production`, `validateEnv()` runs automatically to verify all required variables are configured.

---

## 2. Build & Runtime Execution

### Production Build
```bash
npm run build
```
Compiles TypeScript source from `src/` to JavaScript files in `dist/` with zero compile errors.

### Production Start
```bash
npm start
```
Executes `node dist/src/index.js`, running the compiled server with graceful shutdown listeners attached for `SIGTERM` and `SIGINT`.

---

## 3. Database Migration Sequence

All schema definitions and RLS policies must be applied in the following strict chronological order:

1. `migrations/001_initial_schema.sql` — Base tables, constraints, enums, triggers, and timestamp handlers.
2. `migrations/002_seed_exercises.sql` — Deterministic exercise catalog seed data.
3. `migrations/003_security_rls_hardening.sql` — Row Level Security policies, ownership predicates, and security definer functions.

---

## 4. Health & Liveness Probes

- **Health Endpoint**: `GET /health`
- **Response Format**:
  ```json
  {
    "status": "ok",
    "environment": "production",
    "timestamp": "2026-08-30T13:00:00.000Z",
    "version": "1.0.0"
  }
  ```
- **Probe Safety**: Does not leak environment secrets, database credentials, internal filesystem paths, or stack traces.

---

## 5. Security & Error Handling

- **Error Sanitization**: In `NODE_ENV=production`, all unexpected 500 errors return a sanitized generic error envelope (`An unexpected error occurred. Please try again later.`) and suppress stack traces from client responses.
- **Abuse Protection**: In-memory rate limiting rejects request floods exceeding threshold with HTTP `429 RATE_LIMIT_EXCEEDED` and `Retry-After` headers.
- **Authentication**: All `/api/v1/*` endpoints require standard JWT verification via `Authorization: Bearer <access_token>`.

---

## 6. Staging & Production Verification Checklist

- [x] TypeScript compilation passes (`npm run build`) with 0 errors.
- [x] All 294 automated unit and integration tests pass green (`npm test`).
- [x] Startup validation triggers and halts on missing secrets in production mode.
- [x] Rate limiting protects API endpoints from burst abuse.
- [x] Centralized error handler sanitizes internal 500 errors.
- [x] Graceful shutdown traps `SIGTERM` and `SIGINT` signals cleanly.
- [ ] Staging database migration execution & live RLS validation (*Pending staging instance*).

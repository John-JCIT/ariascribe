# Aria Scribe – API Security & Rate‑Limiting Guide

This document distils the security architecture discussed and provides **copy‑ready snippets** to ensure no privileged data is exposed to the browser while maintaining performant, rate‑limited APIs.

---

## 1  Zero‑secret front‑end principle

| Secret                        | Safe location (never the browser)               | Browser alternative |
| ----------------------------- | ----------------------------------------------- | ------------------- |
| Supabase **service‑role** key | NestJS env (`process.env.SUPABASE_SERVICE_KEY`) | Call Nest endpoint  |
| Database password             | `PGPASSWORD` env var or Vault                   | n/a                 |
| JWT signing secret            | GoTrue env (`JWT_SECRET`)                       | Receives signed JWT |

> **Rule:** any key that can bypass RLS or escalate privileges stays server‑side.

---

## 2  Two‑token pattern (short‑lived JWT + refresh cookie)

1. **Public anon key** (safe to embed) — grants *read‑only, RLS‑protected* access via PostgREST if needed.
2. **Clinician JWT** (15‑minute expiry) — stored as **http‑only, SameSite=strict, Secure** cookie.
3. **Refresh token** (24‑hour expiry) — http‑only cookie; POST `/auth/refresh` issues new access token.

```
Browser ── GET /auth/login ──► NestJS ── GoTrue ──► JWT (15 m) + Refresh (24 h)
```

*Tokens are never saved in **`localStorage`**, protecting against XSS steal‑and‑run.*

---

## 3  Endpoint split

| Endpoint type                                   | Implementation        | Auth method             | Notes                                   |
| ----------------------------------------------- | --------------------- | ----------------------- | --------------------------------------- |
| **CRUD** (patients, consultations)              | **PostgREST**         | Clinician JWT           | RLS ensures tenant isolation.           |
| **Business logic** (generate note, MBS suggest) | **NestJS**            | Bearer JWT OR cookie    | Runs with service‑role key server‑side. |
| **Admin / internal**                            | NestJS private routes | `service_role` JWT only | Hidden from public OpenAPI spec.        |

---

## 4  Transport‑level security

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; object-src 'none'; frame-ancestors 'none';";
add_header X-Content-Type-Options nosniff;
add_header Referrer-Policy strict-origin;
```

- **CORS:** allow origins `https://app.ariascribe.com`, `https://dev.ariascribe.com` only.
- **Cookies:**
  ```http
  Set-Cookie: access_token=…; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
  ```

---

## 5  API rate‑limiting (Kong example)

### 5.1  Global per‑IP limit

```yaml
_format_version: "3.0"
services:
  - name: postgrest
    url: http://127.0.0.1:3000
    routes:
      - name: postgrest-route
        paths: ["/rest/"]
        plugins:
          - name: rate-limiting
            config:
              minute: 120
              policy: local
              limit_by: ip
```

### 5.2  Per‑clinician limit (JWT claim)

```yaml
plugins:
  - name: rate-limiting-advanced
    config:
      limit_by: header
      header_name: x-clinician-id        # Set by a Kong pre-function parsing JWT `sub` claim
      minute: 300
```

*Add a Kong ****pre‑function**** plugin to extract **`sub`** from JWT and set **`x-clinician-id`** header.*

---

## 6  Additional hardening moves

| Concern                   | Mitigation snippet                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Replay / token theft**  | Rotate `JWT_SECRET` quarterly; set `jti` + Redis blacklist on logout.                  |
| **GraphQL introspection** | `app.useGraphQLExplorer(false)` in prod.                                               |
| **Over‑fetching**         | PostgREST `max-rows = 1000`; NestJS `paginate(limit: 100)`.                            |
| **XSS stealing cookies**  | Strict CSP + SameSite cookies block JS exfiltration.                                   |
| **Key rotation**          | Store secrets in HashiCorp Vault; issue short TTL tokens to systemd via `vault agent`. |

---

## 7  Public vs internal OpenAPI specs

1. `` — only browser‑reachable endpoints; example tokens redacted.
2. `` — superset incl. service routes; protected via basic auth.

Generate both from the same source YAML via tags:

```yaml
paths:
  /patients:
    get:
      tags: [public]
  /internal/trigger-note-bulk:
    post:
      tags: [internal]
```

Then filter:

```bash
yq e 'del(.paths[] | select(.tags[] == "internal"))' aria-scribe.yaml > public.yaml
```

---

## 8  Pre‑launch security checklist

-

> **Pass these checks → you’re clear to expose the API publicly.**


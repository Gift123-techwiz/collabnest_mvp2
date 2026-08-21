# CollabNest Backend

Talent-side MVP backend for CollabNest — Node.js, Express, TypeORM, PostgreSQL.
Plain JavaScript throughout (no TypeScript, no Prisma). TypeORM entities are
defined with `EntitySchema`, which needs no decorators.

## Scope

Must + Should features from the PRD / Functional Requirements only.
**Out of scope for this build (by explicit client decision):**
- Email notifications/verification — everything is in-app only, to avoid
  issues with free hosting providers that block outbound SMTP.
- Recruiters — Phase 3 in every spec doc; nothing recruiter-related exists
  anywhere in this codebase.
- MFA — Phase 2 per the security doc, and there's no admin panel in this
  build's scope.
- Anything else marked Could / Phase 2 in the FR doc (OAuth login,
  badges/certificates, AI features).

**Additions beyond the original spec docs** (agreed with the client):
- Optional workspace link (WhatsApp/ClickUp/etc.) settable by the project
  owner at acceptance time *or any time after* — never required. The member
  is notified every time it's set or changed. If no link is set, both sides
  get a "check your profile / reach out directly" notification instead.
- Optional rejection reason on applications, sent to the applicant.
- Deliverable links captured when a member leaves a project, so their
  portfolio isn't unfairly hurt if the rest of the team stalls.
- Full profile-completion percentage + progress bar (not just a reminder
  notification) — 8 weighted fields, ≥80% marks the profile complete.
- Shareable public profile link endpoint.
- `dateOfBirth` at registration (PRD data-collection requirement); `age` is
  always derived from it at read time, never stored, so it can't go stale.
  Minimum age 16 (PRD recommendation, target audience includes minors).

## Payments (Paystack)

Added after the original build, per the client's finalised pricing:

| Plan | Price | Team cap (incl. owner) | Rules |
|---|---|---|---|
| Free | ₦0 | 4 | Months 1–2 free automatically at project creation. Month 3 costs a one-time ₦2,500 extension. Usable **once ever** per project — after that, must upgrade. |
| Standard | ₦3,500/mo | 6 (7th seat forces Advanced) | Pay 1, 6 (₦21,000), or 12 (₦42,000) months upfront. No discount. Renewable. |
| Advanced | ₦5,000/mo | 12 | Same rules, 6mo=₦30,000, 12mo=₦60,000. |

- **Currency**: Paystack always charges a fixed NGN amount. International
  cards are converted by the card network at their own live rate at charge
  time — there is no custom FX API in this codebase (client decision).
- **Access lock**: no cron job (works fine on free hosting) — instead,
  `subscriptionService.lazyRefreshAccess()` checks `subscriptionExpiresAt`
  every time a project is read or acted on, and flips it to the
  `payment_required` status on the spot if it's lapsed. The project's prior
  status is snapshotted (`statusBeforeLock`) so paying again restores it
  exactly. Owners can still archive a locked project; members can still
  leave one. Every other action (applying, accepting, tasks, workspace
  link) is blocked with a 402 until the owner pays again.
- **Team size cap** is enforced at the moment a seat is actually filled
  (`applicationService.accept`), not at role-creation — an owner can post
  more openings than the current cap and just won't be able to fill past it
  without upgrading.
- **Audit log**: every payment lifecycle event (initiated/succeeded/failed)
  is appended to `payment_events`, per the security doc's Module 11
  requirement. Nothing in this table is ever updated or deleted.
- **Webhook**: `POST /webhooks/paystack` (outside `/api`, no auth — trust
  comes from the verified HMAC signature). Registered in `app.js` *before*
  `express.json()` so it gets the raw body the signature check needs.
  Configure this URL in the Paystack dashboard.
- **Idempotency**: both the webhook and the frontend's post-checkout
  `GET /billing/verify` call `applySuccessfulPayment()`, which checks
  `payment_events` for an existing `succeeded` row on that reference before
  doing anything — safe if both fire for the same payment.

## Security posture

Reconciled against the two cybersecurity docs — see inline comments at each
decision point for the reasoning:
- Password policy: **8+ characters, one number** (PRD wins over the
  security docs' 10+/12+ — explicit client decision).
- Access/refresh token lifespan tightened to 15 min / 7 day rotating,
  matching the security doc (no PRD conflict).
- Rate limits: 10 req/min on auth endpoints, 5 failed logins/min, 60
  req/min on project search — all per the security doc.
- CSP + Helmet security headers applied globally (`app.js`).
- No email verification (client decision — see Scope above); rate limiting
  and validation are the anti-spam controls instead.
- MFA and a formal admin role are not implemented — flagged as fast-follows,
  not blocking for this MVP.

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit DB_*, JWT_*, CLOUDINARY_*, PAYSTACK_* as needed
npm run migration:run  # creates all tables (synchronize is OFF) — runs both migrations in order
npm run seed            # seeds Skills + Categories taxonomy
npm run dev              # starts on http://localhost:5000
```

For local Paystack webhook testing, use the Paystack CLI or a tunnel (e.g.
`ngrok http 5000`) and point the webhook URL in your Paystack test-mode
dashboard at `https://<tunnel>/webhooks/paystack`.

Health check: `GET /health`

## Architecture

```
src/
  config/       env, TypeORM DataSource, Cloudinary, Paystack client
  entities/     TypeORM EntitySchema definitions (18 entities)
  controllers/  thin HTTP handlers — parse req, call service, format res
  services/     all business logic + authorization rules
  repositories/ thin TypeORM repository wrappers
  routes/       Express routers, one file per resource domain
  middleware/   auth, error handling, rate limiting, upload, validation
  validators/   plain-function request validators (no schema library)
  utils/        constants, JWT, password hashing, response helpers, pagination
  migrations/   hand-written SQL migrations (synchronize: false)
  seeders/      Skills + Categories taxonomy seed data
```

### Why `synchronize: false`

TypeORM's `synchronize: true` can silently drop or alter columns on schema
mismatches — dangerous on a shared or production database. Instead, the full
schema lives in `src/migrations/1700000000000-InitSchema.js`. Run
`npm run migration:run` after cloning and after pulling any future schema
change; `npm run migration:revert` undoes the last one.

### Authentication

JWT access tokens (short-lived, `Authorization: Bearer <token>`) + opaque
refresh tokens (long-lived, stored hashed in `refresh_tokens`, rotated on
every refresh). No email verification step (out of scope) — an account is
usable immediately after registration.

### Notifications

In-app only (see `notificationService.js`). Two types
(`application_accepted`, `application_rejected`) are "locked" and always
fire regardless of user preference, since they're critical to the
team-formation loop. Everything else can be toggled off per-user via
`PATCH /api/users/me/notification-preferences`.

### The "one active project" rule

A user can only be `active` on one project's membership at a time
(`users.active_project_id`). Accepting an applicant who's already active
elsewhere is rejected with a 409 — they must leave their current project
first. This mirrors the PRD's stated focus rule.

## Testing the API

See `docs/CollabNest_API_Testing.md` for a full route-by-route reference
(method, auth requirement, sample request/response) and import
`docs/CollabNest.postman_collection.json` directly into Postman — it's
pre-wired with a `{{baseUrl}}` variable and auto-saves `{{accessToken}}` /
`{{refreshToken}}` from the login/register response via a test script, so
you can run the whole collection without manually copying tokens between
requests.

# CollabNest MVP

```
collabnest_mvp/
├── backend/     — unmodified, as provided
└── frontend/    — new React frontend, wired to the backend's real API
```

## Run it

**Backend** (unchanged from what you provided):

```bash
cd backend
cp .env.example .env   # fill in your DB / JWT / Paystack values
npm install
npm run migration:run
npm run seed
npm run dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL defaults to http://localhost:5000/api
npm install
npm run dev
```

Then open `http://localhost:5173`.

See `frontend/README.md` for how the UI maps to the backend, the brand
implementation, and one flagged limitation (peer-to-peer ratings after
project completion — see below).

## What was verified before building

Every route, controller, service, validator, and entity in `backend/src`
was read end to end before writing a single line of frontend code, so the
frontend uses only endpoints, fields, and response shapes that genuinely
exist — nothing was invented. The backend already implements every custom
requirement you listed (optional workspace links with the owner reminder
popup, rejection reasons, deliverable links on leave, 80% profile
completion, shareable profile links, no email notifications, and the exact
Free/Standard/Advanced Paystack pricing tiers).

## The one thing I flagged instead of faking

`GET /projects/:id/members` only returns *active* members. The moment a
project is marked complete, memberships flip to `completed` status, so that
endpoint returns an empty list — for everyone, including the owner. There's
no endpoint for a non-owner to see who else was on a completed team.

Rather than invent a new backend route to paper over this, the frontend
works within the real constraint:
- The **project owner** can rate teammates from the Team tab, sourced from
  the accepted-applications list (which stays available regardless of
  project status).
- A **team member** can rate the **project owner** directly from the
  project page (the owner's profile is always embedded in the project
  response, at any status).
- A member rating *other* members isn't exposed in the UI, because there's
  no reliable way to discover who they were after completion without a new
  endpoint.

If full peer-to-peer rating matters for the MVP, the smallest fix is a
backend addition like `GET /projects/:id/members?status=all` (owner or
former-member accessible) — happy to add that if you want it before launch.

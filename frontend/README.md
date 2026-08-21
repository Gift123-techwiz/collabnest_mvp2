# CollabNest — Frontend

React 19 + Vite frontend for CollabNest, wired to the existing Express/PostgreSQL
backend in `../backend`. Plain JavaScript (no TypeScript), SCSS for styling,
`react-router-dom` for routing — matching the stack of the original frontend
this replaces.

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Make sure the backend is running at
the URL configured in `VITE_API_BASE_URL` (default `http://localhost:5000/api`).

## Folder layout

```
frontend/
├── src/
│   ├── api/            # One file per backend resource — thin wrappers around fetch
│   ├── components/
│   │   ├── ui/          # Design-system primitives (Button styles live in CSS, Modal, Avatar, Icon, etc.)
│   │   ├── layout/       # AppShell (sidebar/topbar), NotificationBell, ProtectedRoute
│   │   └── project/     # Apply/Leave/Rate modals, ProjectCard
│   ├── context/          # AuthContext, ToastContext, NotificationsContext
│   ├── pages/            # One folder per route area
│   ├── styles/           # _variables.scss (brand tokens), _base.scss, _ui.scss, _pages.scss
│   └── utils/constants.js
├── .env.example
└── package.json
```

## Brand implementation

Colors, type scale, and weights come directly from the CollabNest brand
strategy doc: Bright Blue `#2563EB` (primary, 70%), Deep Navy `#0D1B2A`
(secondary/headings/nav, 20%), Purple `#7C3AED` and Green `#22C55E` (accents,
10% — used for "featured" and "verified/success" states respectively),
Off-White `#F8FAFC` background, Light Gray `#E5E7EB` borders. Typeface is
Manrope end to end, loaded from Google Fonts in `index.html`, at the weights
specified in the brand doc (800 logo, 700 headings, 600 subheadings, 400
body, 500 UI elements).

## How the frontend maps to the backend

Every API call in `src/api/` is a direct, 1:1 wrapper around a real backend
route — there are no invented endpoints, fields, or mock data anywhere in the
app. A few flows worth knowing about:

- **Auth** — access/refresh tokens are stored in `localStorage`. The fetch
  client (`src/api/client.js`) automatically retries a request once after a
  silent token refresh on a `401`, and redirects to `/signin` if the refresh
  itself fails.
- **Accepting an applicant** — the workspace-link field is always optional.
  If the owner accepts without one, the API returns an `ownerReminder` which
  the UI shows as a one-time popup reminding the owner they can just contact
  the applicant from their profile instead. The applicant is notified either
  way (workspace link vs. "check your contact info").
- **Leaving a project** — the leave modal collects an exit reason and
  optional deliverable links, so a member's completed work isn't lost from
  their record even if the rest of the team stalls.
- **Ratings after completion** — `GET /projects/:id/members` only returns
  *active* members, which becomes an empty list the moment a project is
  marked complete (memberships flip to `completed` status). Since there's no
  endpoint to enumerate a completed roster for non-owners, the UI works
  within that real constraint: the **owner** rates teammates from the Team
  tab (sourced from the always-available accepted-applications list), and a
  **member** rates the **project owner** directly from the project page
  (the owner's public profile is always embedded in the project response).
  Rating any other teammate isn't exposed in the UI, because there's no
  reliable way to discover who they are post-completion without inventing a
  new endpoint.
- **Billing** — Free plan (₦0, months 1–2, one-time use), Standard (₦3,500/mo)
  and Advanced (₦5,000/mo) exactly match the pricing rules given, including
  the one-time ₦2,500 Free-plan Month-3 extension and the 1/6/12-month caps
  with no bulk discount. Paystack is NGN-only — foreign cards are converted
  automatically by the card network, so there's no custom FX handling in
  either the frontend or backend.
- **No email, anywhere** — every notification is in-app only, matching the
  backend's design (keeps this deployable on free tiers of Render/Railway
  without an email provider).

## Known limitation worth flagging

Team member rating (see above) is the one place the backend's data model
doesn't fully support what was asked ("rate your teammates" for everyone,
not just the owner). This wasn't patched with a new endpoint per your
instruction to flag rather than invent — happy to add a
`GET /projects/:id/members?status=completed` endpoint (or similar) on the
backend if you'd like full peer-to-peer rating after project completion.

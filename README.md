# KaamSetu

> A calm, modern workforce-management workspace for small businesses and part-time teams.

KaamSetu helps shop owners plan shifts, manage staff, review coverage, and keep everyone aligned from one simple interface. Staff get a focused mobile-friendly view of their upcoming work, availability, and updates.

## Product overview

### For owners

- Overview dashboard with staffing, hours, coverage, and open-gap summaries.
- Shop setup for business details, hours, and required roles.
- Staff management with search, roles, rates, availability, and status.
- AI Shift Planner demo with draft generation, uncovered-shift indicators, and editable shifts.
- Weekly schedule calendar and responsive shift list.
- Reports and estimated payroll calculated from scheduled hours multiplied by hourly rates.
- Profile and password settings backed by Supabase authentication.

### For staff

- Personalized overview with the next upcoming shift.
- Weekly schedule with shift time, role, and shop details.
- Availability preferences and day-off request interface.
- Notifications and announcements.
- Profile and password settings.

### Public experience

- Responsive landing page with product preview and feature sections.
- Supabase email/password sign-up and login.
- Owner/staff role selection during registration.
- About and Contact pages.
- Styled 404 fallback for unknown routes.

## Tech stack

- React 19
- Vite
- React Router
- Supabase JavaScript client
- React Icons
- ESLint
- CSS with shared design tokens and responsive layouts

The `backend/` directory is reserved for future server-side integrations. The current frontend connects directly to Supabase for authentication and profile operations.

## Repository structure

```text
KaamSetu/
├── frontend/
│   ├── src/
│   │   ├── components/       Shared dashboard layout and navigation
│   │   ├── pages/            Landing, auth, dashboards, About, Contact
│   │   ├── App.jsx           Application routes
│   │   ├── index.css         Global design tokens and primitives
│   │   └── supabaseClient.js Supabase browser client
│   ├── package.json
│   └── vite.config.js
├── backend/                  Reserved for future server-side services
├── package.json              Root convenience scripts
└── README.md
```

## Getting started

### Requirements

- Node.js 18 or newer
- npm
- A Supabase project for authentication and profile data

### Install

From the repository root:

```bash
npm install
npm install --prefix frontend
```

### Configure Supabase

Create `frontend/.env` using the available example file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The browser client uses only the public Supabase URL and anon key. Never put a service-role key or another private credential in a `VITE_*` variable.

The current authentication flow expects these Supabase tables and fields:

- `profiles`: `id`, `full_name`, `user_type`
- `staff_roles`: `staff_id`, `role`
- `attendance_logs`: used by legacy attendance integrations where available

Row Level Security should be configured in Supabase before using the application with real users.

### Run locally

```bash
npm run dev
```

The frontend development server is normally available at the Vite URL shown in the terminal.

## Scripts

Run from the repository root:

```bash
npm run dev       # Start the frontend development server
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run preview   # Preview the production build locally
```

Equivalent commands can be run from `frontend/` with `npm run dev`, `npm run lint`, `npm run build`, and `npm run preview`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and authentication |
| `/owner-dashboard` | Owner workspace |
| `/staff-dashboard` | Staff portal |
| `/about` | Product story and values |
| `/contact` | Contact form demo |
| `*` | 404 fallback |

## Demo data and current limitations

This phase is a frontend redesign. Dashboard scheduling, staff-management additions, shop setup, availability changes, and payroll views use clearly labeled local/demo data where a production persistence API is not yet available. These interactions do not claim to save changes to Supabase.

The Contact form also has a frontend-only success state and does not send or store a message on a server.

The AI Shift Planner is intentionally a safe demo workflow. It does not call an AI provider, expose an API key, or create a fake backend endpoint. A future scheduling service can be connected behind the existing planner UI.

## Security and environment files

- Do not commit `frontend/.env` or `backend/.env`.
- Do not expose Supabase service-role credentials to the browser.
- Keep authorization enforced by Supabase policies/backend services; hiding an owner route in the UI is not a security boundary.
- Do not run destructive database migrations against a production Supabase project without review.

## Contributing

1. Create a focused branch for your change.
2. Keep reusable UI in `frontend/src/components/` and page-specific UI in `frontend/src/pages/`.
3. Preserve existing authentication and route behavior unless the change explicitly requires otherwise.
4. Run `npm run lint` and `npm run build` before opening a pull request.
5. Document any new environment variables or Supabase schema requirements.

## License

No license has been declared for this repository yet. Contact the repository owner before redistributing the code.

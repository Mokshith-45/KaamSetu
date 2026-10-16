# KaamSetu

<p align="center">
  <strong>Workforce management that keeps small teams moving.</strong><br />
  Plan shifts, manage staff, and keep everyone aligned from one calm workspace.
</p>

<p align="center">
  <a href="https://github.com/Mokshith-45/KaamSetu"><img src="https://img.shields.io/github/last-commit/Mokshith-45/KaamSetu?logo=git" alt="Last commit" /></a>
  <a href="https://github.com/Mokshith-45/KaamSetu"><img src="https://img.shields.io/github/repo-size/Mokshith-45/KaamSetu?logo=github" alt="Repository size" /></a>
  <a href="https://github.com/Mokshith-45/KaamSetu/issues"><img src="https://img.shields.io/github/issues/Mokshith-45/KaamSetu" alt="Open issues" /></a>
  <a href="https://github.com/Mokshith-45/KaamSetu/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-not%20specified-lightgrey" alt="License not specified" /></a>
</p>

## Overview

KaamSetu is a React and Vite workforce-management application designed for small businesses and part-time teams. Owners can review staffing coverage, organize employees, prepare weekly schedules, and estimate payroll. Staff get a focused portal for upcoming shifts, availability, notifications, and profile settings.

The current release is a polished frontend phase. Supabase authentication and profile operations are connected; scheduling, reporting, and several management actions intentionally use clearly labeled demo data until the production data services are implemented.

## Highlights

### Owner workspace

- Overview cards for staff, scheduled shifts, planned hours, and coverage gaps.
- Shop setup form for business details, hours, and required roles.
- Searchable staff-management table with role, rate, availability, and status.
- AI Shift Planner demo with loading state, draft shifts, conflict indicators, and regeneration.
- Weekly schedule calendar with responsive list presentation.
- Estimated payroll reports using `scheduled hours × hourly rate`.
- Profile and password settings connected to Supabase.

### Staff portal

- Personalized next-shift overview.
- Weekly schedule with role, hours, shop, and confirmation status.
- Availability preferences and day-off request interface.
- Notifications and announcements.
- Profile and password settings.
- Mobile-first layout for quick access between shifts.

### Public experience

- Responsive landing page with product preview and feature sections.
- Email/password authentication through Supabase.
- Owner/staff role selection during sign-up.
- About and Contact pages.
- Styled fallback page for unknown routes.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19 |
| Build tool | Vite |
| Routing | React Router |
| Authentication/data | Supabase JavaScript client |
| Icons | React Icons |
| Styling | CSS design tokens and responsive layouts |
| Quality | ESLint |

## Prerequisites

Before starting, install:

- [Node.js](https://nodejs.org/) 18 or newer
- npm
- A Supabase project with email/password authentication enabled

## Quick start

### 1. Clone the repository

```bash
git clone https://github.com/Mokshith-45/KaamSetu.git
cd KaamSetu
```

### 2. Install dependencies

```bash
npm install
npm install --prefix frontend
```

### 3. Configure Supabase

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

The browser client reads these values from [supabaseClient.js](./frontend/src/supabaseClient.js). Only use the public anon key in the frontend. Never expose a Supabase service-role key through a `VITE_*` variable.

The current authentication flow expects the following tables and fields:

```text
profiles
├── id
├── full_name
└── user_type        owner | staff

staff_roles
├── staff_id
└── role
```

`attendance_logs` may be used by existing attendance integrations where that table is available. Configure Row Level Security before connecting real users.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Commands

Run these from the repository root:

```bash
# Start the frontend development server
npm run dev

# Check JavaScript and JSX with ESLint
npm run lint

# Create a production build
npm run build

# Serve the production build locally
npm run preview
```

The same commands are available from `frontend/` using that directory's `package.json`.

## Usage

### Create an account

1. Open `/`.
2. Select **Get started**.
3. Choose **Shop owner** or **Staff member**.
4. Enter a name, email, and password.
5. If Supabase email confirmation is enabled, confirm the email before signing in.

### Sign in

```text
Landing page → Sign in → email/password → role-specific dashboard
```

After login, KaamSetu reads the user's `profiles.user_type` value and routes the user to:

```text
owner  → /owner-dashboard
staff  → /staff-dashboard
```

### Explore the main routes

| Route | Description |
| --- | --- |
| `/` | Landing page and authentication |
| `/owner-dashboard` | Owner workspace |
| `/staff-dashboard` | Staff portal |
| `/about` | Product purpose, values, and benefits |
| `/contact` | Frontend-only contact form |
| Any unknown path | Styled 404 fallback |

### Demo scheduling flow

1. Sign in as an owner.
2. Open **AI Shift Planner**.
3. Choose a week and maximum hours.
4. Select **Generate demo draft**.
5. Review the draft shifts and uncovered-period indicator.
6. Edit or remove draft items as needed.

The planner is intentionally local and safe: it does not call an AI provider, persist shifts, or expose an API key.

## Project structure

```text
KaamSetu/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── DashboardLayout.css
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── StaffDashboard.jsx
│   │   │   ├── About.jsx
│   │   │   └── Contact.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── supabaseClient.js
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/                  Reserved for future server-side services
│   ├── tests/
│   └── .env.example
├── package.json              Root convenience scripts
└── README.md
```

## Architecture notes

- Shared dashboard navigation and responsive layout live in `frontend/src/components/`.
- Page-specific presentation remains alongside each page in `frontend/src/pages/`.
- Global colors, typography, focus states, buttons, fields, and badges are defined in `frontend/src/index.css`.
- Supabase authentication is kept in the existing frontend client rather than introducing a second backend.
- Demo operations are kept separate from Supabase calls so production scheduling and persistence can be added later.

## Demo limitations

This repository currently focuses on the frontend experience:

- Dashboard schedules and staff records are demo/local data where production APIs are not available.
- Shop setup, availability, and planner changes do not claim to persist to Supabase.
- Payroll is an estimated calculation based on displayed mock hours and rates.
- The Contact form displays a local success state and does not deliver or store messages.
- The AI Shift Planner does not use an external AI service.
- Frontend route visibility is not a replacement for backend authorization or Supabase Row Level Security.

## Security

- Keep `frontend/.env` and `backend/.env` out of version control.
- Use only the Supabase anon key in browser-exposed environment variables.
- Never commit passwords, service-role keys, tokens, or private credentials.
- Configure Supabase policies before using real business data.
- Do not run destructive database migrations against a production project without review.

## Contributing

1. Create a focused branch.
2. Keep reusable UI in `frontend/src/components/`.
3. Keep page-specific UI in `frontend/src/pages/`.
4. Preserve authentication and route behavior unless the change requires otherwise.
5. Document new environment variables or Supabase schema requirements.
6. Run the checks below before opening a pull request:

```bash
npm run lint
npm run build
```

## License

No open-source license has been declared for KaamSetu yet. Until a license is added to the repository, all rights remain with the copyright holder. Contact the repository owner before redistributing or using this code outside the repository.

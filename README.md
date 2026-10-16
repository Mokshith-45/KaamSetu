# KaamSetu

KaamSetu is a React and Vite workforce-planning application for small businesses and their part-time staff.

## Project structure

The repository is organized into separate application layers:

```text
frontend/       React, Vite, and Supabase client application
backend/        Backend-ready workspace for server-side integrations
```

The current application uses Supabase directly from the frontend for authentication and database operations. The `backend/` directory provides a clear place for future server-side services without mixing them with the UI code.

## Current features

- Landing and authentication page for KaamSetu.
- Supabase email/password sign-up and login.
- User profile creation during sign-up.
- Owner and staff user roles.
- Staff-role storage for staff accounts.
- Separate owner and staff dashboard routes.
- Owner dashboard sections for:
  - Overview
  - Shop setup
  - Staff management
  - AI shift planner interface
  - Reports/payroll interface
  - Profile settings
- Staff dashboard sections for:
  - Overview
  - My shifts
  - Notifications
  - Availability
  - Profile settings
- Supabase-backed profile updates, password changes, attendance-log display, and logout.
- Contact form UI with client-side success feedback.
- About page.
- Responsive styling, animated landing-page effects, and Lottie illustrations.

## Tech stack

- React
- Vite
- React Router
- Supabase
- Bootstrap and React Bootstrap
- Framer Motion, GSAP, AOS, and Lottie integrations

## Local setup

Requirements:

- Node.js
- npm
- A Supabase project configured with the tables used by the application (`profiles`, `staff_roles`, and `attendance_logs`)

From the repository root:

```bash
npm install
npm install --prefix frontend
```

Create `frontend/.env` from [`frontend/.env.example`](./frontend/.env.example):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the development server:

```bash
npm run dev
```

The root commands delegate to the frontend:

```bash
npm run lint
npm run build
```

## Current project status

The main authentication flow, role-based navigation, dashboard layouts, and initial Supabase operations are implemented. Some dashboard actions and planning/reporting features are currently UI placeholders or use sample data and are planned for future work.

## Security note

Never commit `frontend/.env`, `backend/.env`, or private service-role credentials. Environment files are ignored by Git; use [`frontend/.env.example`](./frontend/.env.example) and [`backend/.env.example`](./backend/.env.example) as shareable configuration templates.

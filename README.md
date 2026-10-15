# KaamSetu

KaamSetu is a React and Vite workforce-planning application for small businesses and their part-time staff.

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

## Project structure

The Vite application is located in the [`kaamsetu/`](./kaamsetu/) directory.

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

From the project directory:

```bash
cd kaamsetu
npm install
```

Create `kaamsetu/.env` from [`kaamsetu/.env.example`](./kaamsetu/.env.example):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the development server:

```bash
npm run dev
```

Run the available checks:

```bash
npm run lint
npm run build
```

## Current project status

The main authentication flow, role-based navigation, dashboard layouts, and initial Supabase operations are implemented. Some dashboard actions and planning/reporting features are currently UI placeholders or use sample data and are planned for future work.

## Security note

Never commit `kaamsetu/.env` or private service-role credentials. Environment files are ignored by Git; use [`kaamsetu/.env.example`](./kaamsetu/.env.example) as the shareable configuration template.

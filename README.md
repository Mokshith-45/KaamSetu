# 🧭 KaamSetu

<div align="center">

**Workforce management that keeps small teams moving**

Plan shifts, manage staff, and keep everyone aligned from one calm workspace.

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react&logoColor=20232A)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![React Router](https://img.shields.io/badge/React_Router-7.9.3-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Node](https://img.shields.io/badge/Node-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-not%20specified-lightgrey?style=flat-square)](#-license)

</div>

---

## 📚 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [📋 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Configuration](#️-configuration)
- [🧭 Application Routes](#-application-routes)
- [📦 Available Scripts](#-available-scripts)
- [🔒 Security](#-security)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Mokshith-45/KaamSetu.git
cd KaamSetu

# Install root and frontend dependencies
npm install
npm install --prefix frontend

# Start the Vite development server
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## 📋 Overview

KaamSetu is a React and Vite workforce-management application for small businesses and part-time teams.

Owners can:

- Review staffing coverage and planned hours.
- Configure shop details and operating hours.
- Manage staff roles, rates, availability, and status.
- Generate and review a local AI scheduling demo draft.
- View weekly schedules and estimated payroll.

Staff can:

- See their next upcoming shift.
- Review weekly shifts, roles, times, and shop details.
- Manage availability preferences.
- Submit a demo day-off request.
- Read notifications and update profile settings.

The current release is a frontend-focused product phase. Supabase authentication and profile operations are connected, while scheduling and several management actions use clearly labeled demo data until production services are available.

## ✨ Features

### 🏪 Owner Workspace

- **Overview dashboard** with total staff, weekly shifts, planned hours, and open coverage gaps.
- **Shop setup** with business name, address, operating hours, and required roles.
- **Staff management** with search, role details, hourly rates, availability, and active status.
- **AI Shift Planner** with date selection, maximum-hours configuration, loading state, draft generation, and uncovered-period indicators.
- **Schedule calendar** with responsive shift-list presentation.
- **Reports and payroll** with staff hours, applicable rates, and estimated payroll calculations.
- **Settings** for Supabase-backed profile and password updates.

### 👥 Staff Portal

- Personalized greeting and next-shift card.
- Weekly confirmed-shift list.
- Scheduled-hours summary.
- Availability day selection.
- Frontend-only day-off request flow.
- Notifications and announcements.
- Profile and password settings.

### 🌐 Public Experience

- Responsive landing page with product preview.
- Feature and how-it-works sections.
- Supabase email/password sign-up and sign-in.
- Owner/staff role selection during registration.
- Password visibility toggle and validation feedback.
- About and Contact pages.
- Styled 404 fallback.

## 🛠️ Tech Stack

| Category | Technology |
| --- | --- |
| Frontend | React 19 |
| Build tool | Vite |
| Routing | React Router |
| Authentication and data | Supabase JavaScript client |
| Icons | React Icons |
| Styling | CSS variables, responsive CSS, and reusable UI primitives |
| Code quality | ESLint |
| Future server workspace | `backend/` directory |

## 📁 Project Structure

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

## ⚙️ Configuration

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project with email/password authentication enabled

### Environment variables

Create `frontend/.env` from [`frontend/.env.example`](./frontend/.env.example):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

The browser client reads these values from [`supabaseClient.js`](./frontend/src/supabaseClient.js). Only use the public Supabase anon key in browser-exposed variables.

### Expected Supabase tables

The current registration and login flow expects:

```text
profiles
├── id
├── full_name
└── user_type        owner | staff

staff_roles
├── staff_id
└── role
```

Existing attendance integrations may use an `attendance_logs` table. Configure Row Level Security policies before using real users or business data.

### Local development

```bash
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

## 🧭 Application Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and authentication |
| `/owner-dashboard` | Owner workspace |
| `/staff-dashboard` | Staff portal |
| `/about` | Product purpose and values |
| `/contact` | Frontend-only contact form |
| `*` | Styled 404 fallback |

### Authentication flow

```text
Landing page
    ↓
Sign up or sign in with Supabase
    ↓
Read profiles.user_type
    ├── owner → /owner-dashboard
    └── staff → /staff-dashboard
```

## 📦 Available Scripts

Run these commands from the repository root:

```bash
# Start the frontend development server
npm run dev

# Run ESLint
npm run lint

# Build the production bundle
npm run build

# Preview the production bundle
npm run preview
```

Equivalent commands are available inside `frontend/`.

## 🧪 Demo Workflow

The AI Shift Planner is intentionally a safe local demo:

1. Sign in as an owner.
2. Open **AI Shift Planner**.
3. Select a week and maximum hours.
4. Choose **Generate demo draft**.
5. Review the draft shifts and uncovered-period indicator.
6. Edit or remove draft items.

Demo changes are not persisted to Supabase. The planner does not call an external AI provider, expose an API key, or create a fake backend endpoint.

## 🔒 Security

- Never commit `frontend/.env` or `backend/.env`.
- Never expose Supabase service-role credentials in a `VITE_*` variable.
- Keep passwords, tokens, and private keys out of source control.
- Configure Supabase Row Level Security before connecting real users.
- Frontend route hiding is not a substitute for backend authorization.
- Do not run destructive database changes against production without review.

## 🗺️ Roadmap

- Connect staff, shop, and schedule views to production Supabase data.
- Add backend authorization and server-side scheduling services.
- Replace the local planner with a protected AI scheduling endpoint.
- Persist availability, shift edits, day-off requests, and announcements.
- Add automated tests for authentication, scheduling, and payroll calculations.
- Add deployment and continuous-integration workflows.

## 🤝 Contributing

1. Create a focused branch.
2. Keep shared UI in `frontend/src/components/`.
3. Keep page-specific UI in `frontend/src/pages/`.
4. Preserve authentication and route behavior.
5. Document new environment variables or Supabase schema requirements.
6. Validate changes before opening a pull request:

```bash
npm run lint
npm run build
```

## 📄 License

No open-source license has been declared for KaamSetu yet. Until a license is added to the repository, all rights remain with the copyright holder. Contact the repository owner before redistributing or using this code outside the repository.

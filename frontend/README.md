# KaamSetu frontend

This directory contains the KaamSetu React/Vite frontend. It owns the browser UI, client-side routing, styling, and current Supabase client integration.

## Environment variables

Create a `.env` file in this directory using `.env.example` as a template:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The `.env` file is ignored by Git. Configure the same variables in the deployment platform before building the application.

## Commands

Run these commands from this directory, or use the equivalent root-level commands:

```bash
npm install
npm run dev
npm run lint
npm run build
```

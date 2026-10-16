# KaamSetu backend

This directory is reserved for server-side functionality and integrations.

The current application uses Supabase directly from the frontend for authentication and database operations, so no separate API server is required yet. Future backend work can be added here without mixing server code into [`frontend/`](../frontend/).

## Suggested structure

```text
backend/
├── src/       server-side modules and API routes
├── tests/     backend tests
├── .env.example
└── README.md
```

When a server is introduced, keep private Supabase service-role credentials and other secrets in `backend/.env`. Never expose them through Vite's `VITE_*` variables or commit them to Git.

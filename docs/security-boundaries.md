# SecureRAG Studio Security Boundaries

## 1. Secrets

- API keys must remain in server-side environment variables.
- API keys must never be placed in frontend code.
- `.env` and `.env.local` must never be committed.
- Only `.env.example` may be committed.
- Raw provider configuration must not be exposed to users.

Example:

```env
GEMINI_API_KEY=
DATABASE_URL=

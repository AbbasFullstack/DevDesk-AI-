# DevDesk AI

DevDesk AI is a full-stack developer workspace for understanding repositories, reviewing code, and turning project questions into actionable engineering plans. It is designed as a portfolio project for demonstrating product thinking, secure AI integration, modern web UI, and developer tooling.

## Product direction

A developer can create an account, attach a ZIP or project files, connect a GitHub repository, and ask questions about the codebase. DevDesk maps the project before answering, asks clarifying questions when context is missing, and returns explanations, findings, recommended fixes, and previewable code.

## Planned stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | Express API server with validated routes |
| Database | Supabase PostgreSQL |
| AI boundary | Server-side provider adapter; no browser API keys |
| Integrations | GitHub repository connector, file uploads, voice prompts |
| Visual direction | Carbon black, glass panels, cyan and violet glow |

## Local development

Copy `.env.example` to `.env`, fill only server-side values, then run `pnpm install`. Use `NODE_ENV=production pnpm build` for a production build. The web app runs on Next.js and the API foundation runs on the configured `API_PORT`.

## Security principles

Provider keys and Supabase service credentials must stay server-side. Uploaded projects should be treated as untrusted input, path traversal must be rejected during archive extraction, and analysis jobs should be isolated, size-limited, and auditable. Never commit `.env` files or real credentials.

## Portfolio checklist

The finished project should include architecture documentation, database schema, typed API contracts, deterministic tests, a security model, responsive screenshots, an accessible empty state, and a clear deployment guide.

## Auth and GitHub setup

Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment. Apply `supabase/schema.sql` in the Supabase SQL editor, then enable the required email/password provider. Add the deployed `/auth/callback` URL to Supabase's redirect allow list.

For the repository connector, create a GitHub OAuth App whose callback URL is the deployed `APP_URL/api/github/callback`. Configure `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and a unique 32-byte `TOKEN_ENCRYPTION_KEY` on the server. The OAuth state cookie is short-lived and httpOnly; the exchanged token is encrypted before it is stored in `github_connections`. The browser receives repository metadata only, never the token.

For a Supabase GitHub sign-in provider, configure the GitHub provider inside Supabase separately. The Supabase provider callback is the Supabase project's `/auth/v1/callback`, while DevDesk's repository connector callback is the application callback above. These are intentionally separate flows: Supabase authenticates the DevDesk user, and the GitHub connector grants repository access.

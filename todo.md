# DevDesk AI TODO

- [x] Create separate DevDesk AI project foundation
- [x] Define carbon-glass dashboard direction and core developer workflow
- [x] Add initial Next.js UI with project chat, analysis summary, upload modal, and preview panel
- [x] Add Express API health and validated analysis preview foundation
- [x] Add Supabase and server-side AI environment contract without real secrets
- [x] Add Supabase auth and PostgreSQL schema
- [x] Add real ZIP/file ingestion with path traversal protection
- [x] Add GitHub repository connector with secure OAuth/token handling
- [x] Add server-side AI chat and staged deep-analysis jobs
- [ ] Add analysis findings, clarifying questions, and evidence-linked answers
- [ ] Add restricted HTML/CSS/JS code preview workflow
- [ ] Add voice prompt upload/transcription flow
- [ ] Add usage limits, audit events, and error monitoring
- [ ] Add deterministic tests, deployment guide, and portfolio screenshots

- [x] Add real Supabase browser auth session, sign in/up, logout, and protected dashboard state
- [x] Add GitHub OAuth start/callback flow with server-only client credentials
- [x] Store GitHub OAuth tokens securely server-side and associate them with the authenticated user
- [x] Fetch and display the authenticated user's accessible GitHub repositories
- [ ] Validate OAuth state, redirects, session expiry, errors, and secret safety

- [ ] Rotate the exposed OpenRouter, GitHub OAuth, and Supabase server credentials before production deployment
- [ ] Generate a deployment-safe TOKEN_ENCRYPTION_KEY without displaying it publicly
- [ ] Deploy DevDesk AI to Vercel and obtain the production APP_URL
- [ ] Add server-only and browser-safe environment variables in Vercel
- [ ] Configure Supabase redirect URLs and GitHub OAuth callback using the Vercel APP_URL
- [ ] Validate sign-in, GitHub repository fetch, AI route, and secret safety after deployment

- [x] Fix Vercel pnpm install failure by explicitly allowing the required esbuild build script
- [x] Validate Vercel-style dependency installation and production build
- [ ] Push the deployment fix and redeploy DevDesk AI

- [ ] Audit the live Vercel deployment and environment readiness
- [ ] Verify Supabase email sign-up, sign-in, logout, and callback behavior
- [ ] Verify GitHub OAuth callback and repository listing prerequisites
- [ ] Fix any production auth or connector issues found during audit

- [x] Fix mobile header overflow so the Sign in control remains visible on phone screens
- [x] Validate the repaired Sign in flow on the live Vercel website

- [x] Show an explicit Connected state after GitHub OAuth succeeds
- [x] Redesign the mobile workspace so chat, starting a new chat, and history are immediately clear
- [x] Validate the revised GitHub and mobile workspace experience on the live Vercel website

- [x] Remove the hard-coded OmniStore project, fake analysis, and demo chat content
- [x] Show only real connected GitHub repositories or an honest empty workspace state
- [x] Validate the production workspace contains no fabricated project data

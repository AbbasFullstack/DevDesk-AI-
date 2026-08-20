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

- [x] Import the selected GitHub repository's real safe source files server-side
- [x] Analyze the imported source with explicit file evidence and no fabricated claims
- [x] Display imported files and real analysis findings in the workspace
- [x] Add deterministic tests for source import and repository authorization safeguards

- [x] Upgrade the chat workspace to an advanced carbon-glass developer-tool interface
- [x] Improve mobile message hierarchy, composer controls, and source-analysis presentation
- [x] Validate the premium chat UI on the production build and mobile layout

- [x] Fix the mobile split-column layout, horizontal overflow, and squeezed chat content
- [x] Stack project status below the chat and keep the mobile composer from covering workspace content
- [x] Validate the repaired phone layout on the live Vercel website

- [x] Replace the header logout icon with a three-line account menu
- [x] Add account-menu shortcuts for chat history, projects, and account settings
- [x] Add authenticated password change, account switch, and logout actions
- [x] Validate the new mobile account menu and settings flow

- [x] Make the mobile account menu fully opaque and legible above all workspace content
- [x] Move main-screen current-chat and history controls into the three-line menu only
- [x] Validate the simplified menu-driven mobile chat navigation on Vercel

- [x] Add server-side ordered OpenRouter text-model fallback with safe failures and timeouts
- [x] Add a consistent DevDesk AI identity instruction naming Abbas Hussain as creator
- [x] Validate real chat, fallback behavior, and identity response without client-side secrets

- [x] Add a Projects workflow for authenticated users to create and manage real project records
- [x] Add safe ZIP project import alongside existing connected GitHub repository import
- [x] Add review-gated, owner-authorized GitHub file commit actions for selected changes only
- [x] Validate project creation, ZIP imports, analysis context, owner isolation, and protected GitHub write-back guards

- [x] Run QA pass one: fresh-account, authentication, public routes, and mobile navigation
- [x] Run QA pass two: Projects, imports, source analysis, owner isolation, and commit protections
- [x] Fix all reproducible defects found during the audit and retest affected flows
- [x] Run QA pass three: regression, security guard, and production mobile verification
- [x] Deliver the final QA checklist with verified items, fixes, blockers, and user-only tests

- [x] Fix cross-account exposure of browser-local chat history discovered during production QA
- [x] Retest account switching to confirm each user sees only their own local conversation history

- [x] Require a DevDesk session before starting GitHub OAuth to avoid unnecessary unauthenticated provider redirects

- [x] Prevent fallback models from returning unresolved tool-call syntax in source analysis and retest real evidence-backed answers

- [x] Perform the user-approved harmless `DEV_DESK_QA_CHECK.md` commit test in Muneeza2071/AbbasAI
- [x] Verify the resulting AbbasAI GitHub commit and report the write-back result

- [x] Allow review-gated GitHub commits to create a safe new source file when no existing file SHA is supplied
- [x] Research currently available OpenRouter free chat models and select a verified 15-plus-model fallback order
- [x] Keep GLM 5.2 as the primary DevDesk AI chat model and expand resilient server-side fallback routing
- [x] Add deterministic routing, timeout, malformed-response, and all-model-failure tests for AI chat
- [x] Run a deep production chat audit and report verified fallback behavior
- [x] Prevent source analysis from confusing the imported repository with DevDesk AI itself
- [x] Preserve every message in an authenticated chat instead of replacing the prior response
- [x] Clear account-scoped browser chat and imported-project state on logout
- [x] Create a public developer-focused landing page for first-time visitors
- [x] Generate and integrate a custom DevDesk AI logo across the public and authenticated experiences
- [x] Hide empty project status, no-project, and code-preview dashboard panels until a real workflow makes them relevant
- [x] Validate multi-turn chat, logout cleanup, landing-to-auth flow, and conditional dashboard panels in production
- [x] Prevent the public landing page from flickering or looping for an already authenticated session
- [x] Remove deprecated v1 account-local conversation records during logout and initialization
- [x] Purge all v1 conversation keys, including prior account-scoped keys, on public-page initialization

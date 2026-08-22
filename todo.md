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
- [x] Run a focused live GLM 5.2 primary, fallback recovery, and user-facing error validation for DevDesk AI chat
- [x] Retry z-ai/glm-5.2:free once for transient first-response failures before continuing to other fallback models
- [x] Verify the live retry-first GLM 5.2 behavior and fallback recovery in production
- [x] Add authenticated owner-scoped project removal with explicit confirmation and workspace cleanup
- [x] Add GitHub repository selector, import action, and disconnect/import-clear action to the chat composer
- [x] Replace the Voice placeholder with working browser voice dictation and clear permission/support feedback
- [x] Test project removal, composer repository controls, voice dictation, and mobile layout in production
- [x] Bundle the DevDesk logo inside the deployed application and add a browser favicon
- [x] Make Workspace, Projects, Analyses, and Connectors navigation controls open real useful views
- [x] Render fenced AI code responses as syntax-colored copyable blocks with long-code overflow protection
- [x] Perform screenshot-led mobile QA for logo, navigation panels, and long code response rendering
- [x] Move the repository-context removal action out of the composer popover into project management
- [x] Add an isolated live preview action beside Copy on supported AI HTML/CSS/JS code blocks
- [x] Add a send-adjacent plus menu for voice call and image generation
- [x] Add an authenticated server-side image-generation route with safe prompt validation
- [x] Implement permission-aware browser voice call controls with clear device support feedback
- [ ] Test code preview isolation, image generation, voice call, and mobile plus-menu behavior in production
- [x] Replace the paid OpenRouter image route with a free no-balance server-side image provider
- [x] Validate one real free image generation and graceful provider errors in production
- [x] Build a dedicated WhatsApp-style DevDesk AI voice-call page reachable from the composer plus menu
- [x] Add language-aware device voice selection and Girl/Boy/Man/Woman/Adult/Senior speaking-style preferences
- [x] Implement continuous voice turn-taking with microphone recognition and AI speech playback
- [ ] Test the dedicated mobile voice-call flow, available voices, language playback, and permission errors
- [x] Persist each New chat as an independent account-scoped history entry and retain its complete messages
- [x] Audit and harden provider-busy retries so a normal DevDesk AI chat recovers through the fallback chain
- [x] Validate multiple saved chats in an authenticated production browser session; live busy-error recovery is verified
- [x] Add a server-side emergency text fallback for a total OpenRouter free-tier outage, without sending imported project source to that fallback
- [x] Repair free image-generation recovery when the primary provider is busy
- [ ] Validate a real production image in an authenticated browser session
- [x] Repair mobile browser AI speech playback in the dedicated Voice Call flow
- [ ] Validate mobile AI voice playback, languages, selected device voice, and permission feedback on Galaxy A21s
- [x] Add a confirmed GitHub disconnect control that revokes the DevDesk-side connection and clears connected-repository state
- [x] Add a visible Close or Back control to Account Settings so the composer returns without relying on the account menu
- [x] Add per-conversation renaming in Chat history and preserve the custom title for the signed-in account
- [x] Ensure root-level app regression tests are included in the deterministic test command
- [x] Add an accessible image-generation progress bar and live status messages in the composer media panel
- [x] Complete a five-pass production QA audit across the public site, workspace, media tools, Voice Call, and mobile responsive behavior
- [x] Verify authenticated Image Generation end-to-end, including progress statuses, free-provider fallback, success display, and retry errors
- [ ] Verify Voice Call on Galaxy A21s, including Test voice, AI reply speech, microphone permission, languages, selected device voice, and recovery feedback
- [x] Add a final browser-deliverable free image fallback after the two Vercel-side provider attempts are exhausted
- [x] Normalize Pollinations image seeds to the provider-safe integer range so production image requests do not fail before generation starts
- [x] Live-test Voice Call AI speech playback and microphone permission behavior in the deployed production browser
- [x] Record whether the result is browser-environment limited or confirmed on Galaxy A21s
- [ ] Revalidate the production GitHub Disconnect/Logout control after connection and the top-right Account Settings Back/Close control
- [x] Add per-chat rename and expandable detailed conversation metadata in Chat History, including type/project, message count, created time, updated time, and last activity
- [x] Verify DevDesk-only Chat History changes and confirm Abbas AI was not modified by this request
- [x] Repeat end-to-end production QA for Image Generation and Voice Call, covering success, fallback, error, speech, and microphone states
- [ ] Execute a deep 10-pass production QA audit using a 100-plus-item test matrix
- [x] Stress-test authenticated AI chat with repeated development, code-generation, error-recovery, and fallback requests
- [x] Inspect the connected GitHub import, analysis, and review-gated commit flow; request confirmation before any repository write
- [x] Fix the reproducible production AI chat outage: five consecutive normal requests returned retryable HTTP 503 busy errors
- [x] Prevent source-backed analysis from returning generic continuity guidance or exposing imported prompt content when external providers are unavailable
- [x] Prevent source-backed analysis from returning generic continuity guidance or exposing imported prompt content when external providers are unavailable
- [x] Require an authenticated DevDesk session before the server-side chat route consumes AI-provider capacity
- [x] Expose safe new-file path staging in the review-gated GitHub commit interface without requiring an existing file selection
- [x] Run a controlled 20-prompt authenticated DevDesk chat reliability audit and record provider outcomes
- [x] Re-evaluate the GLM 5.2-first OpenRouter fallback order using currently available free chat models
- [x] Repair any reproducible server-side chat routing failures and re-test the live deployment
- [x] Avoid multiplying one user chat request into repeated free-tier calls after an upstream or platform 429 response
- [x] Add a short server-side capacity cooldown so concurrent user prompts do not repeatedly exhaust free-model limits
- [x] Persist a per-account browser chat cooldown after capacity guidance so ordinary composer retries do not re-hit constrained providers
- [x] Design GLM 5.2-first cross-provider failover with independent provider health, timeout, and capacity rules
- [x] Add optional server-side Groq fallback using a user-owned credential; never expose it to the browser
- [x] Validate multi-provider failover with deterministic provider-outage, rate-limit, timeout, and success-path tests
- [x] Configure the user-authorized Grok API key only as a server-side Vercel environment variable for DevDesk AI
- [ ] Verify deployed Grok fallback response after an authorized Vercel redeploy
- [x] Add optional xAI Grok fallback with a distinct server-side XAI_API_KEY configuration and preserve the separate Groq adapter
- [x] Add optional Cerebras fallback with a distinct server-side CEREBRAS_API_KEY configuration after xAI Grok and before Groq
- [x] Configure user-authorized xAI and Cerebras secrets only in Vercel, then verify the deployed failover order
- [x] Complete an authenticated production chat verification after browser automation recovers from its temporary crash loop
- [x] Diagnose why configured xAI and Cerebras fallback requests still end in capacity guidance instead of a model-backed answer
- [x] Correct the Galaxy A21s mobile breakpoint so the DevDesk workspace does not render at desktop scale
- [ ] Re-test the real mobile chat flow after the provider and responsive-layout repairs deploy
- [x] Add a clear always-visible Cancel or Back control to Account Settings opened from the mobile three-line account menu
- [x] Audit and repair reproducible mobile dead ends across account menu, history drawer, project modal, navigation tabs, and composer tools
- [x] Verify every interactive mobile control has an obvious exit path and no transparent or blocked overlay state
- [ ] Run a 100-check authenticated AI chat reliability and performance audit with measured latency and provider outcomes
- [x] Verify one 10–15 turn chat keeps every prior turn visible and maintains correct developer context
- [ ] Diagnose and repair any reproducible slow response, provider failure, retry, or continuity-guidance defect found in the 100-check audit
- [x] Trace why live chat returned continuity guidance on audit turn one despite configured xAI and Cerebras fallbacks
- [ ] Verify configured xAI and Cerebras credentials against their provider endpoints without exposing values, then repair the first failing provider path
- [x] Give independent fallback providers a bounded 10-second response window and prioritize low-reasoning Cerebras recovery for faster ordinary chat
- [x] Log redacted provider attempt statuses only when continuity guidance is issued, so production failures can be diagnosed without logging prompts or keys
- [x] Restore at least one model-backed general-chat provider with usable authorization or credits, then resume the blocked 10–15 turn production audit
- [x] Add Vercel AI Gateway OIDC fallback using `openai/gpt-oss-20b` for ordinary general chat only, after all existing providers fail
- [x] Run one user-authorized controlled Vercel AI Gateway production response test before the extended chat audit
- [x] Pass Vercel Function's `x-vercel-oidc-token` request header to the AI Gateway adapter instead of relying only on a build-time environment token
- [ ] Enable usable Vercel AI Gateway credit or billing before relying on its OIDC fallback; live OIDC request currently reaches Gateway but returns HTTP 403
- [x] Evaluate and verify a no-card, server-side general-chat fallback that does not expose credentials in the browser
- [x] Validate the user-provided server-only Groq key against a lightweight provider endpoint, then verify the existing Groq chat fallback in production
- [x] Replace the confirmed retired `groq/llama-3.3-70b-versatile` fallback default with an officially current Groq free-tier chat model and re-run the sequential audit
- [x] Repoint the obsolete deleted `DevDeskAI` Git remote to the user-selected `DevDesk-AI-` repository only after explicit confirmation of the corrected target
- [x] Grant the connected `AbbasFullstack` GitHub account write access to `Muneeza2071/DevDesk-AI-`, then push the already validated local repair commit
- [x] Relink the Vercel `dev-desk-ai` project from deleted `Muneeza2071/DevDeskAI` to the corrected `Muneeza2071/DevDesk-AI-` GitHub repository before expecting automatic deployments
- [x] Push final audit checklist completion markers to GitHub and confirm the corrected repository head
- [x] Review DevDesk AI portfolio showcase readiness with its tested functionality and remaining external-provider limitations
- [x] Inspect the VaultX README style and create a branded shield-badge README for DevDesk AI
- [ ] Validate DevDesk README links and publish the approved documentation update to GitHub

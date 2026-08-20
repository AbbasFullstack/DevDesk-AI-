# DevDesk AI — Deep Production QA Audit

This document tracks a **ten-pass, 120-check** production audit. Each check is evaluated against the live site, authenticated browser behavior, deterministic tests, or direct route behavior. A check marked **blocked** identifies a genuine environment or device limitation rather than a silent pass.

| Pass | Focus | Checks |
|---|---:|---:|
| 1 | Public landing, session boot, responsive navigation | 12 |
| 2 | Authentication, account controls, session isolation | 12 |
| 3 | AI chat success, recovery, code generation, history | 12 |
| 4 | Chat error handling, fallbacks, retries, long content | 12 |
| 5 | GitHub connection, repository selector, disconnect | 12 |
| 6 | Import, source analysis, safe project workflows | 12 |
| 7 | Review-gated commit and code-preview safety | 12 |
| 8 | Image generation, media controls, downloads | 12 |
| 9 | Voice Call, device capability and recovery states | 12 |
| 10 | Regression, accessibility, mobile behavior, build safety | 12 |

## Pass 1 — Public landing and navigation

- [ ] Landing page loads without dashboard flicker for anonymous visitors.
- [ ] DevDesk logo renders from bundled asset.
- [ ] Browser title and favicon identify DevDesk AI.
- [ ] Sign-in entry is visible on mobile-width layout.
- [ ] Sign-up entry is visible on mobile-width layout.
- [ ] Workspace navigation has a visible active state.
- [ ] Projects navigation has a visible active state.
- [ ] Analyses navigation has a visible active state.
- [ ] Connectors navigation has a visible active state.
- [ ] Page has no horizontal overflow at common mobile width.
- [ ] Keyboard focus is visible on primary actions.
- [ ] Public page exposes no provider key or server-only token.

## Pass 2 — Authentication and account controls

- [ ] Sign-up validates required email and password values.
- [ ] Sign-in handles invalid credentials safely.
- [ ] Authenticated workspace identifies the signed-in account.
- [ ] Account menu opens above workspace content.
- [ ] Account menu closes by its visible close/escape route.
- [ ] Account Settings opens from the account menu.
- [ ] Back to workspace closes Account Settings.
- [ ] Account Settings X control closes the sheet.
- [ ] Password-change controls validate matching values.
- [ ] Logout clears local account-scoped workspace state.
- [ ] Switch-account path does not expose previous account history.
- [ ] Auth API rejects protected routes without a session.

## Pass 3 — AI chat normal behavior and code generation

- [ ] Empty composer does not send a request.
- [ ] Normal development question receives an assistant response.
- [ ] GLM 5.2 remains the first configured model.
- [ ] Chat identifies DevDesk AI as created by Abbas Hussain when asked.
- [ ] Multi-turn context retains prior messages.
- [ ] New chat starts with an empty composer timeline.
- [ ] User turn persists immediately before response completion.
- [ ] Assistant turn persists after response completion.
- [ ] Fenced code renders in a professional code block.
- [ ] Code block syntax highlighting renders without raw markdown leakage.
- [ ] Copy code action copies the intended code content.
- [ ] Supported HTML/CSS/JS code exposes isolated preview affordance.

## Pass 4 — AI resilience and error handling

- [ ] First GLM transient failure retries GLM once.
- [ ] OpenRouter free routing follows the GLM retry.
- [ ] Curated free fallback candidates are attempted safely.
- [ ] Empty provider output is rejected and routing continues.
- [ ] Unresolved provider tool-call output is rejected.
- [ ] Malformed provider response is handled safely.
- [ ] Provider timeout is bounded.
- [ ] Client retries one transient busy result.
- [ ] Emergency no-key text fallback is only used after configured providers fail.
- [ ] Imported source content is excluded from the anonymous emergency fallback.
- [ ] All-provider outage returns a readable retryable status.
- [ ] No raw stack trace is exposed to the end user.

## Pass 5 — GitHub connection and repository selection

- [ ] Connect GitHub entry is shown when no connection exists.
- [ ] OAuth start requires a DevDesk session.
- [ ] OAuth callback validates state before token storage.
- [ ] Stored GitHub token is encrypted server-side.
- [ ] Connected state is shown after a successful connection.
- [ ] Repository list loads only for the connected account.
- [ ] Composer repository selector lists only returned repositories.
- [ ] Selected repository is account-scoped in local state.
- [ ] Disconnect GitHub requests explicit confirmation.
- [ ] Disconnect removes DevDesk-side connection state.
- [ ] Disconnect clears selected repository context.
- [ ] GitHub repository routes reject a missing encrypted connection.

## Pass 6 — Import and source-backed analysis

- [ ] GitHub import validates owner/repository format.
- [ ] GitHub import validates the selected branch.
- [ ] Import filters unsafe paths.
- [ ] Import filters unsupported/generated files.
- [ ] Import caps source-tree entries.
- [ ] Import caps file count.
- [ ] Import caps source-file byte size.
- [ ] ZIP import rejects unsafe traversal paths.
- [ ] ZIP import enforces archive size limit.
- [ ] Imported manifest contains real source metadata.
- [ ] Source analysis names the imported repository accurately.
- [ ] Analysis cites real source paths rather than fabricated evidence.

## Pass 7 — Commit and preview safety

- [ ] Commit workflow requires a selected connected repository.
- [ ] Commit workflow requires imported-source context.
- [ ] Commit workflow requires explicit user approval.
- [ ] Commit workflow validates a safe file path.
- [ ] Commit workflow enforces safe source extensions.
- [ ] Commit workflow enforces file-size limit.
- [ ] Existing file update includes a SHA.
- [ ] Safe new-file creation allows an omitted SHA.
- [ ] Cross-account commit request is rejected.
- [ ] Repository write is never executed without user confirmation.
- [ ] Code preview uses an isolated sandboxed iframe.
- [ ] Preview supports only HTML, CSS, and JS as intended.

## Pass 8 — Image generation and media panel

- [ ] Plus media menu opens and closes.
- [ ] Image Generation panel has a prompt input.
- [ ] Image Generation panel has aspect-ratio choices.
- [ ] Empty image prompt is rejected visibly.
- [ ] Generate button disables during request.
- [ ] Progress begins with preparation status.
- [ ] Generation status updates while provider work is pending.
- [ ] Progress reaches completion status on success.
- [ ] Provider-safe normalized seed is used.
- [ ] Sana is attempted before Flux fallback.
- [ ] Final browser-delivery fallback is safe to render.
- [ ] Rendered result provides a Download action.

## Pass 9 — Voice Call and device capability recovery

- [ ] Media menu opens the dedicated Voice Call page.
- [ ] Voice Call has a visible back route.
- [ ] Settings panel opens and closes.
- [ ] Auto/device language choice is available.
- [ ] Urdu language choice is available.
- [ ] English, Hindi, and Arabic choices are available.
- [ ] Girl/Boy/Woman/Man/Adult/Senior styles are available.
- [ ] Installed device voice selector does not claim unavailable voices.
- [ ] Test voice is initiated inside a user gesture.
- [ ] Speech playback failure shows a recovery message.
- [ ] Start call enters the listening lifecycle.
- [ ] Microphone denial shows a recovery message without crashing.

## Pass 10 — Regression, accessibility, and delivery safety

- [ ] Root-level app tests run in the standard test command.
- [ ] Server tests run in the standard test command.
- [ ] TypeScript validation succeeds.
- [ ] Production build succeeds.
- [ ] No sensitive environment file is staged for commit.
- [ ] Repository diff passes whitespace safety check.
- [ ] Conversation history is capped at 30 chats.
- [ ] Custom conversation title persists after future messages.
- [ ] Conversation details expose type, counts, timestamps, and last activity.
- [ ] Mobile media panel remains usable without composer overlap.
- [ ] Public, authenticated, and error states remain visually legible.
- [ ] Audit findings and blocked hardware checks are documented honestly.

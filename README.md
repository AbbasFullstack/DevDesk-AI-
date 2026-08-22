<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,45:0e7490,100:7c3aed&height=260&section=header&text=DevDesk%20AI&fontSize=68&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Private%20code%20intelligence%20for%20modern%20developers&descAlignY=58&descSize=19" alt="DevDesk AI header" width="100%" />
</p>

<p align="center">
  <a href="https://dev-desk-ai-phi.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-dev--desk--ai--phi.vercel.app-00C7B7?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://github.com/Muneeza2071/DevDesk-AI-"><img src="https://img.shields.io/badge/Source%20Code-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub source code" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployed%20with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployed with Vercel" /></a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=22D3EE&center=true&vCenter=true&width=760&lines=AI+code+intelligence+for+real+developer+workflows;Analyze+repositories%2C+debug+issues%2C+and+plan+next+steps;Private+by+design+%E2%80%94+server-side+AI+boundaries" alt="DevDesk AI tagline" />
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase PostgreSQL" /></a>
  <a href="https://github.com"><img src="https://img.shields.io/badge/GitHub-OAuth_Connector-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub OAuth connector" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/AI-Server--Side_Routing-7C3AED?style=flat-square&logo=openai&logoColor=white" alt="Server-side AI routing" /></a>
</p>

<p align="center">
  <strong>A production-style developer workspace for understanding codebases, investigating issues, and planning safer changes.</strong>
</p>

---

## Overview

**DevDesk AI** is a full-stack developer workspace created by **Abbas Hussain**. Developers can sign in, connect a GitHub repository, import a ZIP or project files, ask questions about their codebase, and receive structured explanations, debugging guidance, and previewable code suggestions.

The product combines a carbon-black glassmorphism interface with a privacy-conscious server boundary. General chat is routed through server-side AI adapters, while source-backed analysis follows tighter privacy limits so imported project content is not sent to unrelated fallbacks.

| Area | What DevDesk AI provides |
| --- | --- |
| **Developer chat** | General engineering guidance, debugging help, architecture explanations, and code-oriented answers. |
| **Project intelligence** | ZIP and GitHub repository import flows, project mapping, source-backed analysis, and questions that clarify project context. |
| **GitHub workflow** | OAuth repository connection, repository selection, and review-gated write-back rather than silent commits. |
| **Workspace UX** | Persistent chat history, project hub, analysis workspace, code blocks with copy/preview actions, and mobile-aware navigation. |
| **Voice and media** | Voice-call workspace, prompt dictation entry points, and controlled media tools. |

---

## Product highlights

<p>
  <img src="https://img.shields.io/badge/Authentication-Supabase_Email_%2B_GitHub-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase authentication" />
  <img src="https://img.shields.io/badge/Repository_Import-GitHub_%2B_ZIP-181717?style=for-the-badge&logo=github&logoColor=white" alt="Repository and ZIP import" />
  <img src="https://img.shields.io/badge/AI_Routing-GLM_5.2_Primary-22D3EE?style=for-the-badge" alt="GLM 5.2 primary routing" />
  <img src="https://img.shields.io/badge/Code_Safety-Review--Gated_Writes-F59E0B?style=for-the-badge" alt="Review-gated GitHub writes" />
</p>

| Capability | Implementation detail |
| --- | --- |
| **Secure multi-provider recovery** | GLM 5.2 remains the primary general-chat model. Server-side fallbacks are bounded, logged without prompts or keys, and include a verified Groq recovery path. |
| **Protected source analysis** | Imported source analysis uses stricter routing boundaries and avoids broad independent-provider or anonymous fallback paths. |
| **Account-scoped workspace** | Conversations, selected repositories, and imported-project state are scoped to the signed-in account instead of leaking across users. |
| **Responsive product design** | Carbon black glass panels, cyan-violet accents, and mobile-first breakpoints tuned for narrow Android screens. |
| **Actionable code output** | Copyable syntax-highlighted code blocks and sandboxed preview support for applicable HTML/CSS output. |

---

## Architecture

```mermaid
flowchart LR
    U[Developer] --> W[Next.js workspace]
    W --> A[Supabase Auth]
    W --> G[GitHub OAuth connector]
    W --> P[Project import: ZIP or repository]
    W --> C[Server-side chat API]

    P --> S[Project map and source analysis boundary]
    C --> R[AI routing adapter]
    R --> M[GLM 5.2 primary]
    R --> F[Independent fallback providers]
    F --> GR[Groq recovery fallback]
    G --> DB[(Supabase PostgreSQL)]
    S --> DB
```

> **Security boundary:** Provider credentials, GitHub OAuth secrets, token-encryption material, and Supabase service credentials remain on the server. They are never bundled into the browser client or committed to source control.

---

## Technology stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Lucide icons |
| **Backend** | Next.js route handlers with an Express development service and validated server modules |
| **Database and auth** | Supabase PostgreSQL with cookie-based SSR authentication |
| **AI integration** | Server-side provider adapter with GLM 5.2 primary routing and controlled recovery fallbacks |
| **Integrations** | GitHub OAuth connector, ZIP/project import, repository browser, voice workspace |
| **Deployment** | Vercel with sensitive Production and Preview environment variables |
| **Testing** | TypeScript checks, production build validation, and deterministic application/server regression tests |

---

## Getting started

### Prerequisites

Install **Node.js 20+** and **pnpm 11+**. You will also need a Supabase project and a GitHub OAuth App if you want to exercise authentication and repository connection locally.

### Install and run

```bash
git clone https://github.com/Muneeza2071/DevDesk-AI-.git
cd DevDesk-AI-
pnpm install
pnpm dev
```

Open the local Next.js URL shown in the terminal. The development command runs the web application and the companion server process together.

### Validate before deployment

```bash
pnpm test
pnpm check
NODE_ENV=production pnpm build
```

---

## Environment configuration

Create your deployment environment values in **Vercel** or a local server-only environment file. Never place a real secret in a `NEXT_PUBLIC_*` variable, browser storage, or Git history.

| Variable group | Purpose |
| --- | --- |
| **Supabase** | Public URL and publishable key for the browser, plus server-only service credentials for privileged operations. |
| **Application** | `APP_URL` and the deployment callback URLs required by auth flows. |
| **GitHub connector** | Client ID, client secret, and encryption key used to protect stored connector tokens. |
| **AI providers** | Server-only OpenRouter, xAI, Cerebras, or Groq credentials. Providers are optional fallbacks; they must never be exposed to the browser. |

For GitHub OAuth, configure the DevDesk connector callback as:

```text
https://your-domain.example/api/github/callback
```

Supabase GitHub sign-in and the DevDesk repository connector are intentionally separate OAuth flows: one authenticates the user, while the other grants repository access.

---

## Security model

| Principle | How it is applied |
| --- | --- |
| **Server-only secrets** | API keys and privileged credentials are read in server code, never from the public client bundle. |
| **Encrypted connector tokens** | GitHub access tokens are protected before storage and are not returned to the browser. |
| **Safe project ingestion** | Uploaded archives are treated as untrusted input and inspected with path/size safety controls. |
| **Source privacy** | Source-backed analysis has a restricted AI routing policy separate from ordinary general chat. |
| **Human approval for writes** | GitHub code changes are staged for review; DevDesk does not silently commit user repository changes. |
| **Failure observability** | Provider failure diagnostics record safe statuses without logging prompts, source code, or credentials. |

---

## Quality verification

The project includes deterministic regression coverage for routing order, outage recovery, source-privacy boundaries, file-import safety, GitHub review gating, and chat behavior. The current production audit also verified ten sequential prompts in one live conversation with preserved prior turns and no capacity-guidance response on the working Groq recovery path.

External AI services can still experience quota limits, authorization changes, or outages. DevDesk is therefore designed for **best-effort resilient routing**, not an unrealistic guarantee that every third-party provider will always be available.

---

## Repository map

```text
app/                     Next.js App Router screens and API routes
app/components/          Workspace, auth, project, and chat UI components
server/                  AI routing, provider adapters, validation, and tests
supabase/schema.sql      PostgreSQL schema and auth profile trigger
public/brand/            DevDesk visual assets and favicon source
todo.md                  Product audit and implementation checklist
```

---

## Live links

<p>
  <a href="https://dev-desk-ai-phi.vercel.app"><img src="https://img.shields.io/badge/Open_Live_Demo-DevDesk_AI-00C7B7?style=for-the-badge&logo=vercel&logoColor=white" alt="Open DevDesk live demo" /></a>
  <a href="https://github.com/Muneeza2071/DevDesk-AI-"><img src="https://img.shields.io/badge/View_Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="View DevDesk source" /></a>
</p>

---

<p align="center">
  Built by <strong>Abbas Hussain</strong> as a portfolio project for modern full-stack engineering, AI integration, secure developer tooling, and product-focused UI design.
</p>

<p align="center">
  <sub>DevDesk AI is a developer tool. It does not automatically modify user repositories without review and approval.</sub>
</p>

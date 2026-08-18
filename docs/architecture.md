# DevDesk AI Architecture

## Core flow

1. The developer signs in through the selected auth provider.
2. A project record is created with ownership, source type, branch, and status.
3. A ZIP, file set, or GitHub repository is ingested through a size-limited server route.
4. The ingestion worker validates file paths, ignores generated directories, extracts a manifest, and stores only the metadata and permitted source content required for analysis.
5. DevDesk runs staged analysis: project map, dependency inventory, architecture findings, security checks, maintainability signals, and suggested next questions.
6. The chat route uses the project analysis context plus the developer question to produce a concise answer with evidence, file paths, and suggested next steps.
7. Code previews are rendered in a restricted sandbox and never execute arbitrary server-side code.

## Domain model

| Entity | Purpose |
| --- | --- |
| `profiles` | Developer identity and preferences |
| `projects` | Repository/project metadata and ownership |
| `project_sources` | ZIP, file upload, or GitHub source reference |
| `project_files` | Sanitized manifest and selected source excerpts |
| `analysis_runs` | Status, stage progress, model metadata, and findings |
| `analysis_findings` | Severity, category, evidence, and remediation |
| `conversations` | Project-scoped chat sessions |
| `messages` | User questions and assistant answers |
| `connectors` | Encrypted GitHub connection metadata |
| `usage_events` | Request, token, upload, and analysis accounting |

## Trust boundaries

The browser talks only to the application API. The application server owns Supabase service credentials, provider credentials, archive extraction, GitHub tokens, and analysis orchestration. The model receives scoped project context rather than unrestricted filesystem access. Every generated preview is isolated from the application origin.

## Analysis stages

The first product slice should make these stages visible in the UI: **Map**, **Understand**, **Ask**, **Solve**, and **Preview**. This keeps deep analysis explainable and gives users useful partial results even if a long-running job is interrupted.

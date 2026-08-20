# DevDesk AI OpenRouter Model Policy

DevDesk AI uses server-side OpenRouter calls only. The browser never receives an OpenRouter key. The preferred model is **`z-ai/glm-5.2:free`**, followed by an explicit, curated list of sixteen currently zero-priced routing alternatives. The generic `openrouter/free` route is last.

## Fallback behavior

Each request starts with GLM 5.2. If a model times out, returns a non-success status, emits invalid JSON, returns no text, or emits unresolved tool-call syntax, DevDesk tries the next candidate. The policy is deliberately bounded to seventeen total candidates so a chain of slow providers cannot hold a server request open indefinitely. The ordered policy is version-controlled to keep the production route deterministic; it does not accept arbitrary environment-provided model IDs.

| Policy position | Model selection |
| --- | --- |
| 1 | `z-ai/glm-5.2:free` |
| 2–16 | Curated free general-purpose, code, reasoning, or multimodal text models from the live catalog |
| 17 | `openrouter/free` generic free route |

The live OpenRouter catalog was checked on **2026-08-20**. It listed sixteen explicit text-capable model IDs with `:free` pricing alongside GLM 5.2, including the selected coding, reasoning, and general-chat models. The catalog can change at any time, so model-specific failures are treated as retryable and skipped safely. The content-safety-only model was excluded because it is not suitable for regular developer chat.

## User-facing failure handling

Provider error details, status responses, and model attempt names are not returned to the browser. If every candidate is unavailable, DevDesk returns the concise retryable message: **“DevDesk AI is temporarily busy. Please try again in a moment.”** This avoids leaking provider internals while remaining honest: DevDesk never fabricates a chat answer when no AI provider produced one.

## Sources

OpenRouter documents the Models API as the authoritative catalog of model IDs, output modalities, supported parameters, and current pricing. A pricing value of `0` denotes a free feature. [OpenRouter Models documentation](https://openrouter.ai/docs/models) · [Live model catalog](https://openrouter.ai/api/v1/models)

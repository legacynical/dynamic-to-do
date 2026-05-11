# Architecture

Last verified: 2026-05-11 04:45 AM PDT
Source-of-truth for: durable module boundaries, data/control flow, state ownership, validation implications, and anti-hack constraints

## Current architecture summary

Dynamic To Do is a single-page Next.js App Router application with one browser-local planning surface and one server action for AI todo generation. The page-level client component owns todo state and user workflow. The server action hides provider-specific AI configuration and returns plain task strings for the client to convert into local todo objects.

## Decision scope and non-goals

This document owns implementation boundaries and maintainability constraints. Product behavior belongs in [Product requirements](product-requirements.md). Detailed list behavior belongs in [Task list interaction SRD](subsystem-requirements/task-list-interaction.md). Provider prompt, parsing, and secret-handling behavior belongs in [AI todo generation SRD](subsystem-requirements/ai-todo-generation.md). Progress and validation evidence belongs in implementation-journal records.

Non-goals:

- Define persistence, account, sharing, calendar, or notification architecture before product requirements approve those capabilities.
- Turn provider-specific generation details into client-visible contracts.
- Replace focused SRDs with architectural restatements of every UI behavior.

## Ownership boundaries

| Boundary | Owner | Architectural rule |
| --- | --- | --- |
| Browser-local todo array | `app/page.tsx` | The page owns the canonical session-local list and all durable todo mutations. |
| Per-item transient UI state | `components/todo-item.tsx` | Todo item components may own edit-mode text and visual drag state, but must commit durable changes through page callbacks. |
| Provider-backed generation | `app/actions.ts` | The server action owns provider client setup, prompt construction, response parsing, and thrown generation failures. |
| UI primitives | `components/ui/` | Shared primitives expose reusable controls without owning todo semantics. |
| Stack and tool facts | `docs/tech-stack.md` | Versions, scripts, external services, and package-manager policy route through the TSD. |

## Data and control flow

1. The user edits the project prompt and Work/Life slider in `app/page.tsx`.
2. `handleGenerateTodos` calls `generateTodos(project, workLifeRatio)` only for non-empty prompt text.
3. `app/actions.ts` calls the configured Nebius OpenAI-compatible endpoint and returns `string[]`.
4. The client maps returned strings into local `{ id, text, completed }` todos.
5. Manual add, edit, completion, delete, clear, and drag reorder mutate the page-owned `todos` array only.

Generated tasks are suggestions, not authoritative state. They must append to the latest local list at resolution time so edits made during an in-flight request survive.

## State and compatibility constraints

- Todo state is session-local. Refresh, navigation, or remount can lose the list until product persistence questions are resolved.
- Duplicate text entries are valid. Todo identity is ID-based, not text-based.
- Local todo mutations should use functional React state updates when the new state depends on the previous list. This prevents generation and user interactions from racing through stale closures.
- Drag-and-drop reordering must guard invalid events before reading `over.id` or moving indexes. Missing `over`, same-ID drops, missing active IDs, and missing target IDs are no-ops.
- Provider secrets must never move into client component state, props, or browser-visible configuration.

## Validation implications

The architecture needs validation at two layers:

- Build/compile validation for Next.js, React, TypeScript, and server action imports.
- Interaction validation for local todo state: manual add, generated append, edit, completion, delete, clear, duplicate text, and invalid drag end events.

The repo now has two validation layers for local todo behavior: pure state helper tests under `test/` and Playwright browser interaction tests under `e2e/`. Browser coverage currently protects the manual todo flow; AI generation, provider failure messaging, and drag-and-drop pointer behavior remain separate slices.

## Anti-hack constraints and architecture debt

- Do not fix generation/local-state races by disabling all user interactions during loading unless the SRD intentionally changes that interaction contract.
- Do not make AI generation replace the todo array to simplify merge logic; generated tasks append to current local state.
- Do not hide drag-end exceptions with broad `try/catch`; validate event shape and indexes before reordering.
- Do not expose provider diagnostics or credentials to the client as a shortcut for debugging generation.
- Current architecture debt: weak TypeScript strictness, unsettled loading-time interaction policy, and no durable todo persistence contract.

## Source-of-truth handoffs

- Product intent: [Product requirements](product-requirements.md)
- Local task-list behavior: [Task list interaction SRD](subsystem-requirements/task-list-interaction.md)
- AI generation behavior: [AI todo generation SRD](subsystem-requirements/ai-todo-generation.md)
- Stack facts: [Technology stack](tech-stack.md)
- Work records: `docs/implementation-journal/`

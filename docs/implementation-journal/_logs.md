# Dynamic Todo Implementation Journal

Last verified: 2026-05-11 8:40 AM PDT
Source-of-truth for: implementation-pipeline work records, validation evidence, dependency advisories, and next-step routing for the dynamic todo app

## Log index

| Record | Scope | Status | Read when |
| --- | --- | --- | --- |
| [0001-task-list-local-state-stability.md](./0001-task-list-local-state-stability.md) | Defensive drag-end guards, pure todo-state helper tests, generated-output normalization tests, accessible compact row controls, functional local-state updates during generation, keyboard reorder, Playwright manual/error interaction coverage, lint/build validation repair, and dependency-advisory follow-up. | complete with advisory follow-up | Reviewing the first local-state stability/browser-interaction/generation-normalization slice or the remaining Next.js/PostCSS audit decision. |
| [0002-provider-loading-browser-coverage.md](./0002-provider-loading-browser-coverage.md) | Server-only mock-provider seam and Playwright coverage for slow generation success/failure, retry recovery, loading controls, local edits during loading, generated append, and generic failure preservation. | complete | Changing provider base URL handling, generation loading UI, generated append behavior, retry recovery, or browser tests around provider outcomes. |

## Current next step

The loading-time generation browser slice is now complete for the session-local contract. Pointer-drag browser coverage should stay separate because the pure state helper already covers invalid and valid id-based reorder cases, keyboard reorder is covered through the explicit handle affordance, and dnd-kit pointer interaction can become noisy if bundled into unrelated UI tests.

The pure state layer has `node --test` coverage, rendered manual/error todo flows have Playwright coverage, and slow provider success/failure is covered with a local OpenAI-compatible mock provider. Live provider-backed generation still requires a real `NEBIUS_API_KEY` and should be treated as a separate smoke proof. On 2026-05-11 8:34 AM PDT, `npm run env:check` failed because `NEBIUS_API_KEY` is not present, so live provider smoke remains gated rather than runnable.

## Validation reminders

- `npm run lint`
- `npm run test`
- `npm run test:e2e -- --project=chromium`
- `npm run build`
- `npm audit --omit=dev --cache ./.npm-cache`

The remaining audit advisory is documented in [Next.js PostCSS audit advisory](../research/next-postcss-audit-advisory.md). Do not apply the current forced Next.js downgrade recommendation.

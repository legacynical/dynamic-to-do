# 0002. Provider Loading Browser Coverage

Last updated: 2026-05-11 8:40 AM PDT
Status: complete
Primary requirements: [AI todo generation SRD](../subsystem-requirements/ai-todo-generation.md), [Task list interaction SRD](../subsystem-requirements/task-list-interaction.md)
Architecture context: [Architecture](../architecture.md)

## Slice

Add deterministic browser coverage for provider-backed generation loading, success, failure, and retry recovery without requiring live Nebius credentials.

This slice was selected because pure tests already proved prompt construction, normalization, provider request shape, and local state helpers. The missing proof was the real rendered UI while the server action is in flight: loading text, disabled generation/clear controls, local edits during loading, successful generated append, generic failure display, no partial todos after provider failure, and retry recovery after a failed run.

## Readiness judgment

Target delivery confidence: high. The PRD and SRDs already define loading, append, and failure behavior. The slice does not decide live-provider policy, persistence, retry diagnostics, pointer drag, or provider/model choice.

First-principles risk: low to medium. The main design risk was adding a provider test seam without exposing provider configuration to browser code or pretending that a mock provider proves live Nebius availability.

Blocker flags: none. The change stays server-side and uses the current Nebius endpoint as the default.

## Implementation notes

- `lib/todo-generation-service.mjs` now accepts an optional `baseURL` parameter and still defaults to `NEBIUS_BASE_URL`.
- `app/actions.ts` passes `process.env.NEBIUS_BASE_URL` into the service so Playwright can point the server action at a local mock OpenAI-compatible endpoint.
- `.env.example` documents optional `NEBIUS_BASE_URL`, and `scripts/check-env.mjs` validates it as an `http(s)` URL when present.
- `playwright.config.ts` runs the e2e Next server with a dummy `NEBIUS_API_KEY` and the local mock-provider base URL. The suite runs with one worker so fixed-port mock provider tests cannot race each other.
- `e2e/generation-provider.spec.ts` starts a tiny local OpenAI-compatible HTTP server per test and holds the response until the browser has asserted the in-flight UI state.
- The mock provider can queue multiple responses so browser coverage can prove a failed generation clears on retry and a later success appends generated tasks.

## Validation

Executed validation:

- `npm run test` passed: 16 tests.
- `env NEBIUS_API_KEY=dummy NEBIUS_BASE_URL=http://127.0.0.1:4315/v1 npm run env:check` passed without printing secret values.
- `node --check scripts/check-env.mjs` passed.
- `npm run lint` passed.
- `npm run test:e2e -- --project=chromium` failed once under sandbox restrictions because Next could not bind `127.0.0.1:3000`, then passed with approved local-server permissions: 5 browser tests.
- `npm run build` passed.
- Docs link check passed for 11 markdown files.
- `git diff --check` passed.
- `npm run env:check` failed on 2026-05-11 8:34 AM PDT because `NEBIUS_API_KEY` is not present. This is expected live-provider gate evidence; it does not invalidate the mock-provider browser coverage above.
- `npm run test:e2e -- --project=chromium` passed after retry-after-failure coverage was added: 6 browser tests.

## Bugs, feedback, and investigation

The first browser run was blocked by sandbox networking permissions, not by product code. Rerunning with local server-port approval passed. The e2e server logs still show expected server-action errors for failure tests; the visible UI catches them and shows the generic recoverable error state.

## Documentation feedback

- AI generation and task-list SRDs can now treat loading-time browser coverage as complete for the current session-local contract.
- The tech-stack future-considerations row should no longer say browser coverage excludes AI generation and provider errors; pointer-drag coverage and live Nebius success remain separate.
- Live provider proof still belongs behind `npm run env:check` and a real `NEBIUS_API_KEY`; the mock provider is local UI/server-action contract proof only.

## Educational journal

The useful engineering move here is the server-side test seam. Browser `page.route()` cannot intercept the provider request because the request is made by the Next server action, not by the browser. Pointing only the server process at a local OpenAI-compatible mock keeps provider credentials out of client code while giving Playwright deterministic control over slow success and slow failure.

Holding the mock response is what makes the loading state test meaningful. Without that pause, a fast success only proves the final append. With a controlled in-flight request, the test can verify the real middle state where regressions usually happen: Generate and Clear All are disabled, loading text is visible, and ordinary list edits can still happen without being overwritten when generated tasks arrive.

## Done when

- Slow provider success shows loading state, disables Generate and Clear All, preserves manual edits/additions made during loading, and appends normalized generated tasks.
- Slow provider failure shows loading state, clears loading afterward, displays the generic user-visible error, preserves existing todos, and creates no partial generated todos.
- Retry after provider failure clears the previous visible error, preserves existing todos, and appends the later successful generated result.
- The provider override stays server-only and defaults to the production Nebius endpoint when unset.
- Validation passes without live Nebius credentials.

## Recent log

- 2026-05-11 07:51 AM PDT: Added server-only provider base URL override, optional env validation, deterministic mock-provider Playwright coverage, and focused service test coverage.
- 2026-05-11 08:34 AM PDT: Rechecked live-provider readiness. `npm run env:check` reports missing `NEBIUS_API_KEY`, so a real Nebius smoke test remains gated on owner-provided credentials.
- 2026-05-11 8:40 AM PDT: Added browser coverage for retry-after-failure recovery using queued mock-provider responses.

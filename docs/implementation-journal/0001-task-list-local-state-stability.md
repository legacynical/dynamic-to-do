# 0001. Task List Local State Stability

Last updated: 2026-05-11 06:18 AM PDT
Status: complete with dependency-advisory follow-up
Primary requirements: [Task list interaction SRD](../subsystem-requirements/task-list-interaction.md)
Architecture context: [Architecture](../architecture.md)

## Slice

Stabilize local task-list interactions so invalid drag-end events cannot crash or reorder surprisingly, and so an in-flight generation request cannot overwrite manual local edits made before the generated tasks resolve.

This was selected as the first implementation-pipeline pass because the SRD already had two concrete risk/action items for the same state-ownership fault line:

- Defensive drag-end guards before reading `over.id` or using missing indexes.
- Functional state updates for generated append and local todo mutations that depend on the previous list.

## Readiness judgment

Target delivery confidence: high. The PRD and task-list SRD clearly define session-local state, append semantics, and DnD failure behavior.

First-principles risk: low for the selected code slice. Broader UX questions remain open for persistence, Clear All recovery, blank edit behavior, and loading-time interaction policy, but this patch does not decide them.

Blocker flags: none for this slice. The change preserves current public behavior and does not add persistence, provider contracts, or UI policy changes.

## Implementation notes

- `handleDragEnd` now treats missing `over`, same-ID drops, and missing source/target indexes as no-ops.
- Generated todos append with `setTodos((currentTodos) => ...)`, so manual add/edit/toggle/delete/reorder changes made while generation is loading are preserved at resolution time.
- Manual add, update, toggle, and delete also use functional state updates to avoid stale-closure regressions in adjacent local interactions.
- The Generate button and handler now trim project text before invoking the server action, matching the existing "empty prompt should not generate" requirement more closely without changing server action behavior.

## Validation

Executed validation:

- `npm ci --cache ./.npm-cache --loglevel=warn` installed dependencies from the lockfile.
- `npm audit fix --cache ./.npm-cache` cleared the critical `form-data` and dev-only `brace-expansion` advisories.
- `npm audit fix --force --cache ./.npm-cache` upgraded Next.js from 15.2.3 to 15.5.18 instead of leaving the known critical Next.js advisory in place.
- `npm install --save-dev eslint-config-next@15.5.18 --cache ./.npm-cache --loglevel=warn` aligned the Next ESLint rules package with the upgraded framework.
- `npm run lint` passes after moving the lint script to `eslint .` and excluding generated/cache folders in `eslint.config.mjs`.
- `npm run test` passes with Node's built-in test runner covering pure todo-state transitions.
- `npm run build` passes on Next.js 15.5.18.
- Follow-up accessibility pass: `npm run test`, `npm run lint`, `npm run build`, and `git diff --check` pass after adding accessible names to compact todo row controls.
- Browser interaction pass: `npm install --save-dev @playwright/test` added the harness; `npm run test`, `npm run lint`, `npm run build`, and `npm run test:e2e -- --project=chromium` pass after adding the manual todo interaction spec. The first sandboxed e2e run could not bind `127.0.0.1:3000`; rerunning with approved local-server permissions passed.
- Generation failure UX pass: added `.env.example`, visible generic generation failure state, and Playwright coverage proving existing todos remain after a failed generation attempt without provider credentials.
- Setup durability pass: explicitly unignored `.env.example` and added `npm run env:check` so the Nebius provider setup contract is reviewable and can be validated without printing secret values.
- Generation normalization pass: added `lib/generated-todos.mjs` and `test/generated-todos.test.mjs`; `npm run test`, `npm run lint`, `npm run test:e2e -- --project=chromium`, `npm run build`, docs link check, and `git diff --check` pass.
- Keyboard reorder pass: added deterministic ArrowUp/ArrowDown reorder handling on the drag handle through the same ID-based reorder helper, plus Playwright coverage proving keyboard reorder moves items by stable identity. The first Space/ArrowDown dnd-kit-only test failed because rendered keyboard drag stayed over the same item; the fix makes the advertised keyboard affordance explicit instead of depending on fragile drag-sensor geometry.
- Server generation-boundary pass: added `lib/todo-generation-input.mjs` so the Server Action trims the project prompt, rejects blank prompts, rejects non-finite or out-of-range work-life ratios, and verifies `NEBIUS_API_KEY` before opening the provider client path. `test/todo-generation-input.test.mjs` covers the input helper without requiring provider credentials, and focused Playwright generation-failure coverage now logs the expected Nebius setup error instead of the OpenAI SDK's default `OPENAI_API_KEY` message.
- Prompt construction pass: added `lib/todo-generation-prompt.mjs` and `test/todo-generation-prompt.test.mjs` so the `0%`, `50%`, and `100%` work-life ratio wording is covered without provider credentials.
- Provider request pass: extracted `lib/todo-generation-service.mjs` and added mocked-client tests for validation-before-client-construction, Nebius client options, model name, temperature, prompt handoff, normalized success output, and unusable output rejection.
- Provider request validation pass: `npm run test` passed with 15 tests, `npm run lint` passed, `npm run build` passed, docs link check passed, `git diff --check` passed, and `npm run test:e2e -- --project=chromium` passed after rerunning with approved local-server permissions because the first sandboxed attempt could not bind `127.0.0.1:3000`.
- Environment readiness check: `npm run env:check` validates `NEBIUS_API_KEY` from `.env.local`, `.env`, or the process environment without printing the secret value.

Dependency audit status:

- `npm audit --omit=dev --cache ./.npm-cache` still reports a moderate PostCSS advisory through Next.js' internal dependency graph.
- The current forced audit recommendation would install `next@9.3.3`, which would be a framework downgrade and is not an acceptable automatic fix.
- Current npm metadata checked on 2026-05-11 shows Next.js 15.5.18 and latest 16.2.6 both declare nested `postcss` 8.4.31, so a plain Next major upgrade is not a known fix for this advisory yet.
- This is tracked in [Next.js PostCSS audit advisory research](../research/next-postcss-audit-advisory.md) as a dependency-advisory follow-up against future patched Next.js releases or a deliberately researched override, not treated as part of the task-list behavior slice.

Manual inspection performed:

- Dropping outside a sortable target must not read `over.id` or throw.
- Missing source/target IDs must leave the list unchanged.
- Generated results must append to the current list, not the pre-request list.
- Manual mutations remain local and immediate.
- Pure state helper coverage now verifies whitespace rejection, generated append preservation, duplicate text independence, invalid drag no-ops, and valid id-based reorder.
- Icon-only edit, save, cancel, delete, drag, and completion controls now expose action-specific accessible names.
- Playwright coverage verifies empty state, disabled Generate button with an empty project prompt, manual Add, Enter-to-add, completion toggle semantics, edit cancel, edit Enter-save, item delete, Clear All, and empty-state restoration.
- Playwright coverage verifies a failed generation attempt surfaces a generic error and preserves existing local todos.
- Playwright coverage verifies focusing the reorder handle and pressing ArrowDown moves a todo below its next sibling while preserving stable item identity.
- Pure generation helper coverage verifies bullet/number stripping, exact duplicate removal, obvious explanatory prose filtering, and failure on no usable todo output.
- Pure generation-input coverage verifies prompt trimming plus blank prompt and invalid ratio rejection.
- Pure prompt coverage verifies the provider prompt includes the user project, `5-7` item request, and expected Work/Life ratio wording.

## Documentation feedback

- Added root architecture guidance for page-owned local state, server-action provider boundary, DnD no-op guards, and functional state-update constraints.
- Added tech-stack routing so future agents can see the current Next.js, React, dnd-kit, OpenAI SDK, Tailwind, npm, Playwright, and validation surfaces before changing code.
- Updated task-list SRD task triage to remove completed first-slice items and preserve remaining product/UX risks.

## Remaining follow-up

- Expand browser interaction coverage for loading-time interaction policy and drag behavior in separate slices if those risks become priority.
- Expand browser pointer-drag coverage separately if dnd-kit pointer behavior becomes a priority; keyboard reorder is now covered through explicit handle behavior.
- Extend generation normalization fixtures if live provider output reveals unsupported malformed formats.
- Track the remaining Next.js/PostCSS audit advisory without applying the unsafe forced downgrade recommendation.

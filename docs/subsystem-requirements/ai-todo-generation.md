# AI Todo Generation SRD

Last verified: 2026-05-11 7:03 AM PDT

## Subsystem summary

The AI todo generation subsystem turns a user-provided project or day-plan prompt plus a work-life ratio into a small list of plain-text todo suggestions. It is currently implemented by the `generateTodos` Server Action in `app/actions.ts`, using the `openai` client against the Nebius AI Studio OpenAI-compatible API.

This SRD owns the server-side generation boundary, ratio-to-prompt semantics, provider request contract, model-output parsing expectations, normalization gaps, failure handoff to the caller, and validation needs. It does not own local todo identity, editing, completion, deletion, clearing, drag-and-drop ordering, or visual list controls; those belong to [Task list interaction SRD](task-list-interaction.md).

## A. Provider Boundary And Secret Handling

- `generateTodos(project, workLifeRatio)` is the only current generation entry point and returns `Promise<string[]>`.
- Provider-specific configuration must stay inside the Server Action boundary so the browser-facing workflow remains provider-agnostic.
- The current provider client uses:

| Provider contract | Current value |
| --- | --- |
| SDK shape | `OpenAI` client from the `openai` package |
| Base URL | `https://api.studio.nebius.com/v1/` |
| Required secret | `process.env.NEBIUS_API_KEY` |
| Model | `meta-llama/Meta-Llama-3.1-70B-Instruct` |
| Temperature | `0.6` |

- Provider credentials must be read only from server-side environment variables and must not become a client configuration requirement.
- The action validates input and checks `NEBIUS_API_KEY` before constructing the provider client so local setup failures are classified against the app's configured provider, not the OpenAI SDK's default `OPENAI_API_KEY` fallback.
- The Server Action must not enable browser-side SDK usage flags for provider clients. The generation provider belongs to server code only.
- The client-side todo workflow must treat provider choice, model name, base URL, and API key names as implementation details of the generation action.
- Provider errors must be collapsed to a generic thrown generation error at the action boundary unless a future diagnostics contract explicitly allows more detail.

## B. Invocation And Ratio Semantics

- The caller passes the user's project prompt as `project` and a normalized ratio as `workLifeRatio`.
- `workLifeRatio` currently means `0` is all Life, `1` is all Work, and intermediate values represent the Work percentage.
- The current page derives the ratio from the slider with `workLifeBalance[0] / 100`, where the slider displays the complementary labels as `{100 - workLifeBalance[0]}% Life / {workLifeBalance[0]}% Work`.
- The action converts the ratio into rounded prompt percentages:

| Input | Prompt wording |
| --- | --- |
| `0` | `0% Work, 100% Life` |
| `0.5` | `50% Work, 50% Life` |
| `1` | `100% Work, 0% Life` |

- The generation action trims project or day-plan text at the server boundary and rejects blank prompts before calling the provider.
- The action rejects non-finite or out-of-range ratio values outside `0..1` before calling the provider. It does not clamp invalid values because a bad caller contract should fail clearly instead of silently changing the user's balance.
- Generated suggestions are appended by the caller to existing todos, not used to replace the list.

## C. Prompt And Provider Request Contract

- The prompt must ask for `5-7` todo items for the user-supplied project or day-plan prompt.
- The prompt must include the calculated Work and Life percentages so the model has an explicit balance target.
- A more work-focused ratio should bias the output toward professional tasks related to the project.
- A more life-focused ratio should include more personal wellbeing and break tasks, with fewer work items.
- The prompt must request simple newline-separated task text and reject model thoughts, numbering, bullets, and extra formatting.
- Prompt construction lives in `lib/todo-generation-prompt.mjs` so ratio wording can be validated without provider credentials.
- Provider request construction lives in `lib/todo-generation-service.mjs` so input validation, Nebius client options, model name, temperature, prompt handoff, and output normalization can be tested without live provider credentials.
- The provider request currently sends one `user` message containing the full instruction prompt. There is no separate `system` message and no additional structured output schema.
## D. Output Parsing And Normalization

- The action currently reads `completion.choices[0]?.message?.content || ""`.
- The output normalization path lives in `lib/generated-todos.mjs` so malformed model output can be tested without provider credentials.
- The parser splits by line, trims whitespace, strips common bullets, numbering, lettered list markers, and `Task N:` / `Todo N:` prefixes, removes obvious lead-in/outro prose, dedupes exact tasks case-insensitively, and rejects output with no usable todo lines.
- The returned value is an array of task text strings. The caller owns local todo IDs and maps each returned line into `{ id, text, completed: false }`.
- The action must not return markdown, HTML, rich text, model reasoning, or provider metadata as todo data.
- AI output is untrusted text. The current React rendering path treats it as text, and future changes must preserve that boundary.

Remaining normalization decisions:

| Decision | Current branch behavior | Requirement direction |
| --- | --- | --- |
| Bullets or numbering | Common bullets, numeric markers, letter markers, and `Task N:` / `Todo N:` prefixes are stripped. | Extend fixtures if provider output reveals more formats. |
| Duplicate tasks | Exact case-insensitive duplicates are dropped. | Decide whether near-duplicate semantic dedupe is worth the complexity. |
| More or fewer than `5-7` tasks | Returned as-is. | Decide whether count should be enforced after parsing. |
| Empty provider content | Throws a parsing error that becomes the generic generation failure. | Decide whether empty output should retry, fall back, or remain a failure. |
| Explanatory lead-in/outro | Obvious lead-in/outro lines are dropped. | Extend fixtures if provider output reveals more prose forms. |

## E. User-Visible Failure Handoff

- Provider setup failures, provider request failures, input validation failures, and parsing-flow exceptions are logged server-side and rethrown as `Error("Failed to generate todos")`.
- The client currently catches the thrown error, logs `Failed to generate todos:`, and clears the loading state.
- Existing todos must remain visible and unchanged after any generation failure.
- Failed generation must not create partial local todos unless the action returned a successful `string[]`.
- Current UX surfaces a generic visible error after failed generation while preserving existing todos.
- The generation subsystem owns the thrown action-level failure shape; the task-list/UI subsystem owns how that failure is presented, retried, or dismissed.

## F. Validation And Regression Coverage

- Mock provider success with clean newline output and verify the action returns non-empty trimmed strings only.
- Mock provider output containing bullets, numbering, duplicate lines, explanatory prose, and out-of-range task counts so future normalization rules have regression coverage.
- Mock missing or empty provider content and verify it fails through the generic generation error path.
- Mock provider exceptions and verify the action throws the generic generation error without leaking provider details or secrets.
- Validate prompt construction at `0% Work`, `50% Work`, and `100% Work` so the provider receives the expected ratio wording.
- Validate project prompt trimming and ratio rejection without provider credentials through the pure input helper.
- Validate provider request construction with a mocked client so local input/key validation happens before client construction and the configured Nebius model request is stable.
- Verify slow provider success and failure through browser coverage using a server-side mock provider so loading state, generated append, generic failure, and local todo preservation are exercised without live credentials.
- Verify failed generation preserves existing todos, clears the loading state, and creates no partial local todos.
- Verify retry after a provider failure clears the previous visible error and can append a later successful provider response without removing existing todos.
- Verify provider secrets are only read by server action code and are not embedded in client bundles.

## Related documentation

- [Product requirements](../product-requirements.md)
- [Task list interaction SRD](task-list-interaction.md)
- [Documentation index](../_index.md)

## Task triage

tt1. [done] `.env.example` documents the required `NEBIUS_API_KEY` setup value.
tt2. [iterate] Extend output normalization rules if provider output reveals unsupported bullets, numbering, duplicate, or explanatory prose forms.
tt3. [done] Add user-visible error state so provider failures do not look like no-op button clicks.
tt4. [done] Boundary validation now rejects whitespace-only project prompts and out-of-range ratio values before calling the provider.
tt5. [done] Prompt construction is covered by pure tests for balanced, life-focused, and work-focused ratio wording.
tt6. [done] Provider request construction is covered by mocked-client tests for local validation ordering, Nebius client options, model, temperature, prompt content, and unusable output rejection.
tt7. [done] Browser coverage now verifies slow provider success, failure, and retry-after-failure recovery through a server-side mock OpenAI-compatible endpoint without live Nebius credentials.

## Open questions

oq1. Is Nebius AI Studio with `meta-llama/Meta-Llama-3.1-70B-Instruct` the intended long-term generation provider/model, or should this subsystem be provider-pluggable?
oq2. Should empty provider output remain a generic generation failure, trigger a provider retry, or fall back to deterministic suggested tasks?
oq3. Should generated task count be strictly enforced at 5-7 items after parsing, or is the prompt-level instruction sufficient?
oq4. Which remaining malformed output should be normalized versus rejected outright: unsafe-looking text, near-empty task fragments, near-duplicate tasks, unsupported list markers, or explanatory prose not covered by current fixtures?
oq5. What user-visible failure contract should the UI receive from generation: one generic failure state, typed retryable/non-retryable reasons, or a richer diagnostics object hidden from normal users?

# Product Requirements

Last verified: 2026-05-05 12:58 PM PDT
Source-of-truth for: product goals, scope, user-facing rules, and decision-rich intent for implementers

## A. Product summary

Dynamic To Do is a single-page Next.js application that helps a user turn a project or day-plan prompt into an editable todo list. It combines AI-generated task suggestions with manual task management and a work-life balance control that influences how work-oriented or personal-wellbeing-oriented generated tasks should be.

The PRD owns settled product intent and user-facing behavior. Detailed requirements for AI generation and list interactions live in the SRDs linked in [M. Related documentation](#m-related-documentation).

## B. Product principles

1. **The user stays in control.** AI can propose tasks, but the user must be able to add, edit, reorder, complete, delete, or clear tasks without relying on another generation call.
2. **Generated output should be immediately actionable.** The app should prefer concise task text over explanation, numbering, model reasoning, or formatting that users must clean up.
3. **Work-life balance is a task-shaping input, not decoration.** The slider must affect the generated mix of project work and life/wellbeing tasks in a visible way.
4. **Local interaction should remain fast and forgiving.** Routine task operations should not block on network calls, authentication, or server persistence unless those capabilities are explicitly added.

## C. Scope and milestones

### In scope

- Capture a free-form project or day-plan prompt.
- Capture a 0-100 work-life balance setting displayed as paired Life and Work percentages.
- Generate 5-7 todo item suggestions from the project prompt and work-life ratio.
- Append generated tasks to the existing list instead of replacing it.
- Allow manual task creation, inline editing, completion toggling, deletion, clearing the list, and drag-and-drop reordering.
- Support light/dark/system theming through the existing theme provider and CSS variables.

### Out of scope

- Multi-user collaboration, accounts, sharing, notifications, calendars, recurring tasks, due dates, or prioritization.
- Durable todo persistence across sessions or devices.
- Project history, saved prompt templates, analytics, billing, or administrative controls.
- Treating AI output as authoritative; it is only a task suggestion source.

### Baseline launch bar

- A user can enter a project, adjust the slider, generate tasks, and then manage the resulting todos without page navigation.
- Empty project prompts and empty manual todo text do not create tasks.
- The app handles generation loading state clearly enough that users know a request is in progress.
- Generated tasks are plain task strings with no bullets, numbering, or model explanation when the provider follows the prompt contract.

## D. Users, roles, and states

| Role or state | Description | Product rules |
| --- | --- | --- |
| Individual planner | A person using the app to break down immediate work or a day plan. | Can use AI generation and manual list controls without an account. |
| Todo item | Local task object with `id`, `text`, and `completed`. | `completed` changes visual state only; it does not remove or archive the item. |
| Empty list | No todo items exist and generation is not loading. | Show a lightweight empty state inviting generation or manual entry. |
| Loading generation | A generation request is in flight. | Disable generation and clearing controls; show generation progress text. |
| Editing item | A single todo item is being edited inline. | Save non-empty edits, allow cancellation, and keep the item in place. |

## E. Technology direction

| Layer or concern | Direction | Notes |
| --- | --- | --- |
| Application framework | Next.js App Router with React client components and Server Actions | Current code uses `app/page.tsx`, `app/layout.tsx`, and `app/actions.ts`. |
| UI primitives | Local shadcn/Radix-style components with Tailwind CSS variables | Current controls include Button, Input, Checkbox, and Slider. |
| Drag-and-drop | `@dnd-kit` | Current list ordering uses sortable context, pointer sensor, and keyboard sensor. |
| AI provider | OpenAI-compatible client configured for Nebius AI Studio | Current server action expects `NEBIUS_API_KEY` and model `meta-llama/Meta-Llama-3.1-70B-Instruct`. |

Product-level constraint: provider-specific details should stay behind the generation action so the primary user journey stays provider-agnostic.

## F. Problem, goals, and non-goals

- **Problem:** People often know the theme of work they need to do but need help quickly turning it into a balanced, editable checklist.
- **Goals:** Reduce blank-page planning friction, let users tune the work/life mix, and keep the resulting list easy to revise.
- **Success criteria:** Users can generate usable tasks in one step, refine the list without regenerating, and understand how the balance setting changes output.
- **Non-goals:** The app is not a project management suite, durable task database, or autonomous planning agent.

## G. Journeys and core behavior

### Generate a balanced todo list

- The user enters a project or day-plan prompt.
- The user adjusts the Life/Work slider, which displays complementary percentages.
- The Generate button remains disabled until the project prompt is non-empty.
- On generation, the app sends the prompt and ratio to the server action, displays a loading state, and appends returned task strings as incomplete todos.
- Generation failure should not discard existing todos.

### Manage todos manually

- The user can add a non-empty manual todo with the Add button or Enter key.
- The user can toggle completion without changing task text or order.
- The user can edit an item inline, save a non-empty edit, or cancel to restore the previous text.
- The user can delete an individual item.
- The user can clear all items when the list is non-empty.
- The user can reorder items with drag-and-drop using the existing sortable behavior.

## H. Interface, access, and permissions

- The app is currently a public local web surface with no authentication or role-based permissions.
- Server-only generation behavior must not expose provider credentials to the browser.
- Clear All is destructive for the current in-memory list, but the current product has no durable recovery model.

## I. Data and content model

- **Todo:** `{ id: string, text: string, completed: boolean }`.
- **Project prompt:** User-provided free-form text used to guide generation.
- **Work-life ratio:** Number from `0` to `1` derived from the slider's 0-100 Work percentage.
- **Generated task text:** Plain text line returned by the generation action and converted to a todo item.
- **Persistence boundary:** Todos are currently in React local state only; refresh or navigation can lose the list.

## J. Output, reporting, and integration contract

- **Human output:** A visible list of todo items, empty/loading states, slider percentage labels, and inline controls.
- **Machine output:** `generateTodos(project, workLifeRatio)` returns `Promise<string[]>`.
- **Integration boundary:** The client should treat the returned array as task suggestions and assign local todo IDs before rendering.

## K. Testing and validation strategy

- Build validation should catch TypeScript and Next.js compile failures.
- Manual walkthrough should cover empty project disabled state, generation loading state, append behavior, manual add by Enter and button, edit save/cancel, completion toggle, delete, clear all, and drag reorder.
- Generation validation should test provider success, provider failure, empty provider response, and responses that include bullets or numbering despite prompt instructions.

## L. Trust, safety, and operations

- Provider API keys must be read from server-side environment variables and must not be required by client code.
- Generation failures should be recoverable: existing tasks stay visible and the user can retry or continue manually.
- AI output should be treated as untrusted text. It should not be rendered as HTML and should be normalized before becoming todo text when output quality controls are added.
- Destructive local actions should not imply durable deletion until persistence is added.

## M. Related documentation

- [Documentation index](_index.md)
- [AI todo generation SRD](subsystem-requirements/ai-todo-generation.md)
- [Task list interaction SRD](subsystem-requirements/task-list-interaction.md)

## Task triage

tt1. [done] `.env.example` documents required `NEBIUS_API_KEY` and optional server-only `NEBIUS_BASE_URL`.
tt2. [done] Generation failures show a generic visible error while preserving existing todos.
tt3. [done] Generated output normalization strips common bullets, numbering, duplicate lines, and obvious explanatory prose before task creation.

## Open questions

oq1. Should todo lists remain session-only, or should the product add persistence across refreshes and devices?
oq2. Should Nebius AI Studio and the current Llama model remain the intended provider/model, or are they temporary implementation choices?
oq3. Should Clear All require confirmation, undo, or another recovery path once the list can contain meaningful user edits?

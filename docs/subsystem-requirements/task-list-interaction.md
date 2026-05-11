# Task List Interaction SRD

Last verified: 2026-05-11 06:27 AM PDT

## Subsystem summary

The task list interaction subsystem owns the browser-local todo surface on the main page: local list state, manual insertion, generated-task insertion, inline editing, completion toggles, deletion, clearing, empty/loading list states, and drag-and-drop ordering.

This SRD is the source of truth for user-visible list behavior and local state contracts in `app/page.tsx` and `components/todo-item.tsx`. It does not own AI prompt construction, provider credentials, response parsing, or model-output quality; those belong to [AI todo generation SRD](ai-todo-generation.md) and the server action boundary in `app/actions.ts`.

## A. Local state ownership and boundaries

- `app/page.tsx` owns the canonical in-memory `todos` array for the rendered page session.
- Todo operations must remain client-local and immediate after tasks exist; completion, editing, deleting, clearing, and reordering must not depend on a provider call.
- `components/todo-item.tsx` may own transient per-item UI state such as `isEditing` and `editText`, but it must commit durable todo changes only through callbacks supplied by the page.
- The subsystem may read generation output as `string[]`, but it must not parse provider responses, decide prompt rules, or expose provider errors beyond list-level user experience decisions.
- Local state is session-only under current product scope. Refresh, navigation, or remount can lose todos unless PRD `oq1` and this SRD's persistence question are resolved.
- Loading state belongs to the generation entry point, but list operations that remain enabled during loading must merge against the latest local state instead of a stale pre-request snapshot. Todo mutations that depend on the prior list should use functional React state updates.

## B. Todo object and lifecycle contract

| Lifecycle point | Requirement | Current code anchor |
| --- | --- | --- |
| Object shape | A todo is `{ id: string, text: string, completed: boolean }`. | `Todo` interfaces in `app/page.tsx` and `components/todo-item.tsx`. |
| Identity | `id` must stay stable for the item's local lifetime and distinguish duplicate text entries. | Client IDs from `Math.random().toString(36).substring(2, 9)`. |
| Created | New manual or generated todos start incomplete and append to the end of the list. | `addTodo` and `handleGenerateTodos`. |
| Completed | Toggling flips only `completed`; it must not change text, identity, or order. | `toggleTodo`; muted line-through rendering in `TodoItem`. |
| Edited | Saving a non-empty edit updates only `text`; it must not change `id`, `completed`, or order. | `updateTodo` and `handleSave`. |
| Deleted | Individual delete removes only the selected todo. | `deleteTodo`. |
| Cleared | Clear All removes every local todo from the current page session. | `clearTodoList`. |
| Reordered | Drag reorder changes array order only; it must preserve each item's identity, text, and completed state. | `handleDragEnd` and `arrayMove`. |

## C. Generated and manual insertion handoff

- Manual insertion accepts text from the add-todo input, rejects whitespace-only input, creates one incomplete todo, appends it, and clears the input after a successful add.
- Manual insertion must work from both the Add button and Enter key in the add-todo input.
- Generated insertion starts from `generateTodos(project, workLifeRatio)`, treats the returned `string[]` as untrusted plain task text, assigns local IDs on the client, and appends one incomplete todo per returned string.
- Generated insertion must append to the current list rather than replacing existing manual or generated items.
- Generated insertion must append to the latest local list at resolution time. Manual edits, manual additions, completion toggles, and deletes made while generation is loading must not be overwritten when generated tasks arrive.
- Empty project prompts must not start generation; the Generate button remains disabled while `project` is empty or generation is loading.
- Generation failure must not discard or mutate existing todos. User-visible failure handling belongs to product/generation follow-up work; this subsystem still owns preserving local list state during the failure.

## D. Inline editing and cancel semantics

- Entering edit mode seeds the input from the current todo text and keeps the item in its existing position.
- Saving through the check button or Enter key commits only when the edit text is non-empty after trimming.
- Canceling an edit restores the input to the todo text that was current when cancel runs and exits edit mode without calling the parent update callback.
- A blank edit save must not replace the todo with empty text. The current behavior exits edit mode without changing the parent todo; any future stricter behavior should be an explicit owner decision.
- Editing is local to one rendered todo item. The page-level todo array remains authoritative, so remounting or replacing the item can reset transient edit state.
- Editing controls must not accidentally trigger drag behavior; the drag handle remains the intended reorder affordance.

## E. Destructive local actions

- Delete is item-scoped and removes only the selected todo from the local page session.
- Clear All is list-scoped and appears only when the list contains at least one todo.
- Clear All is disabled while generation is loading in current code; if that remains true, generated-task arrival and clear behavior cannot race through the button.
- Delete, edit, and completion remain available while generation is loading in current code; generated-task arrival must preserve those changes.
- Destructive local actions currently have no confirmation, undo, trash, or durable recovery model. That is acceptable only while todos are session-local and owner context has not required persistence.
- If persistence is added, delete and Clear All must be reclassified from ephemeral local mutations to durable destructive actions and must gain an owner-approved recovery or confirmation model.

## F. Drag-and-drop ordering and failure behavior

- The list uses `@dnd-kit` pointer and keyboard sensors through `DndContext` and `SortableContext`.
- Dragging should reorder only when there is both an active item and a valid target item, and their IDs differ.
- Dropping outside a valid target, canceling a drag, or receiving a drag event with no `over` target must be a guarded no-op rather than a crash.
- Reorder calculations must tolerate IDs that are missing from the current array by refusing to move through a guarded no-op. A negative `findIndex` must not reach `arrayMove`.
- Drag ordering must remain compatible with duplicate todo text because identity is ID-based, not text-based.
- Keyboard reordering is part of the intended interaction contract. The drag handle supports ArrowUp and ArrowDown one-slot movement through the same ID-based reorder helper used by drag-end handling.

## G. Accessibility affordances

- Native button, input, and checkbox semantics are required for add, generate, complete, edit, save, cancel, delete, and clear interactions.
- Icon-only actions need accessible names or equivalent affordances that distinguish edit, save, cancel, delete, and drag controls for assistive technology.
- Keyboard operation must cover manual add, edit save, completion toggling through checkbox semantics, and drag-handle ArrowUp/ArrowDown reordering.
- Empty and loading states must remain visible text in the list area and must not conflict with the todo list content.
- Visual completed state must not be the only way to infer task data if future richer statuses are added; currently the checkbox state is the semantic source.
- Accessibility improvements should preserve the compact list layout and avoid turning per-item controls into large explanatory text.

## H. Validation and regression coverage

- Verify whitespace-only manual text does not create a todo; valid manual add appends exactly one incomplete todo and clears the input.
- Verify generated tasks append after existing tasks and preserve local edits, additions, deletes, completion changes, and ordering that happen while generation is loading.
- Verify duplicate generated or manual text remains independently editable, completable, deletable, and reorderable.
- Verify completion changes only visual completion state and does not hide, delete, or reorder the item.
- Verify edit save commits non-empty text through the check button and Enter key; edit cancel discards unsaved changes.
- Verify delete removes only the intended item and Clear All removes the full local list.
- Verify drag reorder preserves `id`, `text`, and `completed`, invalid drag end states do not throw, and keyboard reorder moves by stable item identity rather than display text.
- Verify empty state, generation button disabled state, loading indicator, and Clear All visibility match the current list/loading state.

## Related documentation

- [Product requirements](../product-requirements.md)
- [AI todo generation SRD](ai-todo-generation.md)
- [Documentation index](../_index.md)

## Task triage

tt1. [done] Icon-only edit, save, cancel, delete, drag, and completion controls now have accessible names without expanding the compact row layout.
tt2. [risk] Decide and implement recovery behavior for Clear All if todo persistence is added.
tt3. [done] Automated interaction coverage now combines pure state tests for generated append, invalid drag no-ops, and duplicate text independence with Playwright browser coverage for empty state, disabled generate, manual add, Enter add, completion, edit cancel/save, delete, Clear All, keyboard reorder, slow generation loading controls, local edits during loading, successful generated append, and generation failure preservation.

## Open questions

oq1. Should the task list remain session-only, or should the product add persistence across refreshes and devices? If persistence is added, this SRD needs durable ownership, conflict, and recovery requirements.
oq2. Should Clear All remain a single-click action while the list is session-only, or should it require confirmation or provide undo before persistence exists?
oq3. Should todos stay at the minimal `{ id, text, completed }` shape, or should owner-approved fields such as source, priority, due date, category, or generated/manual provenance become part of the local contract?
oq4. Should blank edit save continue to silently exit edit mode without updating text, or should it keep the item in edit mode and surface validation feedback?
oq5. During generation loading, should all existing list interactions remain available, or should the UI intentionally disable some mutations to simplify concurrency and recovery behavior?

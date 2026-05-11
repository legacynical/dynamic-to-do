import assert from "node:assert/strict";
import test from "node:test";

import {
  addTodoToList,
  appendGeneratedTodos,
  deleteTodoById,
  reorderTodosByIds,
  toggleTodoCompleted,
  updateTodoText,
} from "../lib/todo-state.mjs";

const todos = [
  { id: "a", text: "Alpha", completed: false },
  { id: "b", text: "Beta", completed: true },
  { id: "c", text: "Alpha", completed: false },
];

test("manual add rejects whitespace and appends valid text", () => {
  assert.equal(addTodoToList(todos, "   "), todos);

  let id = 0;
  const nextTodos = addTodoToList(todos, "  Call client  ", () => `new-${++id}`);

  assert.deepEqual(nextTodos.at(-1), {
    id: "new-1",
    text: "  Call client  ",
    completed: false,
  });
  assert.deepEqual(nextTodos.slice(0, 3), todos);
});

test("generated todos append to the latest list without replacing local edits", () => {
  let id = 0;
  const locallyEdited = updateTodoText(todos, "b", "Beta edited");
  const nextTodos = appendGeneratedTodos(locallyEdited, ["Draft brief", "Book gym"], () => `g-${++id}`);

  assert.deepEqual(nextTodos.map((todo) => todo.text), [
    "Alpha",
    "Beta edited",
    "Alpha",
    "Draft brief",
    "Book gym",
  ]);
  assert.deepEqual(nextTodos.slice(3), [
    { id: "g-1", text: "Draft brief", completed: false },
    { id: "g-2", text: "Book gym", completed: false },
  ]);
});

test("duplicate text items remain independent by id", () => {
  const updated = updateTodoText(todos, "c", "Alpha renamed");
  const toggled = toggleTodoCompleted(updated, "a");
  const deleted = deleteTodoById(toggled, "c");

  assert.deepEqual(updated.map((todo) => todo.text), ["Alpha", "Beta", "Alpha renamed"]);
  assert.equal(toggled.find((todo) => todo.id === "a").completed, true);
  assert.deepEqual(deleted.map((todo) => todo.id), ["a", "b"]);
});

test("invalid drag-end states are no-ops and valid drops reorder by id", () => {
  assert.equal(reorderTodosByIds(todos, "a", undefined), todos);
  assert.equal(reorderTodosByIds(todos, "missing", "b"), todos);
  assert.equal(reorderTodosByIds(todos, "a", "missing"), todos);
  assert.equal(reorderTodosByIds(todos, "a", "a"), todos);

  const reordered = reorderTodosByIds(todos, "a", "c");

  assert.deepEqual(reordered.map((todo) => todo.id), ["b", "c", "a"]);
  assert.deepEqual(reordered.find((todo) => todo.id === "a"), todos[0]);
});

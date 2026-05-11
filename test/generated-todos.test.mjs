import assert from "node:assert/strict";
import test from "node:test";

import { normalizeGeneratedTodoOutput } from "../lib/generated-todos.mjs";

test("normalizes bullets and numbering into plain todo text", () => {
  assert.deepEqual(
    normalizeGeneratedTodoOutput(`
      1. Draft project scope
      - Review UI notes
      * Send recap
      Task 4: Take a short break
    `),
    ["Draft project scope", "Review UI notes", "Send recap", "Take a short break"]
  );
});

test("drops obvious explanatory prose and exact duplicate tasks", () => {
  assert.deepEqual(
    normalizeGeneratedTodoOutput(`
      Here are some todo items:
      Draft project scope
      draft project scope
      Sure, these should help
      Review UI notes
    `),
    ["Draft project scope", "Review UI notes"]
  );
});

test("rejects empty or non-task provider output", () => {
  assert.throws(
    () =>
      normalizeGeneratedTodoOutput(`
        Here are the tasks:
        Todo items:
      `),
    /no usable todo items/
  );
});

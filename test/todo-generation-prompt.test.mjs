import assert from "node:assert/strict";
import test from "node:test";

import { buildTodoGenerationPrompt } from "../lib/todo-generation-prompt.mjs";

test("builds prompt with trimmed project and balanced work-life wording", () => {
  const prompt = buildTodoGenerationPrompt({
    project: "ship demo",
    workPercentage: 50,
  });

  assert.match(prompt, /Generate a list of 5-7 todo items for ship demo/);
  assert.match(prompt, /Work-Life Balance: 50% Work, 50% Life/);
  assert.match(prompt, /simple list with each todo item on a new line/);
});

test("builds life-focused and work-focused boundary wording", () => {
  assert.match(
    buildTodoGenerationPrompt({ project: "recover", workPercentage: 0 }),
    /Work-Life Balance: 0% Work, 100% Life/
  );
  assert.match(
    buildTodoGenerationPrompt({ project: "launch", workPercentage: 100 }),
    /Work-Life Balance: 100% Work, 0% Life/
  );
});

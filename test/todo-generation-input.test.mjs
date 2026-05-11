import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTodoGenerationInput } from "../lib/todo-generation-input.mjs";

test("trims project prompt and converts ratio to work percentage", () => {
  assert.deepEqual(normalizeTodoGenerationInput("  ship demo  ", 0.42), {
    project: "ship demo",
    workPercentage: 42,
  });
});

test("rejects blank project prompts", () => {
  assert.throws(
    () => normalizeTodoGenerationInput("   ", 0.5),
    /Project prompt is required/
  );
});

test("rejects non-finite and out-of-range ratios", () => {
  for (const invalidRatio of [-0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => normalizeTodoGenerationInput("ship demo", invalidRatio),
      /Work-life ratio must be between 0 and 1/
    );
  }
});

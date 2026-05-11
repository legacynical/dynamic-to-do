import assert from "node:assert/strict";
import test from "node:test";

import {
  NEBIUS_BASE_URL,
  NEBIUS_TODO_MODEL,
  generateTodoTexts,
} from "../lib/todo-generation-service.mjs";

test("creates the Nebius-compatible client only after local input and key validation", async () => {
  const createClient = mockCreateClient("Plan demo\nWrite script");

  await assert.rejects(
    () =>
      generateTodoTexts({
        project: "   ",
        workLifeRatio: 0.5,
        apiKey: "secret",
        createClient,
      }),
    /Project prompt is required/
  );
  assert.equal(createClient.calls.length, 0);

  await assert.rejects(
    () =>
      generateTodoTexts({
        project: "Ship a demo",
        workLifeRatio: 1.5,
        apiKey: "secret",
        createClient,
      }),
    /Work-life ratio must be between 0 and 1/
  );
  assert.equal(createClient.calls.length, 0);

  await assert.rejects(
    () =>
      generateTodoTexts({
        project: "Ship a demo",
        workLifeRatio: 0.5,
        apiKey: "",
        createClient,
      }),
    /Missing NEBIUS_API_KEY/
  );
  assert.equal(createClient.calls.length, 0);
});

test("sends trimmed prompt content to the configured Nebius model", async () => {
  const createClient = mockCreateClient("Plan demo\nWrite script");

  const todos = await generateTodoTexts({
    project: "  Ship a demo  ",
    workLifeRatio: 0.25,
    apiKey: "secret",
    createClient,
  });

  assert.deepEqual(todos, ["Plan demo", "Write script"]);
  assert.deepEqual(createClient.calls[0], {
    baseURL: NEBIUS_BASE_URL,
    apiKey: "secret",
  });
  assert.equal(createClient.completionCalls.length, 1);
  assert.equal(createClient.completionCalls[0].model, NEBIUS_TODO_MODEL);
  assert.equal(createClient.completionCalls[0].temperature, 0.6);
  assert.match(createClient.completionCalls[0].messages[0].content, /Ship a demo/);
  assert.match(createClient.completionCalls[0].messages[0].content, /25% Work, 75% Life/);
});

test("allows a server-only base URL override for deterministic provider tests", async () => {
  const createClient = mockCreateClient("Plan demo\nWrite script");

  await generateTodoTexts({
    project: "Ship a demo",
    workLifeRatio: 0.5,
    apiKey: "secret",
    baseURL: "http://127.0.0.1:4101/v1",
    createClient,
  });

  assert.deepEqual(createClient.calls[0], {
    baseURL: "http://127.0.0.1:4101/v1",
    apiKey: "secret",
  });
});

test("rejects provider output with no usable todo lines", async () => {
  const createClient = mockCreateClient("Here are some ideas:\nTasks:");

  await assert.rejects(
    () =>
      generateTodoTexts({
        project: "Ship a demo",
        workLifeRatio: 0.5,
        apiKey: "secret",
        createClient,
      }),
    /no usable todo items/
  );
});

function mockCreateClient(responseText) {
  const calls = [];
  const completionCalls = [];

  function createClient(options) {
    calls.push(options);

    return {
      chat: {
        completions: {
          create: async (request) => {
            completionCalls.push(request);

            return {
              choices: [
                {
                  message: {
                    content: responseText,
                  },
                },
              ],
            };
          },
        },
      },
    };
  }

  createClient.calls = calls;
  createClient.completionCalls = completionCalls;

  return createClient;
}

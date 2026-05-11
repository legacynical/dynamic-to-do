import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { expect, test } from "@playwright/test";

test("slow provider success preserves loading-time local edits and appends generated todos", async ({
  page,
}) => {
  const provider = await startMockProvider({
    status: 200,
    content: "1. Review launch scope\n2. Ship demo polish",
  });

  try {
    await page.goto("/");

    const addInput = page.getByRole("textbox", { name: "New todo text" });
    await addInput.fill("Existing task");
    await page.getByRole("button", { name: "Add" }).click();

    await page
      .getByRole("textbox", { name: "What do you want to work on today?" })
      .fill("ship a demo");
    await page.getByRole("button", { name: "Generate Todo Items" }).click();

    const providerRequest = await provider.waitForRequest();
    await expect(page.getByText("Generating todo items with AI...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generating Todos..." })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Clear All" })).toBeDisabled();

    await page.getByRole("button", { name: "Edit todo: Existing task" }).click();
    await page
      .getByRole("textbox", { name: "Edit todo text: Existing task" })
      .fill("Edited during generation");
    await page.getByRole("button", { name: "Save todo edit: Existing task" }).click();

    await addInput.fill("Added during generation");
    await page.getByRole("button", { name: "Add" }).click();

    provider.release();

    await expect(page.getByText("Review launch scope")).toBeVisible();
    await expect(page.getByText("Ship demo polish")).toBeVisible();
    await expect(page.getByTestId("todo-item")).toHaveText([
      /Edited during generation/,
      /Added during generation/,
      /Review launch scope/,
      /Ship demo polish/,
    ]);
    expect(providerRequest.model).toBe("meta-llama/Meta-Llama-3.1-70B-Instruct");
    expect(providerRequest.messages[0].content).toContain("ship a demo");
  } finally {
    await provider.close();
  }
});

test("slow provider failure clears loading, shows generic error, and preserves todos", async ({
  page,
}) => {
  const provider = await startMockProvider({
    status: 400,
    content: "Partial provider todo",
  });

  try {
    await page.goto("/");

    const addInput = page.getByRole("textbox", { name: "New todo text" });
    await addInput.fill("Keep existing task");
    await page.getByRole("button", { name: "Add" }).click();

    await page
      .getByRole("textbox", { name: "What do you want to work on today?" })
      .fill("ship a demo");
    await page.getByRole("button", { name: "Generate Todo Items" }).click();

    await provider.waitForRequest();
    await expect(page.getByText("Generating todo items with AI...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generating Todos..." })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Clear All" })).toBeDisabled();

    provider.release();

    await expect(
      page.getByText("Could not generate todos. Check setup and try again.")
    ).toBeVisible();
    await expect(page.getByText("Keep existing task")).toBeVisible();
    await expect(page.getByText("Partial provider todo")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Generate Todo Items" })).toBeEnabled();
  } finally {
    await provider.close();
  }
});

test("retry after provider failure clears the error and appends successful results", async ({
  page,
}) => {
  const provider = await startQueuedMockProvider([
    {
      status: 400,
      content: "Partial provider todo",
    },
    {
      status: 200,
      content: "1. Retry generated task",
    },
  ]);

  try {
    await page.goto("/");

    const addInput = page.getByRole("textbox", { name: "New todo text" });
    await addInput.fill("Keep existing task");
    await page.getByRole("button", { name: "Add" }).click();

    const promptInput = page.getByRole("textbox", {
      name: "What do you want to work on today?",
    });
    await promptInput.fill("ship a demo");
    await page.getByRole("button", { name: "Generate Todo Items" }).click();

    await provider.waitForRequest(0);
    provider.release(0);

    const error = page.getByText("Could not generate todos. Check setup and try again.");
    await expect(error).toBeVisible();
    await expect(page.getByText("Keep existing task")).toBeVisible();

    await page.getByRole("button", { name: "Generate Todo Items" }).click();
    await expect(error).toHaveCount(0);

    await provider.waitForRequest(1);
    provider.release(1);

    await expect(page.getByText("Retry generated task")).toBeVisible();
    await expect(page.getByTestId("todo-item")).toHaveText([
      /Keep existing task/,
      /Retry generated task/,
    ]);
  } finally {
    await provider.close();
  }
});

interface MockProviderOptions {
  status: number;
  content: string;
}

async function startMockProvider({ status, content }: MockProviderOptions) {
  const provider = await startQueuedMockProvider([{ status, content }]);

  return {
    waitForRequest: () => provider.waitForRequest(0),
    release: () => provider.release(0),
    close: provider.close,
  };
}

async function startQueuedMockProvider(responses: readonly MockProviderOptions[]) {
  const responseGates = responses.map(() => {
    let releaseResponse: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });

    return {
      gate,
      release: releaseResponse,
    };
  });
  const requestGates = responses.map(() => {
    let resolveRequest: (body: any) => void = () => {};
    const requestSeen = new Promise<any>((resolve) => {
      resolveRequest = resolve;
    });

    return {
      requestSeen,
      resolveRequest,
    };
  });
  let requestIndex = 0;

  const server = createServer(
    async (request: IncomingMessage, response: ServerResponse) => {
      if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
        response.writeHead(404);
        response.end();
        return;
      }

      const body = JSON.parse(await readRequestBody(request));
      const currentIndex = requestIndex;
      requestIndex += 1;
      const queuedResponse = responses[currentIndex];

      if (!queuedResponse) {
        response.writeHead(500);
        response.end(
          JSON.stringify({ error: { message: "unexpected mock provider request" } })
        );
        return;
      }

      requestGates[currentIndex].resolveRequest(body);
      await responseGates[currentIndex].gate;

      response.setHeader("Content-Type", "application/json");
      response.statusCode = queuedResponse.status;
      response.end(
        JSON.stringify(
          queuedResponse.status >= 400
            ? { error: { message: "mock provider failure" } }
            : {
                id: "chatcmpl-e2e",
                object: "chat.completion",
                created: Math.floor(Date.now() / 1000),
                model: body.model,
                choices: [
                  {
                    index: 0,
                    message: {
                      role: "assistant",
                      content: queuedResponse.content,
                    },
                    finish_reason: "stop",
                  },
                ],
              }
        )
      );
    }
  );

  await new Promise<void>((resolve) => server.listen(4315, "127.0.0.1", resolve));

  return {
    waitForRequest: (index: number) => requestGates[index].requestSeen,
    release: (index: number) => responseGates[index].release(),
    async close() {
      for (const responseGate of responseGates) {
        responseGate.release();
      }
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

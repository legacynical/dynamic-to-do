import { normalizeGeneratedTodoOutput } from "./generated-todos.mjs";
import { normalizeTodoGenerationInput } from "./todo-generation-input.mjs";
import { buildTodoGenerationPrompt } from "./todo-generation-prompt.mjs";

export const NEBIUS_BASE_URL = "https://api.studio.nebius.com/v1/";
export const NEBIUS_TODO_MODEL = "meta-llama/Meta-Llama-3.1-70B-Instruct";

export async function generateTodoTexts({
  project,
  workLifeRatio,
  apiKey,
  baseURL = NEBIUS_BASE_URL,
  createClient,
}) {
  const generationInput = normalizeTodoGenerationInput(project, workLifeRatio);

  if (!apiKey) {
    throw new Error("Missing NEBIUS_API_KEY");
  }

  const client = createClient({
    baseURL,
    apiKey,
  });
  const prompt = buildTodoGenerationPrompt(generationInput);
  const completion = await client.chat.completions.create({
    temperature: 0.6,
    model: NEBIUS_TODO_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const responseText = completion.choices[0]?.message?.content || "";

  return normalizeGeneratedTodoOutput(responseText);
}

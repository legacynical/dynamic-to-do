"use server";

import OpenAI from "openai";

import { generateTodoTexts } from "@/lib/todo-generation-service.mjs";

// Initialize the OpenAI client with Nebius AI Studio configuration
// The client is only created on the server side since this is a Server Action
export async function generateTodos(
  project: string,
  workLifeRatio: number
): Promise<string[]> {
  try {
    const apiKey = process.env.NEBIUS_API_KEY;

    return await generateTodoTexts({
      project,
      workLifeRatio,
      apiKey,
      baseURL: process.env.NEBIUS_BASE_URL,
      createClient: (options) => new OpenAI(options),
    });
  } catch (error) {
    console.error("Error generating todos:", error);
    throw new Error("Failed to generate todos");
  }
}

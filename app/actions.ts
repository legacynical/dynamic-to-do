"use server";

import OpenAI from "openai";

// Initialize the OpenAI client with Nebius AI Studio configuration
// The client is only created on the server side since this is a Server Action
export async function generateTodos(
  project: string,
  workLifeRatio: number
): Promise<string[]> {
  try {
    // Initialize the client inside the server action to ensure it only runs on the server
    const client = new OpenAI({
      baseURL: "https://api.studio.nebius.com/v1/",
      apiKey: process.env.NEBIUS_API_KEY,
      dangerouslyAllowBrowser: true, // This is safe because we're in a server action
    });

    // Calculate work-life balance description
    const workPercentage = Math.round(workLifeRatio * 100);
    const lifePercentage = 100 - workPercentage;

    // Construct the prompt for the AI
    const prompt = `You are a dynamic todo list generator.
      Generate a list of 5-7 todo items for ${project}.
      
      Consider the following metric:
      Work-Life Balance: ${workPercentage}% Work, ${lifePercentage}% Life
      
      If the balance is more work-focused, include more professional tasks related to the project.
      If the balance is more life-focused, include more personal well-being and break tasks with fewer work items.
      
      Format the response as a simple list with each todo item on a new line.
      DO NOT include model thoughts, numbers, bullets, or any other formatting - only the plain text of each task.`;

    const userPrompt = `${project}`;

    // Call the Nebius AI Studio API
    const completion = await client.chat.completions.create({
      temperature: 0.6,
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the response text
    const responseText = completion.choices[0]?.message?.content || "";

    // Split the response into individual todo items
    // This assumes the model follows instructions to put each item on a new line
    const todos = responseText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return todos;
  } catch (error) {
    console.error("Error generating todos:", error);
    throw new Error("Failed to generate todos");
  }
}

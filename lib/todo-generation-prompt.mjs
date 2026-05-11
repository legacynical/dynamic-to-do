export function buildTodoGenerationPrompt({ project, workPercentage }) {
  const lifePercentage = 100 - workPercentage;

  return `You are a dynamic todo list generator.
Generate a list of 5-7 todo items for ${project}.

Consider the following metric:
Work-Life Balance: ${workPercentage}% Work, ${lifePercentage}% Life

If the balance is more work-focused, include more professional tasks related to the project.
If the balance is more life-focused, include more personal well-being and break tasks with fewer work items.

Format the response as a simple list with each todo item on a new line.
DO NOT include model thoughts, numbers, bullets, or any other formatting - only the plain text of each task.`;
}

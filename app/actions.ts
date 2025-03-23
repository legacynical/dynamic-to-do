"use server"

// This is a placeholder for the actual Nebius AI Studio API integration
// You'll need to replace this with the actual API call to Nebius AI Studio
export async function generateTodos(project: string, workLifeRatio: number): Promise<string[]> {
  try {
    // In a real implementation, you would call the Nebius AI Studio API here
    // For now, we'll simulate a response based on the project and work-life ratio

    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const workFocused = workLifeRatio >= 0.5

    // Generate different types of todos based on the work-life ratio
    let todos: string[] = []

    if (workFocused) {
      // More work-related tasks
      todos = [
        `Research best practices for ${project}`,
        `Create a project plan for ${project}`,
        `Schedule a meeting with stakeholders about ${project}`,
        `Document requirements for ${project}`,
        `Set up development environment for ${project}`,
      ]

      // Add some life-related tasks based on the ratio
      if (workLifeRatio < 0.8) {
        todos.push("Take a 15-minute break every 2 hours")
        todos.push("Schedule time for lunch away from your desk")
      }
    } else {
      // More life-related tasks with some work
      todos = [
        `Brainstorm ideas for ${project} (30 minutes max)`,
        "Take a 30-minute walk outside",
        "Practice mindfulness meditation for 10 minutes",
        "Plan a fun activity for the evening",
        "Check in with a friend or family member",
      ]

      // Add some work-related tasks based on the ratio
      if (workLifeRatio > 0.2) {
        todos.push(`Review progress on ${project}`)
        todos.push(`Identify one small task to complete for ${project}`)
      }
    }

    return todos
  } catch (error) {
    console.error("Error generating todos:", error)
    throw new Error("Failed to generate todos")
  }
}


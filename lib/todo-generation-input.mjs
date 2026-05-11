export function normalizeTodoGenerationInput(project, workLifeRatio) {
  const normalizedProject = typeof project === "string" ? project.trim() : "";

  if (!normalizedProject) {
    throw new Error("Project prompt is required");
  }

  if (
    typeof workLifeRatio !== "number" ||
    !Number.isFinite(workLifeRatio) ||
    workLifeRatio < 0 ||
    workLifeRatio > 1
  ) {
    throw new Error("Work-life ratio must be between 0 and 1");
  }

  return {
    project: normalizedProject,
    workPercentage: Math.round(workLifeRatio * 100),
  };
}

const LIST_MARKER_PATTERN =
  /^\s*(?:[-*•]\s+|\d+[\).]\s+|[a-zA-Z][\).]\s+|(?:todo|task)\s+\d+[\).:-]\s*)/i;

const EXPLANATORY_LINE_PATTERN =
  /^(?:here(?:'s| is| are)|sure\b|of course\b|these are\b|the following\b|generated todo|todo items?:?$|tasks?:?$)/i;

export function normalizeGeneratedTodoOutput(outputText) {
  const seen = new Set();
  const todos = [];

  for (const rawLine of String(outputText ?? "").split(/\r?\n/)) {
    const task = normalizeGeneratedTodoLine(rawLine);

    if (!task) continue;

    const dedupeKey = task.toLocaleLowerCase();
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    todos.push(task);
  }

  if (todos.length === 0) {
    throw new Error("Provider returned no usable todo items");
  }

  return todos;
}

function normalizeGeneratedTodoLine(rawLine) {
  const stripped = String(rawLine ?? "").trim();
  if (!stripped) return null;
  if (EXPLANATORY_LINE_PATTERN.test(stripped)) return null;

  const withoutMarker = stripped.replace(LIST_MARKER_PATTERN, "").trim();
  if (!withoutMarker || EXPLANATORY_LINE_PATTERN.test(withoutMarker)) return null;

  return withoutMarker;
}

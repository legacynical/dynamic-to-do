export function randomTodoId() {
  return Math.random().toString(36).substring(2, 9);
}

export function createTodo(text, idFactory = randomTodoId) {
  return {
    id: idFactory(),
    text,
    completed: false,
  };
}

export function appendGeneratedTodos(todos, generatedTexts, idFactory = randomTodoId) {
  return [
    ...todos,
    ...generatedTexts.map((text) => createTodo(text, idFactory)),
  ];
}

export function addTodoToList(todos, text, idFactory = randomTodoId) {
  if (!text.trim()) return todos;
  return [...todos, createTodo(text, idFactory)];
}

export function updateTodoText(todos, id, text) {
  return todos.map((todo) => (todo.id === id ? { ...todo, text } : todo));
}

export function toggleTodoCompleted(todos, id) {
  return todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
}

export function deleteTodoById(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

export function reorderTodosByIds(todos, activeId, overId) {
  if (!activeId || !overId || activeId === overId) return todos;

  const oldIndex = todos.findIndex((todo) => todo.id === activeId);
  const newIndex = todos.findIndex((todo) => todo.id === overId);

  if (oldIndex === -1 || newIndex === -1) return todos;

  const nextTodos = todos.slice();
  const [moved] = nextTodos.splice(oldIndex, 1);
  nextTodos.splice(newIndex, 0, moved);
  return nextTodos;
}

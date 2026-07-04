"use client"; // Next.js directive for client/server

import { useState } from "react"; // React hook for local state

// Imported ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

import TodoItem from "@/components/todo-item";

// Backend api response handler
import { generateTodos } from "@/app/actions";

// Drag-and-drop feature
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Spinning loading icon
import { Loader2 } from "lucide-react";

import {
  addTodoToList,
  appendGeneratedTodos,
  deleteTodoById,
  reorderTodosByIds,
  toggleTodoCompleted,
  updateTodoText,
} from "@/lib/todo-state.mjs";

// TypeScript interface definitions for type safety:
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// Component and state
// Note: Home component is the main part of the app, (page.tsx)
export default function Home() {
  // an array of Todo objects initialized to empty array []
  const [todos, setTodos] = useState<Todo[]>([]);
  // a string for project (details) initialized to empty string ""
  const [project, setProject] = useState("");
  // a work-life balance percentage initialized to an array with single number element 50
  const [workLifeBalance, setWorkLifeBalance] = useState([50]);
  // a loading boolean initialized to false
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  // a string for new text of a todo item initialized to empty string ""
  const [newTodoText, setNewTodoText] = useState("");

  // Drag-and-drop sensor setup for mouse/touch inputs and keyboard controls
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reordering Todos
  const handleDragEnd = (event: DragEndEvent) => {
    // runs when a drag operation finishes
    const { active, over } = event; // active: todo item being dragged, over: target todo dropped over

    setTodos((items) => {
      const reorderedTodos = reorderTodosByIds(items, active?.id, over?.id);
      return reorderedTodos === items ? items : reorderedTodos;
    });
  };

  const handleGenerateTodos = async () => {
    if (!project.trim()) return;

    setLoading(true);
    setGenerationError(null);
    try {
      const workLifeRatio = workLifeBalance[0] / 100;
      const generatedTodos = await generateTodos(project.trim(), workLifeRatio);

      setTodos((currentTodos) =>
        appendGeneratedTodos(currentTodos, generatedTodos)
      );
    } catch (error) {
      console.error("Failed to generate todos:", error);
      setGenerationError("Could not generate todos. Check setup and try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearTodoList = () => {
    setTodos([]);
  };

  const addTodo = () => {
    setTodos((currentTodos) => {
      const nextTodos = addTodoToList(currentTodos, newTodoText);
      if (nextTodos !== currentTodos) setNewTodoText("");
      return nextTodos;
    });
  };

  const updateTodo = (id: string, text: string) => {
    setTodos((currentTodos) => updateTodoText(currentTodos, id, text));
  };

  const toggleTodo = (id: string) => {
    setTodos((currentTodos) => toggleTodoCompleted(currentTodos, id));
  };

  const deleteTodo = (id: string) => {
    setTodos((currentTodos) => deleteTodoById(currentTodos, id));
  };

  const moveTodo = (id: string, direction: "up" | "down") => {
    setTodos((currentTodos) => {
      const currentIndex = currentTodos.findIndex((todo) => todo.id === id);
      if (currentIndex === -1) return currentTodos;

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const targetTodo = currentTodos[targetIndex];
      if (!targetTodo) return currentTodos;

      return reorderTodosByIds(currentTodos, id, targetTodo.id);
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold text-center"></h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="project-prompt" className="text-lg font-medium">
              What do you want to work on today?
            </label>
            <Input
              id="project-prompt"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="finish a quick hackathon demo video..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="flex justify-center text-lg font-medium">
              {100 - workLifeBalance[0]}% Life / {workLifeBalance[0]}% Work
            </label>
            <Slider
              value={workLifeBalance}
              onValueChange={(value) =>
                setWorkLifeBalance(Array.isArray(value) ? [...value] : [value])
              }
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Life</span>
              <span>Work</span>
            </div>
          </div>

          <div className="flex">
            <Button
              onClick={handleGenerateTodos}
              className="flex-1"
              disabled={loading || !project.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Todos...
                </>
              ) : (
                "Generate Todo Items"
              )}
            </Button>

            {todos.length > 0 && (
              <Button
                onClick={clearTodoList}
                className="bg-red-500 text-white"
                disabled={loading}
              >
                Clear All
              </Button>
            )}
          </div>

          {generationError && (
            <p className="text-sm text-destructive" role="alert">
              {generationError}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Todo List</h2>

          <div className="flex space-x-2">
            <Input
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new todo..."
              aria-label="New todo text"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />
            <Button onClick={addTodo}>Add</Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={todos.map((todo) => todo.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {todos.length === 0 && !loading ? (
                  <p className="text-center text-muted-foreground py-4">
                    No todos yet. Generate some or add your own!
                  </p>
                ) : (
                  todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={() => toggleTodo(todo.id)}
                      onUpdate={(text) => updateTodo(todo.id, text)}
                      onDelete={() => deleteTodo(todo.id)}
                      onMove={(direction) => moveTodo(todo.id, direction)}
                    />
                  ))
                )}

                {loading && (
                  <p className="text-center text-muted-foreground py-4">
                    Generating todo items with AI...
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </main>
  );
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import TodoItem from "@/components/todo-item"
import { generateTodos } from "@/app/actions"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Loader2 } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [project, setProject] = useState("")
  const [workLifeBalance, setWorkLifeBalance] = useState([50])
  const [loading, setLoading] = useState(false)
  const [newTodoText, setNewTodoText] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleGenerateTodos = async () => {
    if (!project) return

    setLoading(true)
    try {
      const workLifeRatio = workLifeBalance[0] / 100
      const generatedTodos = await generateTodos(project, workLifeRatio)

      const newTodos = generatedTodos.map((text: string) => ({
        id: Math.random().toString(36).substring(2, 9),
        text,
        completed: false,
      }))

      setTodos([...todos, ...newTodos])
    } catch (error) {
      console.error("Failed to generate todos:", error)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = () => {
    if (!newTodoText.trim()) return

    const newTodo = {
      id: Math.random().toString(36).substring(2, 9),
      text: newTodoText,
      completed: false,
    }

    setTodos([...todos, newTodo])
    setNewTodoText("")
  }

  const updateTodo = (id: string, text: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, text } : todo)))
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold text-center">AI-Powered Todo List</h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-lg font-medium">What project do you want to work on today?</label>
            <Input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Enter your project..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-lg font-medium">
              Work-Life Balance: {workLifeBalance[0]}% Work / {100 - workLifeBalance[0]}% Life
            </label>
            <Slider value={workLifeBalance} onValueChange={setWorkLifeBalance} max={100} step={1} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Life</span>
              <span>Work</span>
            </div>
          </div>

          <Button onClick={handleGenerateTodos} className="w-full" disabled={loading || !project}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Todos...
              </>
            ) : (
              "Generate Todo Items"
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Todo List</h2>

          <div className="flex space-x-2">
            <Input
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />
            <Button onClick={addTodo}>Add</Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No todos yet. Generate some or add your own!</p>
                ) : (
                  todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={() => toggleTodo(todo.id)}
                      onUpdate={(text) => updateTodo(todo.id, text)}
                      onDelete={() => deleteTodo(todo.id)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </main>
  )
}


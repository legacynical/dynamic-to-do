"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash, Pencil, X, Check } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface TodoItemProps {
  todo: Todo
  onToggle: () => void
  onUpdate: (text: string) => void
  onDelete: () => void
}

export default function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(editText)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(todo.text)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-3 rounded-md border ${todo.completed ? "bg-muted/50" : "bg-card"}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical size={20} />
      </div>

      <Checkbox checked={todo.completed} onCheckedChange={onToggle} className="h-5 w-5" />

      {isEditing ? (
        <div className="flex-1 flex space-x-2">
          <Input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button size="icon" variant="ghost" onClick={handleSave}>
            <Check size={18} />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleCancel}>
            <X size={18} />
          </Button>
        </div>
      ) : (
        <>
          <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>{todo.text}</span>

          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
            <Pencil size={18} />
          </Button>

          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash size={18} />
          </Button>
        </>
      )}
    </div>
  )
}


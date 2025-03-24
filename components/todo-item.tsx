"use client"; // Next.js directive for client/server

import { useState } from "react"; // React hook for local state

// Imported ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Drag-and-drop sorting and animation css from dnd-kit
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Icons from lucide react library
import { GripVertical, Trash, Pencil, X, Check } from "lucide-react";

// TypeScript interface definitions for type safety:
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoItemProps {
  todo: Todo; // object based on Todo interface
  onToggle: () => void; // func to toggle completed status (no arg, no return)
  onUpdate: (text: string) => void; // func to update todo text (new text string arg, no return)
  onDelete: () => void; // func to delete todo (no arg, no return)
}

// Component and state
//  Defines the TodoItem component and sets up local state
//  TodoItem component accepts props matching the TodoItemProps interface
export default function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onDelete,
}: TodoItemProps) {
  // initialize state var isEditing as false (not in edit mode), uses setIsEditing to update
  const [isEditing, setIsEditing] = useState(false);
  // initialize state var editText as current todo.text value, uses setEditText to update
  const [editText, setEditText] = useState(todo.text);

  // Drag-and-drop (@dnd-kit) library
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: todo.id }); // draggable todo item tracked by todo.id
  //  useSortable returns following properties:
  //  attributes: HTML attributes for element access/dragging
  //  listeners: event handlers to detect drag interactions
  //  setNodeRef: func to attach to DOM element that should be draggable
  //  transform: object describing the element's position during drag
  //  transition: CSS transition string for smooth animation
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  /* ex. attached to a <div>:
  
  <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
    {todo.text}
  </div>
  
  -when dragged, div moves smoothly, guided by transform and transition */

  // Edit functions
  const handleSave = () => {
    if (editText.trim()) {
      // if editText.trim() is non-empty:
      onUpdate(editText); // -save new text to parent component
    }
    setIsEditing(false); // set edit mode to false
  };

  const handleCancel = () => {
    setEditText(todo.text); // -reset to original todo.text, discards changes
    setIsEditing(false); // set edit mode to false
  };

  // UI JSX
  // *for comments inside JSX, use {/* */} or {// } (w/ 2nd bracket on newline)
  return (
    // Main wrapper div for todo item
    <div
      ref={setNodeRef} // links to dnd-kit for dragging
      style={style} // applies dnd-kit transform and transition
      className={`flex items-center space-x-2 p-3 rounded-md border ${
        todo.completed ? "bg-muted/50" : "bg-card" // conditional styling format
      }`}
    >
      {/* Drag handle w/ properties from dnd-kit */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
      >
        <GripVertical size={20} /> {/* handle icon from lucide-react library */}
      </div>

      {/* binds checkbox checked state to todo.completed, 
          calls onToggle func (passed as prop) when clicked to update todo's status,
          h-5 w-5 sets size to 5x5 units (in tailwind, usually 20px)
      */}
      <Checkbox
        checked={todo.completed}
        onCheckedChange={onToggle}
        className="h-5 w-5"
      />

      {/* Conditional rendering- edit mode : view mode 
          ternary operator format: {isEditing ? (...) : (...)}
      */}
      {isEditing ? (
        <div className="flex-1 flex space-x-2">
          {/* binds input value state to editText,
              onChange event to update editText as user types,
              flex-1 to make input take up available space,
              autoFocus automatically focuses input when edit mode starts,
              onKeyDown event to save changes on Enter press
          */}
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
          {/* conditional styling to cross off todo.text if todo.completed,
              show todo.text
           */}
          <span
            className={`flex-1 ${
              todo.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {todo.text}
          </span>

          {/* onClick to set isEditing true to switch to edit mode */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            <Pencil size={18} />
          </Button>

          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash size={18} />
          </Button>
        </>
      )}
    </div>
  );
}

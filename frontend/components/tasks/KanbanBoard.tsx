"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { HomeWithMembers, TaskWithRelations } from "@/types"
import { moveTask } from "@/actions/tasks"

const COLUMNS: { id: string; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "inprogress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
]

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-500",
}

function TaskCard({
  task,
  homes,
  onEdit,
  overlay = false,
}: {
  task: TaskWithRelations
  homes: HomeWithMembers[]
  onEdit: (t: TaskWithRelations) => void
  overlay?: boolean
}) {
  const home = homes.find((h) => h.id === task.homeId)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-colors ${overlay ? "shadow-lg rotate-1" : ""}`}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${PRIORITY_COLOR[task.priority] ?? ""}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        {home && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
            {home.name}
          </span>
        )}
        {task.endDate && (
          <span className="text-xs text-gray-400">
            {new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  )
}

function Column({
  column,
  tasks,
  homes,
  onEdit,
}: {
  column: { id: string; label: string }
  tasks: TaskWithRelations[]
  homes: HomeWithMembers[]
  onEdit: (t: TaskWithRelations) => void
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">{column.label}</h2>
        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-16">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} homes={homes} onEdit={onEdit} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function KanbanBoard({
  tasks,
  homes,
  onTasksChange,
  onEdit,
}: {
  tasks: TaskWithRelations[]
  homes: HomeWithMembers[]
  onTasksChange: (updater: (prev: TaskWithRelations[]) => TaskWithRelations[]) => void
  onEdit: (t: TaskWithRelations) => void
}) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const activeTask = tasks.find((t) => t.id === activeId) ?? null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as number)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    // Determine target column
    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    // Check if dropped on a column header or another task
    const targetTask = tasks.find((t) => t.id === over.id)
    const targetStatus = targetTask ? targetTask.status : (over.id as string)

    if (!COLUMNS.find((c) => c.id === targetStatus)) return
    if (draggedTask.status === targetStatus) return

    // Optimistic update
    onTasksChange((prev) =>
      prev.map((t) => (t.id === draggedTask.id ? { ...t, status: targetStatus } : t))
    )

    try {
      await moveTask(draggedTask.id, targetStatus)
    } catch {
      // Revert
      onTasksChange((prev) =>
        prev.map((t) => (t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t))
      )
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            homes={homes}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} homes={homes} onEdit={() => {}} overlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}

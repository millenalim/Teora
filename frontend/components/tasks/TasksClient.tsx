"use client"

import { useState } from "react"
import type { HomeWithMembers, TaskWithRelations } from "@/types"
import KanbanBoard from "./KanbanBoard"
import TaskListView from "./TaskListView"
import TaskModal from "./TaskModal"

type View = "kanban" | "list"

export default function TasksClient({
  homes,
  initialTasks,
}: {
  homes: HomeWithMembers[]
  initialTasks: TaskWithRelations[]
}) {
  const [view, setView] = useState<View>("kanban")
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedHomeId, setSelectedHomeId] = useState<number | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)

  const filteredTasks =
    selectedHomeId === "all" ? tasks : tasks.filter((t) => t.homeId === selectedHomeId)

  function handleTaskSaved(task: TaskWithRelations) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = task
        return next
      }
      return [task, ...prev]
    })
    setModalOpen(false)
    setEditingTask(null)
  }

  function handleTaskDeleted(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setModalOpen(false)
    setEditingTask(null)
  }

  function openEdit(task: TaskWithRelations) {
    setEditingTask(task)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>

          {/* Home filter */}
          <select
            value={selectedHomeId}
            onChange={(e) =>
              setSelectedHomeId(e.target.value === "all" ? "all" : parseInt(e.target.value))
            }
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All homes</option>
            {homes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "kanban" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "list" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null)
              setModalOpen(true)
            }}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Task
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "kanban" ? (
        <KanbanBoard
          tasks={filteredTasks}
          homes={homes}
          onTasksChange={setTasks}
          onEdit={openEdit}
        />
      ) : (
        <TaskListView tasks={filteredTasks} homes={homes} onEdit={openEdit} />
      )}

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          homes={homes}
          task={editingTask}
          defaultHomeId={selectedHomeId === "all" ? homes[0]?.id : selectedHomeId}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
          onClose={() => {
            setModalOpen(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}

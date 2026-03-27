"use client"

import { useState } from "react"
import type { Task, User, Home, HomeMember } from "@/app/generated/prisma/client"
import { createTask, updateTask, deleteTask } from "@/actions/tasks"

type TaskWithRelations = Task & { createdBy: User | null; assignees: { id: number; memberId: number }[] }
type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }

export default function TaskModal({
  homes,
  task,
  defaultHomeId,
  onSaved,
  onDeleted,
  onClose,
}: {
  homes: HomeWithMembers[]
  task: TaskWithRelations | null
  defaultHomeId?: number
  onSaved: (task: TaskWithRelations) => void
  onDeleted: (id: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const editing = !!task

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)

    try {
      const data = {
        title: form.get("title") as string,
        description: (form.get("description") as string) || undefined,
        status: form.get("status") as string,
        priority: form.get("priority") as string,
        startDate: form.get("startDate") ? new Date(form.get("startDate") as string) : undefined,
        endDate: form.get("endDate") ? new Date(form.get("endDate") as string) : undefined,
      }

      let saved: TaskWithRelations
      if (editing) {
        saved = await updateTask(task.id, data) as TaskWithRelations
      } else {
        saved = await createTask({
          homeId: parseInt(form.get("homeId") as string),
          ...data,
        }) as TaskWithRelations
      }
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    setLoading(true)
    try {
      await deleteTask(task.id)
      onDeleted(task.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete task")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "Edit task" : "New task"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home</label>
              <select
                name="homeId"
                defaultValue={defaultHomeId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {homes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={task?.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue={task?.status ?? "todo"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                defaultValue={task?.priority ?? "medium"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                name="startDate"
                type="date"
                defaultValue={task?.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                name="endDate"
                type="date"
                defaultValue={task?.endDate ? new Date(task.endDate).toISOString().slice(0, 10) : ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {editing && (
              <button
                type="button"
                onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
                disabled={loading}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

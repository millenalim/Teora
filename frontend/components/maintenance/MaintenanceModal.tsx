"use client"

import { useState } from "react"
import type { MaintenanceTask, Home, HomeMember, User } from "@/app/generated/prisma/client"
import { createMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask } from "@/actions/maintenance"

type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }

const FREQUENCIES = [
  "daily", "weekly", "biweekly", "monthly", "quarterly", "semiannually", "annually", "as_needed"
]

export default function MaintenanceModal({
  homes,
  task,
  defaultHomeId,
  onSaved,
  onDeleted,
  onClose,
}: {
  homes: HomeWithMembers[]
  task: MaintenanceTask | null
  defaultHomeId?: number
  onSaved: (t: MaintenanceTask) => void
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
        taskName: form.get("taskName") as string,
        frequency: form.get("frequency") as string,
        provider: (form.get("provider") as string) || undefined,
        estimatedCost: (form.get("estimatedCost") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
        nextDue: form.get("nextDue") ? new Date(form.get("nextDue") as string) : undefined,
      }
      const saved = editing
        ? await updateMaintenanceTask(task.id, data)
        : await createMaintenanceTask({ homeId: parseInt(form.get("homeId") as string), ...data })
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    setLoading(true)
    try {
      await deleteMaintenanceTask(task.id)
      onDeleted(task.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{editing ? "Edit task" : "New maintenance task"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home</label>
              <select name="homeId" defaultValue={defaultHomeId} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task name <span className="text-red-500">*</span></label>
            <input name="taskName" required defaultValue={task?.taskName} placeholder="e.g. HVAC filter replacement" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select name="frequency" defaultValue={task?.frequency ?? "as_needed"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next due</label>
              <input name="nextDue" type="date" defaultValue={task?.nextDue ? new Date(task.nextDue).toISOString().slice(0,10) : ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input name="provider" defaultValue={task?.provider ?? ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. cost</label>
              <input name="estimatedCost" defaultValue={task?.estimatedCost ?? ""} placeholder="e.g. $50" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2} defaultValue={task?.notes ?? ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            {editing && (
              <button type="button" onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)} disabled={loading} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

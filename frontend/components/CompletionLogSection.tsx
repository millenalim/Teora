"use client"

import { useState } from "react"
import type { CompletionLog } from "@/app/generated/prisma/client"
import { createCompletionLog, deleteCompletionLog } from "@/actions/completion-logs"

export default function CompletionLogSection({
  homeId,
  entityType,
  entityId,
  initialLogs = [],
}: {
  homeId: number
  entityType: string
  entityId: number
  initialLogs?: CompletionLog[]
}) {
  const [logs, setLogs] = useState(initialLogs)
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)

    try {
      const log = await createCompletionLog({
        homeId,
        entityType,
        entityId,
        completedDate: new Date(form.get("completedDate") as string),
        cost: (form.get("cost") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
      })
      setLogs((prev) => [log, ...prev])
      setAdding(false)
      ;(e.target as HTMLFormElement).reset()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add log")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCompletionLog(id)
      setLogs((prev) => prev.filter((l) => l.id !== id))
    } catch {
      // silently ignore
    }
  }

  const visible = expanded ? logs : logs.slice(0, 3)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Completion log ({logs.length})
        </h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="text-xs text-indigo-600 hover:underline font-medium"
        >
          {adding ? "Cancel" : "+ Add entry"}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                name="completedDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cost</label>
              <input
                name="cost"
                placeholder="e.g. $150"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">No completions logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((log) => (
            <li
              key={log.id}
              className="flex items-start justify-between gap-3 text-sm border-l-2 border-indigo-200 pl-3 py-1"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-700">
                  {new Date(log.completedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {log.cost && <span className="ml-2 text-gray-500 font-normal">{log.cost}</span>}
                </p>
                {log.notes && <p className="text-gray-500 text-xs mt-0.5">{log.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="text-gray-300 hover:text-red-500 flex-shrink-0 text-base leading-none"
                title="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {logs.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {expanded ? "Show less" : `Show all ${logs.length} entries`}
        </button>
      )}
    </div>
  )
}

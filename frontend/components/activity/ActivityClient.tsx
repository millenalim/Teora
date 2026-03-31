"use client"

import { useState } from "react"
import type { ActivityLog, User } from "@/app/generated/prisma/client"
import type { HomeWithMembers, MentionData } from "@/types"
import { createActivityLog, deleteActivityLog } from "@/actions/activity"

type ActivityLogWithUser = ActivityLog & { user: User }

function parseMentions(raw: string | null): MentionData[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function ActivityEntry({
  log,
  onDelete,
}: {
  log: ActivityLogWithUser
  onDelete: (id: number) => void
}) {
  const mentions = parseMentions(log.mentions)

  // Render action text with @mention badges highlighted
  function renderAction(text: string) {
    if (mentions.length === 0) return <span>{text}</span>
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0

    for (const m of mentions) {
      const at = `@${m.name}`
      const idx = remaining.indexOf(at)
      if (idx === -1) continue
      if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
      parts.push(
        <span
          key={key++}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            m.type === "vendor"
              ? "bg-blue-100 text-blue-700"
              : "bg-pink-100 text-pink-700"
          }`}
        >
          {at}
        </span>
      )
      remaining = remaining.slice(idx + at.length)
    }
    if (remaining) parts.push(<span key={key++}>{remaining}</span>)
    return <>{parts}</>
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
        {(log.user.fullName || log.user.username)[0]!}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900">
            {log.user.fullName || log.user.username}
          </span>
          <span className="text-sm text-gray-600">{renderAction(log.action)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(log.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="text-gray-300 hover:text-red-400 text-xs px-1 flex-shrink-0"
        title="Delete"
      >
        ×
      </button>
    </div>
  )
}

export default function ActivityClient({
  homes,
  initialLogs,
}: {
  homes: HomeWithMembers[]
  initialLogs: ActivityLogWithUser[]
}) {
  const [logs, setLogs] = useState(initialLogs)
  const [selectedHomeId, setSelectedHomeId] = useState<number>(homes[0]?.id ?? 0)
  const [action, setAction] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const filtered = logs.filter((l) => l.homeId === selectedHomeId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!action.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const log = await createActivityLog({ homeId: selectedHomeId, action }) as ActivityLogWithUser
      setLogs((prev) => [log, ...prev])
      setAction("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteActivityLog(id)
      setLogs((prev) => prev.filter((l) => l.id !== id))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Activity</h1>
        <select
          value={selectedHomeId}
          onChange={(e) => setSelectedHomeId(parseInt(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {homes.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Post activity */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <textarea
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Log an activity… use @Name to mention a person or vendor"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !action.trim()}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {/* Log entries */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No activity yet</p>
        ) : (
          filtered.map((log) => (
            <ActivityEntry key={log.id} log={log} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}

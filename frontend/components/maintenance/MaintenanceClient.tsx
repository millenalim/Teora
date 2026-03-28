"use client"

import { useState } from "react"
import type { MaintenanceTask, Home, HomeMember, User, CompletionLog } from "@/app/generated/prisma/client"
import { getMaintenanceStatus, type MaintenanceStatus } from "@/lib/maintenance-utils"
import CompletionLogSection from "@/components/CompletionLogSection"
import MaintenanceModal from "./MaintenanceModal"

type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }

const STATUS_STYLE: Record<MaintenanceStatus, string> = {
  overdue: "bg-red-100 text-red-700",
  due_soon: "bg-amber-100 text-amber-700",
  on_track: "bg-green-100 text-green-700",
  no_schedule: "bg-gray-100 text-gray-500",
}

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  on_track: "On track",
  no_schedule: "No schedule",
}

export default function MaintenanceClient({
  homes,
  initialTasks,
  initialLogs,
}: {
  homes: HomeWithMembers[]
  initialTasks: MaintenanceTask[]
  initialLogs: Record<number, (CompletionLog & { completedBy: { id: number; name: string } | null })[]>
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [logs, setLogs] = useState(initialLogs)
  const [homeFilter, setHomeFilter] = useState<number | "all">("all")
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceTask | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = tasks.filter((t) => {
    if (homeFilter !== "all" && t.homeId !== homeFilter) return false
    if (statusFilter !== "all" && getMaintenanceStatus(t.nextDue) !== statusFilter) return false
    return true
  })

  function handleSaved(task: MaintenanceTask) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = task; return n }
      return [...prev, task]
    })
    if (!logs[task.id]) setLogs((prev) => ({ ...prev, [task.id]: [] }))
    setModalOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <select
            value={homeFilter}
            onChange={(e) => setHomeFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All homes</option>
            {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | "all")}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due soon</option>
            <option value="on_track">On track</option>
            <option value="no_schedule">No schedule</option>
          </select>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Task
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No maintenance tasks found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const status = getMaintenanceStatus(task.nextDue)
            const home = homes.find((h) => h.id === task.homeId)
            const isExpanded = expanded === task.id
            return (
              <div key={task.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : task.id)}
                >
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{task.taskName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="capitalize">{task.frequency.replace("_", " ")}</span>
                      {task.nextDue && (
                        <span>Next: {new Date(task.nextDue).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                      {task.estimatedCost && <span>{task.estimatedCost}</span>}
                      {home && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
                          {home.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(task); setModalOpen(true) }}
                    className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                  <span className="text-gray-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {task.provider && <p className="text-sm text-gray-600"><span className="font-medium">Provider:</span> {task.provider}</p>}
                    {task.notes && <p className="text-sm text-gray-600">{task.notes}</p>}
                    <CompletionLogSection
                      homeId={task.homeId}
                      entityType="maintenance"
                      entityId={task.id}
                      initialLogs={logs[task.id] ?? []}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <MaintenanceModal
          homes={homes}
          task={editing}
          defaultHomeId={homeFilter === "all" ? homes[0]?.id : homeFilter}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

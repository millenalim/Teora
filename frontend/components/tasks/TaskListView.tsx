"use client"

import { useState } from "react"
import type { HomeWithMembers, TaskWithRelations } from "@/types"

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  review: "Review",
  done: "Done",
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-gray-400",
}

type SortKey = "title" | "status" | "priority" | "endDate"

export default function TaskListView({
  tasks,
  homes,
  onEdit,
}: {
  tasks: TaskWithRelations[]
  homes: HomeWithMembers[]
  onEdit: (t: TaskWithRelations) => void
}) {
  const [tab, setTab] = useState<"active" | "done">("active")
  const [sort, setSort] = useState<SortKey>("priority")

  const filtered = tasks.filter((t) => (tab === "done" ? t.status === "done" : t.status !== "done"))

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title)
    if (sort === "status") return a.status.localeCompare(b.status)
    if (sort === "priority") {
      const rank: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1)
    }
    if (sort === "endDate") {
      if (!a.endDate) return 1
      if (!b.endDate) return -1
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    }
    return 0
  })

  function Th({ label, sortKey }: { label: string; sortKey: SortKey }) {
    return (
      <th
        onClick={() => setSort(sortKey)}
        className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 cursor-pointer hover:text-gray-900 select-none"
      >
        {label} {sort === sortKey && "↑"}
      </th>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["active", "done"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "active" ? "Active" : "Done"}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No tasks</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th label="Title" sortKey="title" />
                <Th label="Status" sortKey="status" />
                <Th label="Priority" sortKey="priority" />
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                  Home
                </th>
                <Th label="Due" sortKey="endDate" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((task) => {
                const home = homes.find((h) => h.id === task.homeId)
                return (
                  <tr
                    key={task.id}
                    onClick={() => onEdit(task)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{STATUS_LABEL[task.status]}</td>
                    <td className={`px-3 py-3 text-sm font-medium capitalize ${PRIORITY_COLOR[task.priority] ?? ""}`}>
                      {task.priority}
                    </td>
                    <td className="px-3 py-3">
                      {home && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-600">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: home.colorTag }}
                          />
                          {home.name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {task.endDate
                        ? new Date(task.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

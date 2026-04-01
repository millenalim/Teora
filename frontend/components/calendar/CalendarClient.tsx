"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Event, Task, Home, HomeMember, User } from "@/app/generated/prisma/client"
import EventModal from "./EventModal"

type EventWithHome = Event & { home: { id: number; name: string; colorTag: string } }
type TaskWithHome = Task & { home: { id: number; name: string; colorTag: string } }
type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

const STATUS_LABEL: Record<string, string> = {
  todo: "To Do", inprogress: "In Progress", review: "Review", done: "Done",
}
const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-600", medium: "text-amber-600", low: "text-gray-400",
}
const RECURRENCE_LABEL: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", yearly: "Yearly",
}

function normalizeDate(d: Date | string): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  return date
}

function isRecurringOccurrence(anchor: Date, cell: Date, recurrence: string, recurrenceEnd: Date | null): boolean {
  if (cell < anchor) return false
  if (recurrenceEnd && cell > recurrenceEnd) return false

  const diffMs = cell.getTime() - anchor.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  switch (recurrence) {
    case "daily":
      return true
    case "weekly":
      return diffDays % 7 === 0
    case "biweekly":
      return diffDays % 14 === 0
    case "monthly":
      return cell.getDate() === anchor.getDate()
    case "yearly":
      return cell.getMonth() === anchor.getMonth() && cell.getDate() === anchor.getDate()
    default:
      return false
  }
}

function TaskDetailModal({ task, onClose }: { task: TaskWithHome; onClose: () => void }) {
  const rec = (task as any).recurrence as string | null
  const recEnd = (task as any).recurrenceEndDate as Date | null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.home.colorTag }} />
            <span className="text-xs text-gray-500">{task.home.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">{task.title}</h2>
          {task.description && (
            <p className="text-sm text-gray-600 whitespace-pre-line">{task.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Status</span>
              <span className="text-gray-700">{STATUS_LABEL[task.status] ?? task.status}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Priority</span>
              <span className={`capitalize font-medium ${PRIORITY_COLOR[task.priority] ?? ""}`}>{task.priority}</span>
            </div>
          </div>
          {(task.startDate || task.endDate) && (
            <div className="flex items-center gap-4 text-sm">
              {task.startDate && (
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Start</span>
                  <span className="text-gray-700">
                    {new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {task.endDate && (
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Due</span>
                  <span className="text-gray-700">
                    {new Date(task.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          )}
          {rec && (
            <div className="text-sm">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Recurrence</span>
              <span className="text-gray-700">
                {RECURRENCE_LABEL[rec] ?? rec}
                {recEnd && ` · until ${new Date(recEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CalendarClient({
  homes,
  events: initialEvents,
  tasks,
  year,
  month,
}: {
  homes: HomeWithMembers[]
  events: EventWithHome[]
  tasks: TaskWithHome[]
  year: number
  month: number
}) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithHome | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskWithHome | null>(null)

  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDow = firstDay.getDay()

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function navigate(dir: -1 | 1) {
    let m = month + dir
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    router.push(`/calendar?year=${y}&month=${m}`)
  }

  function getItemsForDay(day: number): { events: EventWithHome[]; tasks: TaskWithHome[] } {
    const cell = normalizeDate(new Date(year, month - 1, day))

    const dayEvents = events.filter((e) => {
      if (!e.startDate) return false
      return normalizeDate(e.startDate).getTime() === cell.getTime()
    })

    const dayTasks = tasks.filter((t) => {
      // anchor = endDate if set, else startDate
      const anchor = t.endDate ? normalizeDate(t.endDate) : t.startDate ? normalizeDate(t.startDate) : null
      if (!anchor) return false

      const rec = (t as any).recurrence as string | null
      const recEnd = (t as any).recurrenceEndDate ? normalizeDate((t as any).recurrenceEndDate) : null

      if (!rec) {
        return cell.getTime() === anchor.getTime()
      }
      return isRecurringOccurrence(anchor, cell, rec, recEnd)
    })

    return { events: dayEvents, tasks: dayTasks }
  }

  function openNew(day: number) {
    setEditingEvent(null)
    setDefaultDate(new Date(year, month - 1, day))
    setModalOpen(true)
  }

  function openEdit(event: EventWithHome) {
    setEditingEvent(event)
    setDefaultDate(null)
    setModalOpen(true)
  }

  function handleEventSaved(event: EventWithHome) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = event
        return next
      }
      return [...prev, event]
    })
    setModalOpen(false)
    setEditingEvent(null)
  }

  function handleEventDeleted(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setModalOpen(false)
    setEditingEvent(null)
  }

  const today = new Date()
  const todayStr = today.toDateString()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {MONTH_NAMES[month - 1]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">‹</button>
          <button
            onClick={() => {
              const now = new Date()
              router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">›</button>
          <button
            onClick={() => { setEditingEvent(null); setDefaultDate(new Date(year, month - 1)); setModalOpen(true) }}
            className="ml-2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Event
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(0, 1fr))` }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="border-b border-r border-gray-100 bg-gray-50" />

            const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day)
            const isToday = new Date(year, month - 1, day).toDateString() === todayStr

            return (
              <div
                key={i}
                onClick={() => openNew(day)}
                className="border-b border-r border-gray-100 p-1.5 overflow-hidden cursor-pointer hover:bg-indigo-50/30 transition-colors"
              >
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? "bg-indigo-600 text-white" : "text-gray-700"}`}>
                  {day}
                </span>

                {/* Events */}
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEdit(ev) }}
                    className="text-[11px] px-1.5 py-0.5 rounded mb-0.5 truncate font-medium text-white cursor-pointer hover:brightness-90 transition-all"
                    style={{ backgroundColor: ev.home.colorTag }}
                  >
                    {ev.title}
                  </div>
                ))}

                {/* Tasks */}
                {dayTasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    title={t.title}
                    onClick={(e) => { e.stopPropagation(); setSelectedTask(t) }}
                    className="text-[11px] px-1.5 py-0.5 rounded mb-0.5 truncate font-medium text-white cursor-pointer hover:brightness-90 transition-all"
                    style={{ backgroundColor: t.home.colorTag, opacity: 0.85 }}
                  >
                    ✓ {t.title}
                    {(t as any).recurrence && " ↻"}
                  </div>
                ))}

                {dayEvents.length + dayTasks.length > 4 && (
                  <div className="text-[10px] text-gray-400 px-1">
                    +{dayEvents.length + dayTasks.length - 4} more
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Task detail popup */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {/* Event modal */}
      {modalOpen && (
        <EventModal
          homes={homes}
          event={editingEvent}
          defaultDate={defaultDate}
          defaultHomeId={homes[0]?.id}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
          onClose={() => { setModalOpen(false); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}

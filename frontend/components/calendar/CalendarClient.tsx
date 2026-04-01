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

function normalizeDate(d: Date | string): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  return date
}

type TaskSegment = {
  task: TaskWithHome
  isStart: boolean
  isEnd: boolean
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

  function getItemsForDay(day: number): { events: EventWithHome[]; tasks: TaskSegment[] } {
    const cell = normalizeDate(new Date(year, month - 1, day))

    const dayEvents = events.filter((e) => {
      if (!e.startDate) return false
      return normalizeDate(e.startDate).getTime() === cell.getTime()
    })

    const dayTasks: TaskSegment[] = tasks
      .map((t) => {
        const start = t.startDate ? normalizeDate(t.startDate) : null
        const end = t.endDate ? normalizeDate(t.endDate) : null

        // Must have at least one bound
        if (!start && !end) return null

        // Use start as lower bound, end as upper bound
        // If only endDate, treat it as a single-day task on that day
        const lower = start ?? end!
        const upper = end ?? start!

        if (cell < lower || cell > upper) return null

        return {
          task: t,
          isStart: cell.getTime() === lower.getTime(),
          isEnd: cell.getTime() === upper.getTime(),
        }
      })
      .filter(Boolean) as TaskSegment[]

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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => {
              const now = new Date()
              router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
            }}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            ›
          </button>
          <button
            onClick={() => {
              setEditingEvent(null)
              setDefaultDate(new Date(year, month - 1))
              setModalOpen(true)
            }}
            className="ml-2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Event
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: `repeat(${cells.length / 7}, minmax(0, 1fr))` }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="border-b border-r border-gray-100 bg-gray-50" />

            const { events: dayEvents, tasks: dayTasks } = getItemsForDay(day)
            const isToday = new Date(year, month - 1, day).toDateString() === todayStr
            const col = i % 7 // 0=Sun … 6=Sat

            return (
              <div
                key={i}
                onClick={() => openNew(day)}
                className="border-b border-r border-gray-100 p-1.5 overflow-hidden cursor-pointer hover:bg-indigo-50/30 transition-colors"
              >
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
                    isToday ? "bg-indigo-600 text-white" : "text-gray-700"
                  }`}
                >
                  {day}
                </span>

                {/* Events — single day, colored by home */}
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEdit(ev) }}
                    className="text-[11px] px-1.5 py-0.5 rounded mb-0.5 truncate font-medium text-white cursor-pointer"
                    style={{ backgroundColor: ev.home.colorTag }}
                  >
                    {ev.title}
                  </div>
                ))}

                {/* Tasks — spanning, colored by home */}
                {dayTasks.slice(0, 2).map(({ task: t, isStart, isEnd }) => {
                  const isSingle = isStart && isEnd
                  // Extend to cell edges for multi-day tasks
                  const edgeClass = isSingle
                    ? "rounded mx-0"
                    : isStart
                    ? `rounded-l -mr-1.5 ${col === 6 ? "rounded-r" : ""}`
                    : isEnd
                    ? `rounded-r -ml-1.5 ${col === 0 ? "rounded-l" : ""}`
                    : `-mx-1.5 rounded-none`

                  return (
                    <div
                      key={t.id}
                      title={t.title}
                      className={`text-[11px] py-0.5 mb-0.5 font-medium text-white overflow-hidden whitespace-nowrap ${edgeClass}`}
                      style={{ backgroundColor: t.home.colorTag, opacity: 0.85 }}
                    >
                      {isStart && (
                        <span className="px-1.5">✓ {t.title}</span>
                      )}
                    </div>
                  )
                })}

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

      {modalOpen && (
        <EventModal
          homes={homes}
          event={editingEvent}
          defaultDate={defaultDate}
          defaultHomeId={homes[0]?.id}
          onSaved={handleEventSaved}
          onDeleted={handleEventDeleted}
          onClose={() => {
            setModalOpen(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

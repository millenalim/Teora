"use client"

import { useState } from "react"
import type { Event, Home, HomeMember, User } from "@/app/generated/prisma/client"
import { createEvent, updateEvent, deleteEvent } from "@/actions/events"

type EventWithHome = Event & { home: { id: number; name: string; colorTag: string } }
type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }

export default function EventModal({
  homes,
  event,
  defaultDate,
  defaultHomeId,
  onSaved,
  onDeleted,
  onClose,
}: {
  homes: HomeWithMembers[]
  event: EventWithHome | null
  defaultDate: Date | null
  defaultHomeId?: number
  onSaved: (event: EventWithHome) => void
  onDeleted: (id: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const editing = !!event

  function fmt(d: Date | string | null | undefined) {
    if (!d) return ""
    return new Date(d).toISOString().slice(0, 10)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)

    try {
      const data = {
        title: form.get("title") as string,
        startDate: form.get("startDate") ? new Date(form.get("startDate") as string) : undefined,
        endDate: form.get("endDate") ? new Date(form.get("endDate") as string) : undefined,
        startTime: (form.get("startTime") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
      }

      let saved: Event
      if (editing) {
        saved = await updateEvent(event.id, data)
      } else {
        saved = await createEvent({
          homeId: parseInt(form.get("homeId") as string),
          ...data,
        })
      }

      const home = homes.find((h) => h.id === (editing ? event.homeId : parseInt(form.get("homeId") as string)))!
      onSaved({ ...saved, home: { id: home.id, name: home.name, colorTag: home.colorTag } })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save event")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    setLoading(true)
    try {
      await deleteEvent(event.id)
      onDeleted(event.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "Edit event" : "New event"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
                  <option key={h.id} value={h.id}>{h.name}</option>
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
              defaultValue={event?.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                name="startDate"
                type="date"
                defaultValue={event?.startDate ? fmt(event.startDate) : fmt(defaultDate)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                name="startTime"
                type="time"
                defaultValue={event?.startTime ?? ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              name="endDate"
              type="date"
              defaultValue={event?.endDate ? fmt(event.endDate) : ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={event?.notes ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            {editing && (
              <button
                type="button"
                onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)}
                disabled={loading}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

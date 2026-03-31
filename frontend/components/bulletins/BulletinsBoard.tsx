"use client"

import { useState } from "react"
import type { Bulletin, User } from "@/app/generated/prisma/client"
import type { HomeWithMembers } from "@/types"
import { createBulletin, updateBulletin, deleteBulletin } from "@/actions/bulletins"

type BulletinWithAuthor = Bulletin & { author: User }

function BulletinModal({
  homes,
  bulletin,
  defaultHomeId,
  onSaved,
  onDeleted,
  onClose,
}: {
  homes: HomeWithMembers[]
  bulletin: BulletinWithAuthor | null
  defaultHomeId?: number
  onSaved: (b: BulletinWithAuthor) => void
  onDeleted: (id: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const editing = !!bulletin

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      let saved: BulletinWithAuthor
      if (editing) {
        saved = (await updateBulletin(bulletin.id, {
          title: form.get("title") as string,
          body: form.get("body") as string,
          pinned: form.get("pinned") === "on",
        })) as BulletinWithAuthor
      } else {
        saved = (await createBulletin({
          homeId: parseInt(form.get("homeId") as string),
          title: form.get("title") as string,
          body: form.get("body") as string,
          pinned: form.get("pinned") === "on",
        })) as BulletinWithAuthor
      }
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!bulletin) return
    setLoading(true)
    try {
      await deleteBulletin(bulletin.id)
      onDeleted(bulletin.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "Edit bulletin" : "New bulletin"}
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
              defaultValue={bulletin?.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body <span className="text-red-500">*</span>
            </label>
            <textarea
              name="body"
              required
              rows={5}
              defaultValue={bulletin?.body}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="pinned" defaultChecked={bulletin?.pinned} />
            Pin to top
          </label>
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
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
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
              {loading ? "Saving…" : editing ? "Save" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BulletinsBoard({
  homes,
  initialBulletins,
}: {
  homes: HomeWithMembers[]
  initialBulletins: BulletinWithAuthor[]
}) {
  const [bulletins, setBulletins] = useState(initialBulletins)
  const [selectedHomeId, setSelectedHomeId] = useState<number | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BulletinWithAuthor | null>(null)

  const filtered =
    selectedHomeId === "all"
      ? bulletins
      : bulletins.filter((b) => b.homeId === selectedHomeId)

  function handleSaved(b: BulletinWithAuthor) {
    setBulletins((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = b
        return next.sort((a, z) => (z.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      }
      return [b, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: number) {
    setBulletins((prev) => prev.filter((b) => b.id !== id))
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Bulletins</h2>
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
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
        >
          + Bulletin
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">
          No bulletins yet
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const home = homes.find((h) => h.id === b.homeId)
            return (
              <div
                key={b.id}
                onClick={() => {
                  setEditing(b)
                  setModalOpen(true)
                }}
                className={`bg-white border rounded-xl px-5 py-4 cursor-pointer hover:border-indigo-200 transition-colors ${
                  b.pinned ? "border-indigo-300 ring-1 ring-indigo-100" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {b.pinned && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                        Pinned
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-gray-900">{b.title}</h3>
                  </div>
                  {home && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: home.colorTag }}
                      />
                      {home.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line line-clamp-4">{b.body}</p>
                <p className="text-xs text-gray-400 mt-3">
                  {b.author.fullName || b.author.username} ·{" "}
                  {new Date(b.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <BulletinModal
          homes={homes}
          bulletin={editing}
          defaultHomeId={selectedHomeId === "all" ? homes[0]?.id : selectedHomeId}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

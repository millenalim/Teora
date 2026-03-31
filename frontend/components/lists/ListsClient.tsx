"use client"

import { useState, useRef } from "react"
import type { ListItem } from "@/app/generated/prisma/client"
import type { HomeWithMembers, ListWithItems } from "@/types"
import {
  createList,
  updateList,
  deleteList,
  addListItem,
  toggleListItem,
  updateListItem,
  deleteListItem,
} from "@/actions/lists"

function NewListModal({
  homes,
  defaultHomeId,
  onCreated,
  onClose,
}: {
  homes: HomeWithMembers[]
  defaultHomeId?: number
  onCreated: (list: ListWithItems) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const form = new FormData(e.currentTarget)
    try {
      const list = (await createList({
        homeId: parseInt(form.get("homeId") as string),
        title: form.get("title") as string,
        category: (form.get("category") as string) || undefined,
      })) as ListWithItems
      onCreated(list)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">New list</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Home</label>
            <select name="homeId" defaultValue={defaultHomeId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input name="title" required autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input name="category" placeholder="e.g. Shopping, Packing, To-do…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ListCard({
  list,
  homes,
  onDelete,
}: {
  list: ListWithItems
  homes: HomeWithMembers[]
  onDelete: (id: number) => void
}) {
  const [items, setItems] = useState<ListItem[]>(list.items)
  const [newText, setNewText] = useState("")
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const home = homes.find((h) => h.id === list.homeId)
  const checked = items.filter((i) => i.checked).length
  const progress = items.length > 0 ? Math.round((checked / items.length) * 100) : 0

  async function handleToggle(item: ListItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)))
    try {
      await toggleListItem(item.id)
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)))
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newText.trim()) return
    setAdding(true)
    try {
      const item = await addListItem(list.id, newText.trim())
      setItems((prev) => [...prev, item])
      setNewText("")
      inputRef.current?.focus()
    } catch {
      // ignore
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try { await deleteListItem(id) } catch { /* ignore */ }
  }

  async function handleDeleteList() {
    try {
      await deleteList(list.id)
      onDelete(list.id)
    } catch { /* ignore */ }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{list.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {list.category && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{list.category}</span>
              )}
              {home && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
                  {home.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => confirmDelete ? handleDeleteList() : setConfirmDelete(true)}
            className={`text-xs px-2 py-1 rounded border ${confirmDelete ? "text-red-600 border-red-200 bg-red-50" : "text-gray-400 border-gray-200 hover:text-red-500"}`}
          >
            {confirmDelete ? "Confirm" : "Delete"}
          </button>
        </div>

        {items.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{checked}/{items.length} done</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-5 py-2.5 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggle(item)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
              {item.text}
            </span>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddItem} className="px-5 py-3 border-t border-gray-100 flex gap-2">
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add item…"
          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  )
}

export default function ListsClient({
  homes,
  initialLists,
}: {
  homes: HomeWithMembers[]
  initialLists: ListWithItems[]
}) {
  const [lists, setLists] = useState(initialLists)
  const [selectedHomeId, setSelectedHomeId] = useState<number | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = selectedHomeId === "all" ? lists : lists.filter((l) => l.homeId === selectedHomeId)

  function handleCreated(list: ListWithItems) {
    setLists((prev) => [list, ...prev])
    setModalOpen(false)
  }

  function handleDeleted(id: number) {
    setLists((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Lists</h1>
          <select value={selectedHomeId}
            onChange={(e) => setSelectedHomeId(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All homes</option>
            {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          + List
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16 border border-dashed border-gray-200 rounded-xl">No lists yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((list) => (
            <ListCard key={list.id} list={list} homes={homes} onDelete={handleDeleted} />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewListModal
          homes={homes}
          defaultHomeId={selectedHomeId === "all" ? homes[0]?.id : selectedHomeId}
          onCreated={handleCreated}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

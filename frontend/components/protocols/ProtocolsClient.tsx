"use client"

import { useState } from "react"
import type { Protocol } from "@/app/generated/prisma/client"
import type { HomeWithMembers } from "@/types"
import { createProtocol, updateProtocol, deleteProtocol } from "@/actions/protocols"
import CompletionLogSection from "@/components/CompletionLogSection"

function ProtocolModal({
  homes,
  protocol,
  defaultHomeId,
  onSaved,
  onDeleted,
  onClose,
}: {
  homes: HomeWithMembers[]
  protocol: Protocol | null
  defaultHomeId?: number
  onSaved: (p: Protocol) => void
  onDeleted: (id: number) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [steps, setSteps] = useState<string[]>(() => {
    if (!protocol?.steps) return [""]
    try { return JSON.parse(protocol.steps) } catch { return [""] }
  })
  const editing = !!protocol

  function addStep() { setSteps((prev) => [...prev, ""]) }
  function removeStep(i: number) { setSteps((prev) => prev.filter((_, idx) => idx !== i)) }
  function updateStep(i: number, val: string) {
    setSteps((prev) => { const next = [...prev]; next[i] = val; return next })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const filteredSteps = steps.filter((s) => s.trim())
    try {
      let saved: Protocol
      if (editing) {
        saved = await updateProtocol(protocol.id, {
          title: form.get("title") as string,
          category: (form.get("category") as string) || undefined,
          steps: filteredSteps,
          notes: (form.get("notes") as string) || undefined,
        })
      } else {
        saved = await createProtocol({
          homeId: parseInt(form.get("homeId") as string),
          title: form.get("title") as string,
          category: (form.get("category") as string) || undefined,
          steps: filteredSteps,
          notes: (form.get("notes") as string) || undefined,
        })
      }
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!protocol) return
    setLoading(true)
    try {
      await deleteProtocol(protocol.id)
      onDeleted(protocol.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {editing ? "Edit protocol" : "New protocol"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home</label>
              <select name="homeId" defaultValue={defaultHomeId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input name="title" required defaultValue={protocol?.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input name="category" defaultValue={protocol?.category ?? ""}
              placeholder="e.g. Seasonal, Emergency, Cleaning…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Steps</label>
              <button type="button" onClick={addStep} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add step</button>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <input value={s} onChange={(e) => updateStep(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)}
                      className="text-gray-300 hover:text-red-400 text-sm px-1">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={3} defaultValue={protocol?.notes ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            {editing && (
              <button type="button" onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)}
                disabled={loading} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
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

function ProtocolCard({ protocol, homes, onEdit }: { protocol: Protocol; homes: HomeWithMembers[]; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const home = homes.find((h) => h.id === protocol.homeId)
  const steps: string[] = (() => { try { return JSON.parse(protocol.steps) } catch { return [] } })()

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{expanded ? "▼" : "▶"}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{protocol.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {protocol.category && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{protocol.category}</span>
              )}
              {home && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
                  {home.name}
                </span>
              )}
              <span className="text-xs text-gray-400">{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1"
        >
          Edit
        </button>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3 space-y-4">
          {steps.length > 0 && (
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
          {protocol.notes && <p className="text-sm text-gray-500 italic">{protocol.notes}</p>}
          <CompletionLogSection entityType="protocol" entityId={protocol.id} homeId={protocol.homeId} />
        </div>
      )}
    </div>
  )
}

export default function ProtocolsClient({
  homes,
  initialProtocols,
}: {
  homes: HomeWithMembers[]
  initialProtocols: Protocol[]
}) {
  const [protocols, setProtocols] = useState(initialProtocols)
  const [selectedHomeId, setSelectedHomeId] = useState<number | "all">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Protocol | null>(null)

  const filtered = selectedHomeId === "all" ? protocols : protocols.filter((p) => p.homeId === selectedHomeId)

  function handleSaved(p: Protocol) {
    setProtocols((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = p; return next }
      return [p, ...prev]
    })
    setModalOpen(false)
    setEditing(null)
  }

  function handleDeleted(id: number) {
    setProtocols((prev) => prev.filter((p) => p.id !== id))
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Protocols</h1>
          <select value={selectedHomeId}
            onChange={(e) => setSelectedHomeId(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All homes</option>
            {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          + Protocol
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16 border border-dashed border-gray-200 rounded-xl">No protocols yet</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <ProtocolCard key={p.id} protocol={p} homes={homes} onEdit={() => { setEditing(p); setModalOpen(true) }} />
          ))}
        </div>
      )}

      {modalOpen && (
        <ProtocolModal
          homes={homes}
          protocol={editing}
          defaultHomeId={selectedHomeId === "all" ? homes[0]?.id : selectedHomeId}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

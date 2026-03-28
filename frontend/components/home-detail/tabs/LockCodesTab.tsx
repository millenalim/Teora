"use client"

import { useState } from "react"
import { createLockCode, updateLockCode, deleteLockCode, revealLockCode } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SecureCode from "@/components/SecureCode"

type LockCodeSafe = { id: number; homeId: number; location: string; lockType: string; notes: string | null; createdAt: Date; updatedAt: Date }

const LOCK_TYPES = [
  { value: "smart_lock", label: "Smart lock" },
  { value: "keypad", label: "Keypad" },
  { value: "gate", label: "Gate" },
  { value: "garage", label: "Garage" },
  { value: "lockbox", label: "Lockbox" },
  { value: "other", label: "Other" },
]

export default function LockCodesTab({ homeId, initialData }: { homeId: number; initialData: LockCodeSafe[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<LockCodeSafe | null | "new">(null)
  const [formData, setFormData] = useState({ location: "", lockType: "other", code: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  function openNew() {
    setFormData({ location: "", lockType: "other", code: "", notes: "" })
    setEditing("new")
    setError("")
    setConfirmDelete(false)
  }

  function openEdit(item: LockCodeSafe) {
    setFormData({ location: item.location, lockType: item.lockType, code: "", notes: item.notes ?? "" })
    setEditing(item)
    setError("")
    setConfirmDelete(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (editing === "new" && !formData.code) { setError("Code is required"); return }
    setError("")
    setLoading(true)
    try {
      if (editing === "new") {
        const item = await createLockCode({ homeId, location: formData.location, code: formData.code, lockType: formData.lockType || undefined, notes: formData.notes || undefined })
        setItems((p) => [...p, item])
      } else if (editing) {
        const item = await updateLockCode(editing.id, { location: formData.location, lockType: formData.lockType || undefined, code: formData.code || undefined, notes: formData.notes || undefined })
        setItems((p) => p.map((x) => x.id === item.id ? item : x))
      }
      setEditing(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editing || editing === "new") return
    setLoading(true)
    try {
      await deleteLockCode(editing.id)
      setItems((p) => p.filter((x) => x.id !== (editing as LockCodeSafe).id))
      setEditing(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setLoading(false)
    }
  }

  return (
    <>
      <InfoSection title="Lock Codes" count={items.length} onAdd={openNew} emptyText="No lock codes added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => openEdit(item)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location" value={item.location} />
              <Field label="Type" value={LOCK_TYPES.find((t) => t.value === item.lockType)?.label ?? item.lockType} />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Code</p>
              <SecureCode onReveal={() => revealLockCode(item.id)} label="code" />
            </div>
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{editing === "new" ? "Add lock code" : "Edit lock code"}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                <input required value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Front door" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.lockType} onChange={(e) => setFormData((p) => ({ ...p, lockType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {LOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code {editing === "new" && <span className="text-red-500">*</span>}
                  {editing !== "new" && <span className="text-gray-400 font-normal"> (leave blank to keep current)</span>}
                </label>
                <input type="password" value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} autoComplete="new-password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                {editing !== "new" && (
                  <button type="button" onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)} disabled={loading} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    {confirmDelete ? "Confirm delete" : "Delete"}
                  </button>
                )}
                <div className="flex-1" />
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

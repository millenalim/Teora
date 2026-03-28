"use client"

import { useState } from "react"

type FieldDef = {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  multiline?: boolean
  options?: { value: string; label: string }[]
}

export default function SimpleModal({
  title,
  fields,
  defaultValues,
  onSave,
  onDelete,
  onClose,
}: {
  title: string
  fields: FieldDef[]
  defaultValues?: Record<string, unknown>
  onSave: (data: Record<string, string>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    fields.forEach((f) => { data[f.name] = (form.get(f.name) as string) ?? "" })
    try {
      await onSave(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setLoading(false)
    }
  }

  const cls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {f.options ? (
                <select name={f.name} defaultValue={String(defaultValues?.[f.name] ?? "")} className={cls}>
                  <option value="">—</option>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.multiline ? (
                <textarea name={f.name} rows={3} defaultValue={String(defaultValues?.[f.name] ?? "")} placeholder={f.placeholder} className={cls} />
              ) : (
                <input name={f.name} type={f.type ?? "text"} required={f.required} placeholder={f.placeholder} defaultValue={String(defaultValues?.[f.name] ?? "")} className={cls} />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            {onDelete && (
              <button type="button" onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)} disabled={loading} className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

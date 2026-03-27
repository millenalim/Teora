"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createHome } from "@/actions/homes"

const COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
]

export default function NewHomePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [colorTag, setColorTag] = useState(COLOR_OPTIONS[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    try {
      const home = await createHome({
        name: form.get("name") as string,
        address: form.get("address") as string,
        sqft: form.get("sqft") ? parseInt(form.get("sqft") as string) : undefined,
        lotSize: (form.get("lotSize") as string) || undefined,
        purpose: (form.get("purpose") as string) || undefined,
        description: (form.get("description") as string) || undefined,
        colorTag,
      })
      router.push(`/homes/${home.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create home")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Add a home</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Home name" name="name" required />
          <Field label="Address" name="address" required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Size (sqft)" name="sqft" type="number" />
            <Field label="Lot size" name="lotSize" placeholder="e.g. 0.25 ac" />
          </div>
          <Field label="Purpose" name="purpose" placeholder="e.g. Primary residence, Rental" />
          <Field label="Description" name="description" multiline />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color tag</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColorTag(c)}
                className={`w-7 h-7 rounded-full transition-transform ${colorTag === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating…" : "Create home"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  multiline,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  multiline?: boolean
}) {
  const cls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {multiline ? (
        <textarea id={name} name={name} rows={3} placeholder={placeholder} className={cls} />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  )
}

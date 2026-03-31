"use client"

import { useState, useRef } from "react"
import type { Document, User } from "@/app/generated/prisma/client"
import type { HomeWithMembers } from "@/types"
import { uploadDocument, deleteDocument } from "@/actions/documents"

type DocumentWithUser = Document & { uploadedBy: User | null }

const ICON: Record<string, string> = {
  "application/pdf": "📄",
  "image/jpeg": "🖼",
  "image/png": "🖼",
  "image/gif": "🖼",
  "image/webp": "🖼",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "text/plain": "📃",
  "video/mp4": "🎬",
  "video/quicktime": "🎬",
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadModal({
  homes,
  defaultHomeId,
  onUploaded,
  onClose,
}: {
  homes: HomeWithMembers[]
  defaultHomeId?: number
  onUploaded: (doc: DocumentWithUser) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const doc = (await uploadDocument(form)) as DocumentWithUser
      onUploaded(doc)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Upload document</h2>
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
            <input name="title" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File <span className="text-red-500">*</span></label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 cursor-pointer hover:border-indigo-400 transition-colors">
              <span className="text-2xl mb-2">📁</span>
              <span className="text-sm text-gray-500">{fileName || "Click to choose a file"}</span>
              <input
                name="file"
                type="file"
                required
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input name="category" placeholder="e.g. Insurance, Tax, Warranty…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea name="notes" rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DocumentsClient({
  homes,
  initialDocuments,
}: {
  homes: HomeWithMembers[]
  initialDocuments: DocumentWithUser[]
}) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedHomeId, setSelectedHomeId] = useState<number | "all">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false)

  const categories = [...new Set(documents.map((d) => d.category).filter(Boolean) as string[])].sort()
  const filtered = documents
    .filter((d) => selectedHomeId === "all" || d.homeId === selectedHomeId)
    .filter((d) => selectedCategory === "all" || d.category === selectedCategory)

  function handleUploaded(doc: DocumentWithUser) {
    setDocuments((prev) => [doc, ...prev])
    setModalOpen(false)
  }

  async function handleDelete(doc: DocumentWithUser) {
    if (!confirm(`Delete "${doc.title}"?`)) return
    try {
      await deleteDocument(doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          <select value={selectedHomeId}
            onChange={(e) => setSelectedHomeId(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All homes</option>
            {homes.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          {categories.length > 0 && (
            <select value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          + Upload
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16 border border-dashed border-gray-200 rounded-xl">No documents yet</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">File</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">Home</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">Size</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">Uploaded</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((doc) => {
                const home = homes.find((h) => h.id === doc.homeId)
                const icon = ICON[doc.mimeType ?? ""] ?? "📎"
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                          <p className="text-xs text-gray-400">{doc.originalName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {home && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: home.colorTag }} />
                          {home.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {doc.category && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{doc.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatBytes(doc.sizeBytes)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {doc.uploadedBy && (
                        <span className="block text-gray-400">{doc.uploadedBy.fullName || doc.uploadedBy.username}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <a
                          href={`/api/uploads/${doc.filename}`}
                          download={doc.originalName}
                          className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 border border-indigo-200 rounded hover:bg-indigo-50"
                        >
                          Download
                        </a>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 border border-gray-200 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <UploadModal
          homes={homes}
          defaultHomeId={selectedHomeId === "all" ? homes[0]?.id : selectedHomeId}
          onUploaded={handleUploaded}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

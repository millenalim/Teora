"use client"

import { useState } from "react"

export function InfoSection({
  title,
  count,
  onAdd,
  children,
  emptyText = "Nothing added yet.",
}: {
  title: string
  count: number
  onAdd: () => void
  children: React.ReactNode
  emptyText?: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          {title} <span className="text-gray-400 font-normal text-sm">({count})</span>
        </h2>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Add
        </button>
      </div>
      {count === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-xl">{emptyText}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  )
}

export function InfoCard({
  onEdit,
  children,
}: {
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 group relative hover:border-indigo-200 transition-colors">
      <button
        onClick={onEdit}
        className="absolute top-3 right-3 text-xs text-gray-300 group-hover:text-indigo-500 transition-colors"
      >
        Edit
      </button>
      {children}
    </div>
  )
}

export function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

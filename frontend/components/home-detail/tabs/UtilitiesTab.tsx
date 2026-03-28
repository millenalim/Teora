"use client"

import { useState } from "react"
import type { UtilityBill } from "@/app/generated/prisma/client"
import { createUtility, updateUtility, deleteUtility } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SimpleModal from "../SimpleModal"

const UTILITY_TYPES = [
  "electric","gas","water","sewer","trash","internet","solar","other"
].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

export default function UtilitiesTab({ homeId, initialData }: { homeId: number; initialData: UtilityBill[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<UtilityBill | null | "new">(null)

  const fields = [
    { name: "utilityType", label: "Type", required: true, options: UTILITY_TYPES },
    { name: "provider", label: "Provider" },
    { name: "accountNumber", label: "Account #" },
    { name: "avgMonthlyCost", label: "Avg monthly cost", placeholder: "e.g. $120" },
    { name: "dueDate", label: "Due date", placeholder: "e.g. 15th of each month" },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = { utilityType: data.utilityType, provider: data.provider || undefined, accountNumber: data.accountNumber || undefined, avgMonthlyCost: data.avgMonthlyCost || undefined, dueDate: data.dueDate || undefined, notes: data.notes || undefined }
    if (editing === "new") {
      const item = await createUtility({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateUtility(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteUtility(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Utilities" count={items.length} onAdd={() => setEditing("new")} emptyText="No utilities added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-gray-900 capitalize">{item.utilityType}</p>
              {item.autopay && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Autopay</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider" value={item.provider} />
              <Field label="Account #" value={item.accountNumber} />
              <Field label="Avg monthly" value={item.avgMonthlyCost} />
              <Field label="Due date" value={item.dueDate} />
            </div>
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add utility" : "Edit utility"}
          fields={fields}
          defaultValues={editing !== "new" ? editing : undefined}
          onSave={handleSave}
          onDelete={editing !== "new" ? () => handleDelete(editing.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

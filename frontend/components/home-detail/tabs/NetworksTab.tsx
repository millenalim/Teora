"use client"

import { useState } from "react"
import { createNetwork, updateNetwork, deleteNetwork, revealWifiPassword } from "@/actions/home-info"
import { InfoSection, InfoCard, Field } from "../InfoSection"
import SecureCode from "@/components/SecureCode"
import SimpleModal from "../SimpleModal"

type NetworkSafe = { id: number; homeId: number; provider: string | null; accountNumber: string | null; planDetails: string | null; wifiName: string | null; routerIp: string | null; notes: string | null; createdAt: Date; updatedAt: Date }

export default function NetworksTab({ homeId, initialData }: { homeId: number; initialData: NetworkSafe[] }) {
  const [items, setItems] = useState(initialData)
  const [editing, setEditing] = useState<NetworkSafe | null | "new">(null)

  const fields = [
    { name: "provider", label: "Provider", placeholder: "e.g. Comcast" },
    { name: "accountNumber", label: "Account number" },
    { name: "planDetails", label: "Plan details", placeholder: "e.g. 1Gbps fiber" },
    { name: "wifiName", label: "Wi-Fi name (SSID)" },
    { name: "wifiPassword", label: "Wi-Fi password (new/update only)", type: "password" },
    { name: "routerIp", label: "Router IP", placeholder: "e.g. 192.168.1.1" },
    { name: "notes", label: "Notes", multiline: true },
  ]

  async function handleSave(data: Record<string, string>) {
    const payload = {
      provider: data.provider || undefined,
      accountNumber: data.accountNumber || undefined,
      planDetails: data.planDetails || undefined,
      wifiName: data.wifiName || undefined,
      wifiPassword: data.wifiPassword || undefined,
      routerIp: data.routerIp || undefined,
      notes: data.notes || undefined,
    }
    if (editing === "new") {
      const item = await createNetwork({ homeId, ...payload })
      setItems((p) => [...p, item])
    } else if (editing) {
      const item = await updateNetwork(editing.id, payload)
      setItems((p) => p.map((x) => x.id === item.id ? item : x))
    }
    setEditing(null)
  }

  async function handleDelete(id: number) {
    await deleteNetwork(id)
    setItems((p) => p.filter((x) => x.id !== id))
    setEditing(null)
  }

  return (
    <>
      <InfoSection title="Network & Wi-Fi" count={items.length} onAdd={() => setEditing("new")} emptyText="No networks added.">
        {items.map((item) => (
          <InfoCard key={item.id} onEdit={() => setEditing(item)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provider" value={item.provider} />
              <Field label="Account #" value={item.accountNumber} />
              <Field label="Plan" value={item.planDetails} />
              <Field label="Router IP" value={item.routerIp} />
            </div>
            {item.wifiName && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Wi-Fi</p>
                <p className="text-sm text-gray-800 font-medium mb-1">{item.wifiName}</p>
                <SecureCode onReveal={() => revealWifiPassword(item.id)} label="password" />
              </div>
            )}
            {item.notes && <Field label="Notes" value={item.notes} />}
          </InfoCard>
        ))}
      </InfoSection>
      {editing !== null && (
        <SimpleModal
          title={editing === "new" ? "Add network" : "Edit network"}
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

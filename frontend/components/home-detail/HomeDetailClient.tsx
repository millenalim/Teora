"use client"

import { useState } from "react"
import type {
  Home, HomeMember, User,
  ServiceProvider, LockCode, InternetNetwork,
  ApplianceWarranty, ImportantContact, UtilityBill,
  SmartHomeSystem, EmergencyInfo,
} from "@/app/generated/prisma/client"
import ServiceProvidersTab from "./tabs/ServiceProvidersTab"
import LockCodesTab from "./tabs/LockCodesTab"
import NetworksTab from "./tabs/NetworksTab"
import WarrantiesTab from "./tabs/WarrantiesTab"
import ContactsTab from "./tabs/ContactsTab"
import UtilitiesTab from "./tabs/UtilitiesTab"
import SmartHomeTab from "./tabs/SmartHomeTab"
import EmergencyTab from "./tabs/EmergencyTab"

type HomeWithMembers = Home & { members: (HomeMember & { user: User })[] }

type LockCodeSafe = Omit<LockCode, "codeEncrypted">
type NetworkSafe = Omit<InternetNetwork, "wifiPasswordEncrypted">

const TABS = [
  { id: "providers", label: "Service Providers" },
  { id: "locks", label: "Lock Codes" },
  { id: "network", label: "Network & Wi-Fi" },
  { id: "warranties", label: "Warranties" },
  { id: "contacts", label: "Contacts" },
  { id: "utilities", label: "Utilities" },
  { id: "smart", label: "Smart Home" },
  { id: "emergency", label: "Emergency" },
]

export default function HomeDetailClient({
  home,
  serviceProviders,
  lockCodes,
  networks,
  warranties,
  contacts,
  utilities,
  smartHomeSystems,
  emergencyInfos,
}: {
  home: HomeWithMembers
  serviceProviders: ServiceProvider[]
  lockCodes: LockCodeSafe[]
  networks: NetworkSafe[]
  warranties: ApplianceWarranty[]
  contacts: ImportantContact[]
  utilities: UtilityBill[]
  smartHomeSystems: SmartHomeSystem[]
  emergencyInfos: EmergencyInfo[]
}) {
  const [tab, setTab] = useState("providers")

  return (
    <div className="space-y-5">
      {/* Home header */}
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: home.colorTag }} />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{home.name}</h1>
          <p className="text-sm text-gray-500">{home.address}</p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          {home.sqft && <span>{home.sqft.toLocaleString()} sqft</span>}
          {home.purpose && <span>{home.purpose}</span>}
          <span>{home.members.length} member{home.members.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === "providers" && <ServiceProvidersTab homeId={home.id} initialData={serviceProviders} />}
        {tab === "locks" && <LockCodesTab homeId={home.id} initialData={lockCodes} />}
        {tab === "network" && <NetworksTab homeId={home.id} initialData={networks} />}
        {tab === "warranties" && <WarrantiesTab homeId={home.id} initialData={warranties} />}
        {tab === "contacts" && <ContactsTab homeId={home.id} initialData={contacts} />}
        {tab === "utilities" && <UtilitiesTab homeId={home.id} initialData={utilities} />}
        {tab === "smart" && <SmartHomeTab homeId={home.id} initialData={smartHomeSystems} />}
        {tab === "emergency" && <EmergencyTab homeId={home.id} initialData={emergencyInfos} />}
      </div>
    </div>
  )
}

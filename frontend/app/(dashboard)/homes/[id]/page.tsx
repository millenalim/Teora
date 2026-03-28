import { notFound } from "next/navigation"
import { requireSession } from "@/lib/permissions"
import { getHome } from "@/actions/homes"
import { getServiceProviders, getLockCodes, getNetworks, getWarranties, getContacts, getUtilities, getSmartHomeSystems, getEmergencyInfo } from "@/actions/home-info"
import HomeDetailClient from "@/components/home-detail/HomeDetailClient"

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()
  const { id } = await params
  const homeId = parseInt(id)

  if (isNaN(homeId)) notFound()

  const [
    home,
    serviceProviders,
    lockCodes,
    networks,
    warranties,
    contacts,
    utilities,
    smartHomeSystems,
    emergencyInfos,
  ] = await Promise.all([
    getHome(homeId).catch(() => null),
    getServiceProviders(homeId),
    getLockCodes(homeId),
    getNetworks(homeId),
    getWarranties(homeId),
    getContacts(homeId),
    getUtilities(homeId),
    getSmartHomeSystems(homeId),
    getEmergencyInfo(homeId),
  ])

  if (!home) notFound()

  return (
    <HomeDetailClient
      home={home}
      serviceProviders={serviceProviders}
      lockCodes={lockCodes}
      networks={networks}
      warranties={warranties}
      contacts={contacts}
      utilities={utilities}
      smartHomeSystems={smartHomeSystems}
      emergencyInfos={emergencyInfos}
    />
  )
}

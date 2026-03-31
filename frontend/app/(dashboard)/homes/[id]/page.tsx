import { notFound } from "next/navigation"
import { requireSession } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { getHome } from "@/actions/homes"
import {
  getServiceProviders,
  getLockCodes,
  getNetworks,
  getWarranties,
  getContacts,
  getUtilities,
  getSmartHomeSystems,
  getEmergencyInfo,
  getAccessLogs,
} from "@/actions/home-info"
import HomeDetailClient from "@/components/home-detail/HomeDetailClient"

const ADMIN_ROLES = new Set(["owner", "admin"])

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession()
  const { id } = await params
  const homeId = parseInt(id)

  if (isNaN(homeId)) notFound()

  const userId = parseInt(session.user.id)
  const membership = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId, userId } },
  })
  const isAdmin = !!membership && ADMIN_ROLES.has(membership.role)

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

  const accessLogs = isAdmin ? await getAccessLogs(homeId) : []

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
      accessLogs={accessLogs}
      isAdmin={isAdmin}
    />
  )
}

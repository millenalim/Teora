"use server"

import { prisma } from "@/lib/prisma"
import { encryptField, decryptField } from "@/lib/encryption"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

// ─── Service Providers ───────────────────────

export async function getServiceProviders(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)
  return prisma.serviceProvider.findMany({ where: { homeId }, orderBy: { name: "asc" } })
}

export async function createServiceProvider(data: {
  homeId: number; name: string; serviceType?: string
  phone?: string; email?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const result = await prisma.serviceProvider.create({ data })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateServiceProvider(id: number, data: {
  name?: string; serviceType?: string; phone?: string; email?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.serviceProvider.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const result = await prisma.serviceProvider.update({ where: { id }, data })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteServiceProvider(id: number) {
  const session = await requireSession()
  const record = await prisma.serviceProvider.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.serviceProvider.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

// ─── Lock Codes ──────────────────────────────

export async function getLockCodes(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  // Never return the encrypted code in standard reads
  return prisma.lockCode.findMany({
    where: { homeId },
    select: { id: true, homeId: true, location: true, lockType: true, notes: true, createdAt: true, updatedAt: true },
    orderBy: { location: "asc" },
  })
}

export async function createLockCode(data: {
  homeId: number; location: string; code: string; lockType?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const { code, ...rest } = data
  const result = await prisma.lockCode.create({
    data: { ...rest, codeEncrypted: encryptField(code) },
    select: { id: true, homeId: true, location: true, lockType: true, notes: true, createdAt: true, updatedAt: true },
  })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateLockCode(id: number, data: {
  location?: string; code?: string; lockType?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.lockCode.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const { code, ...rest } = data
  const result = await prisma.lockCode.update({
    where: { id },
    data: { ...rest, ...(code ? { codeEncrypted: encryptField(code) } : {}) },
    select: { id: true, homeId: true, location: true, lockType: true, notes: true, createdAt: true, updatedAt: true },
  })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteLockCode(id: number) {
  const session = await requireSession()
  const record = await prisma.lockCode.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.lockCode.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

export async function revealLockCode(id: number): Promise<string> {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const record = await prisma.lockCode.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, record.homeId)

  const headersList = await headers()
  await prisma.accessLog.create({
    data: {
      homeId: record.homeId,
      userId,
      entityType: "lock_code",
      entityId: id,
    },
  })

  return decryptField(record.codeEncrypted)
}

// ─── Internet Networks ────────────────────────

export async function getNetworks(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  return prisma.internetNetwork.findMany({
    where: { homeId },
    select: {
      id: true, homeId: true, provider: true, accountNumber: true,
      planDetails: true, wifiName: true, routerIp: true, notes: true,
      createdAt: true, updatedAt: true,
      // wifiPasswordEncrypted intentionally omitted
    },
    orderBy: { provider: "asc" },
  })
}

export async function createNetwork(data: {
  homeId: number; provider?: string; accountNumber?: string; planDetails?: string
  wifiName?: string; wifiPassword?: string; routerIp?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const { wifiPassword, ...rest } = data
  const result = await prisma.internetNetwork.create({
    data: { ...rest, ...(wifiPassword ? { wifiPasswordEncrypted: encryptField(wifiPassword) } : {}) },
    select: {
      id: true, homeId: true, provider: true, accountNumber: true,
      planDetails: true, wifiName: true, routerIp: true, notes: true,
      createdAt: true, updatedAt: true,
    },
  })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateNetwork(id: number, data: {
  provider?: string; accountNumber?: string; planDetails?: string
  wifiName?: string; wifiPassword?: string; routerIp?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.internetNetwork.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const { wifiPassword, ...rest } = data
  const result = await prisma.internetNetwork.update({
    where: { id },
    data: { ...rest, ...(wifiPassword ? { wifiPasswordEncrypted: encryptField(wifiPassword) } : {}) },
    select: {
      id: true, homeId: true, provider: true, accountNumber: true,
      planDetails: true, wifiName: true, routerIp: true, notes: true,
      createdAt: true, updatedAt: true,
    },
  })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteNetwork(id: number) {
  const session = await requireSession()
  const record = await prisma.internetNetwork.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.internetNetwork.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

export async function revealWifiPassword(id: number): Promise<string> {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const record = await prisma.internetNetwork.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, record.homeId)
  if (!record.wifiPasswordEncrypted) throw new Error("No password stored")

  await prisma.accessLog.create({
    data: { homeId: record.homeId, userId, entityType: "wifi_password", entityId: id },
  })

  return decryptField(record.wifiPasswordEncrypted)
}

// ─── Appliance Warranties ─────────────────────

export async function getWarranties(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  return prisma.applianceWarranty.findMany({ where: { homeId }, orderBy: { warrantyExpiry: "asc" } })
}

export async function createWarranty(data: {
  homeId: number; appliance: string; brand?: string; model?: string
  serialNumber?: string; purchaseDate?: Date; warrantyExpiry?: Date
  purchasedFrom?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const result = await prisma.applianceWarranty.create({ data })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateWarranty(id: number, data: {
  appliance?: string; brand?: string; model?: string; serialNumber?: string
  purchaseDate?: Date | null; warrantyExpiry?: Date | null; purchasedFrom?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.applianceWarranty.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const result = await prisma.applianceWarranty.update({ where: { id }, data })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteWarranty(id: number) {
  const session = await requireSession()
  const record = await prisma.applianceWarranty.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.applianceWarranty.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

// ─── Important Contacts ───────────────────────

export async function getContacts(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  return prisma.importantContact.findMany({ where: { homeId }, orderBy: { contactType: "asc" } })
}

export async function createContact(data: {
  homeId: number; name: string; contactType?: string; phone?: string
  email?: string; accountNumber?: string; policyNumber?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const result = await prisma.importantContact.create({ data })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateContact(id: number, data: {
  name?: string; contactType?: string; phone?: string; email?: string
  accountNumber?: string; policyNumber?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.importantContact.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const result = await prisma.importantContact.update({ where: { id }, data })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteContact(id: number) {
  const session = await requireSession()
  const record = await prisma.importantContact.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.importantContact.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

// ─── Utility Bills ────────────────────────────

export async function getUtilities(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  return prisma.utilityBill.findMany({ where: { homeId }, orderBy: { utilityType: "asc" } })
}

export async function createUtility(data: {
  homeId: number; utilityType: string; provider?: string; accountNumber?: string
  avgMonthlyCost?: string; dueDate?: string; autopay?: boolean; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const result = await prisma.utilityBill.create({ data })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateUtility(id: number, data: {
  utilityType?: string; provider?: string; accountNumber?: string
  avgMonthlyCost?: string; dueDate?: string; autopay?: boolean; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.utilityBill.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const result = await prisma.utilityBill.update({ where: { id }, data })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteUtility(id: number) {
  const session = await requireSession()
  const record = await prisma.utilityBill.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.utilityBill.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

// ─── Smart Home Systems ───────────────────────

export async function getSmartHomeSystems(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  return prisma.smartHomeSystem.findMany({ where: { homeId }, orderBy: { systemName: "asc" } })
}

export async function createSmartHomeSystem(data: {
  homeId: number; systemName: string; appName?: string; hubModel?: string
  accountEmail?: string; connectedDevices?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const result = await prisma.smartHomeSystem.create({ data })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateSmartHomeSystem(id: number, data: {
  systemName?: string; appName?: string; hubModel?: string
  accountEmail?: string; connectedDevices?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.smartHomeSystem.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const result = await prisma.smartHomeSystem.update({ where: { id }, data })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteSmartHomeSystem(id: number) {
  const session = await requireSession()
  const record = await prisma.smartHomeSystem.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.smartHomeSystem.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

// ─── Emergency Info ───────────────────────────

export async function getEmergencyInfo(homeId: number) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), homeId)
  return prisma.emergencyInfo.findMany({ where: { homeId }, orderBy: { item: "asc" } })
}

export async function createEmergencyInfo(data: {
  homeId: number; item: string; location?: string; details?: string; notes?: string
}) {
  const session = await requireSession()
  await requireHomeMember(parseInt(session.user.id), data.homeId)
  const result = await prisma.emergencyInfo.create({ data })
  revalidatePath(`/homes/${data.homeId}`)
  return result
}

export async function updateEmergencyInfo(id: number, data: {
  item?: string; location?: string; details?: string; notes?: string
}) {
  const session = await requireSession()
  const record = await prisma.emergencyInfo.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(parseInt(session.user.id), record.homeId)
  const result = await prisma.emergencyInfo.update({ where: { id }, data })
  revalidatePath(`/homes/${record.homeId}`)
  return result
}

export async function deleteEmergencyInfo(id: number) {
  const session = await requireSession()
  const record = await prisma.emergencyInfo.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(parseInt(session.user.id), record.homeId, "manager")
  await prisma.emergencyInfo.delete({ where: { id } })
  revalidatePath(`/homes/${record.homeId}`)
}

// ─── Access Log (read-only) ───────────────────

export async function getAccessLogs(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, homeId, "admin")

  return prisma.accessLog.findMany({
    where: { homeId },
    include: { user: { select: { id: true, username: true, fullName: true } } },
    orderBy: { accessedAt: "desc" },
    take: 100,
  })
}

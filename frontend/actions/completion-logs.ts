"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getCompletionLogs(
  homeId: number,
  entityType: string,
  entityId: number
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.completionLog.findMany({
    where: { homeId, entityType, entityId },
    orderBy: { completedDate: "desc" },
  })
}

export async function createCompletionLog(data: {
  homeId: number
  entityType: string
  entityId: number
  completedDate: Date
  cost?: string
  notes?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const membership = await requireHomeMember(userId, data.homeId)

  const log = await prisma.completionLog.create({
    data: { ...data, completedById: membership.id },
  })

  revalidatePath(`/homes/${data.homeId}`)
  return log
}

export async function deleteCompletionLog(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const log = await prisma.completionLog.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(userId, log.homeId, "manager")

  await prisma.completionLog.delete({ where: { id } })
  revalidatePath(`/homes/${log.homeId}`)
}

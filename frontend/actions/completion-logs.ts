"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { recalculateNextDue } from "@/actions/maintenance"

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
    include: { completedBy: { select: { id: true, name: true } } },
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
  await requireHomeMember(userId, data.homeId)

  const log = await prisma.completionLog.create({ data })

  if (data.entityType === "maintenance") {
    await recalculateNextDue(data.entityId)
  }

  revalidatePath(`/homes/${data.homeId}`)
  revalidatePath(`/maintenance`)
  return log
}

export async function deleteCompletionLog(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const log = await prisma.completionLog.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(userId, log.homeId, "manager")

  await prisma.completionLog.delete({ where: { id } })

  if (log.entityType === "maintenance") {
    await recalculateNextDue(log.entityId)
  }

  revalidatePath(`/homes/${log.homeId}`)
  revalidatePath(`/maintenance`)
}

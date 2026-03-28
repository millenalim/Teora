"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { computeNextDue } from "@/lib/maintenance-utils"

export type { MaintenanceStatus } from "@/lib/maintenance-utils"

export async function getMaintenanceTasks(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.maintenanceTask.findMany({
    where: { homeId },
    orderBy: [{ nextDue: "asc" }, { taskName: "asc" }],
  })
}

export async function createMaintenanceTask(data: {
  homeId: number
  taskName: string
  frequency?: string
  provider?: string
  estimatedCost?: string
  notes?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const task = await prisma.maintenanceTask.create({ data })
  revalidatePath(`/maintenance`)
  revalidatePath(`/homes/${data.homeId}`)
  return task
}

export async function updateMaintenanceTask(
  id: number,
  data: {
    taskName?: string
    frequency?: string
    provider?: string
    estimatedCost?: string
    notes?: string
    nextDue?: Date | null
  }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const task = await prisma.maintenanceTask.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, task.homeId)

  const updated = await prisma.maintenanceTask.update({ where: { id }, data })
  revalidatePath(`/maintenance`)
  revalidatePath(`/homes/${task.homeId}`)
  return updated
}

export async function deleteMaintenanceTask(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const task = await prisma.maintenanceTask.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(userId, task.homeId, "manager")

  await prisma.maintenanceTask.delete({ where: { id } })
  revalidatePath(`/maintenance`)
  revalidatePath(`/homes/${task.homeId}`)
}

/** Called after a completion log is created/deleted for a maintenance task */
export async function recalculateNextDue(maintenanceTaskId: number) {
  const task = await prisma.maintenanceTask.findUniqueOrThrow({
    where: { id: maintenanceTaskId },
  })

  const lastLog = await prisma.completionLog.findFirst({
    where: { entityType: "maintenance", entityId: maintenanceTaskId },
    orderBy: { completedDate: "desc" },
  })

  const nextDue = lastLog
    ? computeNextDue(task.frequency, lastLog.completedDate)
    : null

  await prisma.maintenanceTask.update({
    where: { id: maintenanceTaskId },
    data: { nextDue },
  })

  revalidatePath(`/maintenance`)
}

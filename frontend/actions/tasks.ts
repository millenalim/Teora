"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getTasks(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.task.findMany({
    where: { homeId },
    include: { createdBy: true, assignees: true },
    orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
  })
}

export async function getTask(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const task = await prisma.task.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, task.homeId)
  return prisma.task.findUniqueOrThrow({
    where: { id },
    include: { createdBy: true, assignees: true },
  })
}

export async function createTask(data: {
  homeId: number
  title: string
  description?: string
  status?: string
  priority?: string
  startDate?: Date
  endDate?: Date
  recurrence?: string
  recurrenceEndDate?: Date
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const task = await prisma.task.create({
    data: { ...data, createdById: userId },
    include: { createdBy: true, assignees: true },
  })

  revalidatePath(`/tasks`)
  revalidatePath(`/calendar`)
  return task
}

export async function updateTask(
  id: number,
  data: {
    title?: string
    description?: string
    status?: string
    priority?: string
    startDate?: Date | null
    endDate?: Date | null
    recurrence?: string | null
    recurrenceEndDate?: Date | null
  }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const task = await prisma.task.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, task.homeId)

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: { createdBy: true, assignees: true },
  })

  revalidatePath(`/tasks`)
  revalidatePath(`/calendar`)
  return updated
}

export async function moveTask(id: number, status: string) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const task = await prisma.task.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, task.homeId)

  const updated = await prisma.task.update({ where: { id }, data: { status } })
  revalidatePath(`/tasks`)
  return updated
}

export async function deleteTask(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const task = await prisma.task.findUniqueOrThrow({ where: { id } })
  await requireHomeRole(userId, task.homeId, "manager")

  await prisma.task.delete({ where: { id } })
  revalidatePath(`/tasks`)
  revalidatePath(`/calendar`)
}

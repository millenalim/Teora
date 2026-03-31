"use server"

import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

export async function getUnreadCount() {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  return prisma.notification.count({ where: { userId, read: false } })
}

export async function markRead(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
  revalidatePath("/", "layout")
}

export async function markAllRead() {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
  revalidatePath("/", "layout")
}

export async function deleteNotification(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await prisma.notification.deleteMany({ where: { id, userId } })
  revalidatePath("/", "layout")
}

// Internal helper — called by other actions, not exposed as a user-callable server action
export async function createNotification(data: {
  userId: number
  homeId?: number
  type: string
  title: string
  body?: string
  entityType?: string
  entityId?: number
}) {
  return prisma.notification.create({ data })
}

// Notify all members of a home (used by bulletins, etc.)
export async function notifyHomeMembers(
  homeId: number,
  excludeUserId: number,
  payload: { type: string; title: string; body?: string; entityType?: string; entityId?: number }
) {
  const members = await prisma.homeMember.findMany({ where: { homeId } })
  const targets = members.filter((m) => m.userId !== excludeUserId)
  if (targets.length === 0) return

  await prisma.notification.createMany({
    data: targets.map((m) => ({
      userId: m.userId,
      homeId,
      ...payload,
    })),
  })
}

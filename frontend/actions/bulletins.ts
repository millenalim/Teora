"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember } from "@/lib/permissions"
import { notifyHomeMembers } from "@/actions/notifications"
import { revalidatePath } from "next/cache"

export async function getBulletins(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.bulletin.findMany({
    where: { homeId },
    include: { author: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  })
}

export async function createBulletin(data: {
  homeId: number
  title: string
  body: string
  pinned?: boolean
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const bulletin = await prisma.bulletin.create({
    data: { homeId: data.homeId, authorId: userId, title: data.title, body: data.body, pinned: data.pinned ?? false },
    include: { author: true },
  })

  await notifyHomeMembers(data.homeId, userId, {
    type: "bulletin",
    title: `New bulletin: ${data.title}`,
    body: data.body.slice(0, 120),
    entityType: "bulletin",
    entityId: bulletin.id,
  })

  revalidatePath("/")
  return bulletin
}

export async function updateBulletin(
  id: number,
  data: { title?: string; body?: string; pinned?: boolean }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.bulletin.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  const updated = await prisma.bulletin.update({
    where: { id },
    data,
    include: { author: true },
  })

  revalidatePath("/")
  return updated
}

export async function deleteBulletin(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.bulletin.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  await prisma.bulletin.delete({ where: { id } })
  revalidatePath("/")
}

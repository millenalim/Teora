"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getProtocols(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.protocol.findMany({
    where: { homeId },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  })
}

export async function createProtocol(data: {
  homeId: number
  title: string
  category?: string
  steps?: string[]
  notes?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const protocol = await prisma.protocol.create({
    data: {
      homeId: data.homeId,
      title: data.title,
      category: data.category,
      steps: JSON.stringify(data.steps ?? []),
      notes: data.notes,
    },
  })

  revalidatePath("/protocols")
  return protocol
}

export async function updateProtocol(
  id: number,
  data: { title?: string; category?: string; steps?: string[]; notes?: string }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.protocol.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  const updated = await prisma.protocol.update({
    where: { id },
    data: {
      ...data,
      steps: data.steps !== undefined ? JSON.stringify(data.steps) : undefined,
    },
  })

  revalidatePath("/protocols")
  return updated
}

export async function deleteProtocol(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.protocol.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  // Delete related completion logs
  await prisma.completionLog.deleteMany({ where: { entityType: "protocol", entityId: id } })
  await prisma.protocol.delete({ where: { id } })
  revalidatePath("/protocols")
}

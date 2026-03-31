"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export type MentionData = { type: "person" | "vendor"; id: number; name: string }

// Parse @Name mentions from a string, resolving against people and vendors in the home.
// Returns structured mention list.
export async function parseMentions(homeId: number, text: string): Promise<MentionData[]> {
  const atNames = [...text.matchAll(/@([\w\s'-]+?)(?=\s|$|[,.!?])/g)].map((m) =>
    m[1].trim().toLowerCase()
  )
  if (atNames.length === 0) return []

  const [people, vendors] = await Promise.all([
    prisma.person.findMany({ where: { homeId }, select: { id: true, name: true } }),
    prisma.vendor.findMany({
      where: { vendorHomes: { some: { homeId } } },
      select: { id: true, companyName: true },
    }),
  ])

  const mentions: MentionData[] = []
  for (const raw of atNames) {
    const person = people.find((p) => p.name.toLowerCase() === raw)
    if (person) { mentions.push({ type: "person", id: person.id, name: person.name }); continue }
    const vendor = vendors.find((v) => v.companyName.toLowerCase() === raw)
    if (vendor) { mentions.push({ type: "vendor", id: vendor.id, name: vendor.companyName }); continue }
  }
  return mentions
}

export async function getActivityLogs(homeId: number, limit = 50) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.activityLog.findMany({
    where: { homeId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}

export async function createActivityLog(data: {
  homeId: number
  action: string
  entityType?: string
  entityId?: number
  mentions?: MentionData[]
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const mentions = data.mentions ?? (await parseMentions(data.homeId, data.action))

  const log = await prisma.activityLog.create({
    data: {
      homeId: data.homeId,
      userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
    },
    include: { user: true },
  })

  revalidatePath("/")
  return log
}

export async function deleteActivityLog(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const log = await prisma.activityLog.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, log.homeId)

  await prisma.activityLog.delete({ where: { id } })
  revalidatePath("/")
}

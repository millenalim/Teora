"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getHomes() {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  return prisma.home.findMany({
    where: {
      isActive: true,
      members: { some: { userId } },
    },
    include: { members: { include: { user: true } } },
    orderBy: { name: "asc" },
  })
}

export async function getHome(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, id)

  return prisma.home.findUniqueOrThrow({
    where: { id },
    include: { members: { include: { user: true } } },
  })
}

export async function getHomeSummary(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, id)

  const [memberCount] = await Promise.all([
    prisma.homeMember.count({ where: { homeId: id } }),
  ])

  return { memberCount }
}

export async function createHome(data: {
  name: string
  address: string
  sqft?: number
  lotSize?: string
  purpose?: string
  description?: string
  colorTag?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  const home = await prisma.home.create({
    data: {
      ...data,
      members: {
        create: { userId, role: "owner" },
      },
    },
  })

  revalidatePath("/")
  return home
}

export async function updateHome(
  id: number,
  data: {
    name?: string
    address?: string
    sqft?: number
    lotSize?: string
    purpose?: string
    description?: string
    colorTag?: string
  }
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, id, "admin")

  const home = await prisma.home.update({ where: { id }, data })
  revalidatePath("/")
  revalidatePath(`/homes/${id}`)
  return home
}

export async function deleteHome(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, id, "owner")

  await prisma.home.update({ where: { id }, data: { isActive: false } })
  revalidatePath("/")
}

export async function getMembers(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.homeMember.findMany({
    where: { homeId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  })
}

export async function addMember(
  homeId: number,
  newUserId: number,
  role: "viewer" | "manager" | "admin"
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, homeId, "admin")

  const member = await prisma.homeMember.create({
    data: { homeId, userId: newUserId, role },
    include: { user: true },
  })

  revalidatePath(`/homes/${homeId}`)
  return member
}

export async function updateMemberRole(
  homeId: number,
  targetUserId: number,
  role: "viewer" | "manager" | "admin"
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, homeId, "admin")

  const member = await prisma.homeMember.update({
    where: { homeId_userId: { homeId, userId: targetUserId } },
    data: { role },
  })

  revalidatePath(`/homes/${homeId}`)
  return member
}

export async function removeMember(homeId: number, targetUserId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, homeId, "admin")

  await prisma.homeMember.delete({
    where: { homeId_userId: { homeId, userId: targetUserId } },
  })

  revalidatePath(`/homes/${homeId}`)
}

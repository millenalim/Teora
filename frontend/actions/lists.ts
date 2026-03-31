"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getLists(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.list.findMany({
    where: { homeId },
    include: { createdBy: true, items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  })
}

export async function createList(data: { homeId: number; title: string; category?: string }) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, data.homeId)

  const list = await prisma.list.create({
    data: { homeId: data.homeId, createdById: userId, title: data.title, category: data.category },
    include: { createdBy: true, items: true },
  })

  revalidatePath("/lists")
  return list
}

export async function updateList(id: number, data: { title?: string; category?: string }) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.list.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  const updated = await prisma.list.update({
    where: { id },
    data,
    include: { createdBy: true, items: { orderBy: { sortOrder: "asc" } } },
  })

  revalidatePath("/lists")
  return updated
}

export async function deleteList(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.list.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  await prisma.list.delete({ where: { id } })
  revalidatePath("/lists")
}

export async function addListItem(listId: number, text: string) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const list = await prisma.list.findUniqueOrThrow({ where: { id: listId } })
  await requireHomeMember(userId, list.homeId)

  const count = await prisma.listItem.count({ where: { listId } })
  const item = await prisma.listItem.create({
    data: { listId, text, sortOrder: count },
  })

  revalidatePath("/lists")
  return item
}

export async function toggleListItem(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const item = await prisma.listItem.findUniqueOrThrow({ where: { id }, include: { list: true } })
  await requireHomeMember(userId, item.list.homeId)

  const updated = await prisma.listItem.update({
    where: { id },
    data: { checked: !item.checked },
  })

  revalidatePath("/lists")
  return updated
}

export async function updateListItem(id: number, data: { text?: string; sortOrder?: number }) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const item = await prisma.listItem.findUniqueOrThrow({ where: { id }, include: { list: true } })
  await requireHomeMember(userId, item.list.homeId)

  const updated = await prisma.listItem.update({ where: { id }, data })
  revalidatePath("/lists")
  return updated
}

export async function deleteListItem(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const item = await prisma.listItem.findUniqueOrThrow({ where: { id }, include: { list: true } })
  await requireHomeMember(userId, item.list.homeId)

  await prisma.listItem.delete({ where: { id } })
  revalidatePath("/lists")
}

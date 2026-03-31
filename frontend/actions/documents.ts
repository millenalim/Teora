"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { writeFile, unlink } from "fs/promises"
import path from "path"

const UPLOADS_DIR = path.join(process.cwd(), "uploads")

export async function getDocuments(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.document.findMany({
    where: { homeId },
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function uploadDocument(formData: FormData) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  const homeId = parseInt(formData.get("homeId") as string)
  const title = formData.get("title") as string
  const category = (formData.get("category") as string) || undefined
  const notes = (formData.get("notes") as string) || undefined
  const file = formData.get("file") as File

  if (!file || file.size === 0) throw new Error("No file provided")
  await requireHomeMember(userId, homeId)

  const ext = path.extname(file.name)
  const filename = `${randomUUID()}${ext}`
  const filePath = path.join(UPLOADS_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const doc = await prisma.document.create({
    data: {
      homeId,
      uploadedById: userId,
      title,
      filename,
      originalName: file.name,
      mimeType: file.type || undefined,
      sizeBytes: file.size,
      category,
      notes,
    },
    include: { uploadedBy: true },
  })

  revalidatePath("/documents")
  return doc
}

export async function updateDocument(id: number, data: { title?: string; category?: string; notes?: string }) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.document.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  const updated = await prisma.document.update({
    where: { id },
    data,
    include: { uploadedBy: true },
  })

  revalidatePath("/documents")
  return updated
}

export async function deleteDocument(id: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  const existing = await prisma.document.findUniqueOrThrow({ where: { id } })
  await requireHomeMember(userId, existing.homeId)

  // Delete file from disk
  try {
    await unlink(path.join(UPLOADS_DIR, existing.filename))
  } catch {
    // File may already be gone — continue
  }

  await prisma.document.delete({ where: { id } })
  revalidatePath("/documents")
}

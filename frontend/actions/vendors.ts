"use server"

import { prisma } from "@/lib/prisma"
import { requireSession, requireHomeMember, requireHomeRole } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getVendors(homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  return prisma.vendor.findMany({
    where: { vendorHomes: { some: { homeId } } },
    include: { vendorHomes: { select: { homeId: true } } },
    orderBy: { companyName: "asc" },
  })
}

export async function createVendor(data: {
  homeIds: number[]
  companyName: string
  serviceType?: string
  phone?: string
  email?: string
  website?: string
  pricing?: string
  rating?: number
  notes?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await Promise.all(data.homeIds.map((id) => requireHomeMember(userId, id)))

  const { homeIds, ...vendorData } = data
  const vendor = await prisma.vendor.create({
    data: {
      ...vendorData,
      vendorHomes: {
        create: homeIds.map((homeId) => ({ homeId })),
      },
    },
    include: { vendorHomes: { select: { homeId: true } } },
  })

  revalidatePath(`/vendors`)
  return vendor
}

export async function updateVendor(
  id: number,
  data: {
    companyName?: string
    serviceType?: string
    phone?: string
    email?: string
    website?: string
    pricing?: string
    rating?: number
    notes?: string
  },
  homeId: number // used for permission check
) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeMember(userId, homeId)

  const vendor = await prisma.vendor.update({
    where: { id },
    data,
    include: { vendorHomes: { select: { homeId: true } } },
  })

  revalidatePath(`/vendors`)
  return vendor
}

export async function deleteVendor(id: number, homeId: number) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)
  await requireHomeRole(userId, homeId, "manager")

  // Remove just the VendorHome link; if no links remain, delete vendor too
  await prisma.vendorHome.deleteMany({ where: { vendorId: id, homeId } })
  const remaining = await prisma.vendorHome.count({ where: { vendorId: id } })
  if (remaining === 0) await prisma.vendor.delete({ where: { id } })

  revalidatePath(`/vendors`)
}

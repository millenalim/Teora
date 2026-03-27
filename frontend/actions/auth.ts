"use server"

import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/permissions"
import { signIn, signOut } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function register(data: {
  username: string
  email: string
  fullName: string
  password: string
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  })
  if (existing) {
    throw new Error(
      existing.username === data.username
        ? "Username already taken"
        : "Email already in use"
    )
  }

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      passwordHash,
    },
  })

  await signIn("credentials", {
    username: data.username,
    password: data.password,
    redirectTo: "/",
  })

  return user
}

export async function login(data: { username: string; password: string }) {
  await signIn("credentials", {
    username: data.username,
    password: data.password,
    redirectTo: "/",
  })
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}

export async function updateProfile(data: {
  fullName?: string
  email?: string
  avatarUrl?: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, email: true, fullName: true, avatarUrl: true },
  })

  revalidatePath("/")
  return user
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const session = await requireSession()
  const userId = parseInt(session.user.id)

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
  if (!valid) throw new Error("Current password is incorrect")

  const passwordHash = await bcrypt.hash(data.newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

import type { Home, HomeMember, User } from "@/app/generated/prisma/client"

export type HomeWithMembers = Home & {
  members: (HomeMember & { user: User })[]
}

export type MemberWithUser = HomeMember & { user: User }

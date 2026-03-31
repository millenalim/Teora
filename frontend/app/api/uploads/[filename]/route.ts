import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const UPLOADS_DIR = path.join(process.cwd(), "uploads")

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { filename } = await params

  // Prevent path traversal
  const safe = path.basename(filename)
  if (safe !== filename) return NextResponse.json({ error: "Invalid path" }, { status: 400 })

  // Verify the file exists in the database and the user has access
  const doc = await prisma.document.findFirst({ where: { filename: safe } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const userId = parseInt(session.user.id)
  const member = await prisma.homeMember.findUnique({
    where: { homeId_userId: { homeId: doc.homeId, userId } },
  })
  if (!member) return NextResponse.json({ error: "Access denied" }, { status: 403 })

  try {
    const buffer = await readFile(path.join(UPLOADS_DIR, safe))
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.originalName}"`,
        "Content-Length": String(buffer.length),
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}

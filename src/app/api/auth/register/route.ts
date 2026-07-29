/**
 * Email/password account registration for Meridian.
 */

import { NextResponse } from "next/server"
import { z } from "zod"

import { hashPassword } from "@/lib/password-credentials.mjs"
import { getPrisma, hasDatabaseConfig } from "@/lib/prisma"
import { logServerError } from "@/lib/server-logging"
import { ensureWorkspaceForUser } from "@/lib/workspace"

const registerSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(256),
  name: z.string().max(120).optional(),
})

/** Creates a password-backed user account with a hashed credential. */
export async function POST(request: Request) {
  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 })
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and a password with at least 12 characters." }, { status: 400 })
  }

  const prisma = getPrisma()
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 })
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password)
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name?.trim() || parsed.data.email.split("@")[0],
        passwordCredential: {
          create: { passwordHash },
        },
      },
      select: { id: true, email: true, name: true },
    })

    await ensureWorkspaceForUser(user)

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (registrationError) {
    const incident = logServerError("auth.registration_failed", registrationError, { component: "authentication" })
    return NextResponse.json({
      error: "Account registration is temporarily unavailable.",
      incidentId: incident.incidentId,
    }, { status: 503 })
  }
}

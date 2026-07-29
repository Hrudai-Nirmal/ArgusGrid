import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"

import { verifyPassword } from "@/lib/password-credentials.mjs"
import { getPrisma, hasDatabaseConfig } from "@/lib/prisma"
import { logServerError } from "@/lib/server-logging"

/**
 * Reports whether GitHub OAuth credentials are configured.
 */
export function hasGithubAuthConfig() {
  return Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET)
}

/**
 * Reports whether Google OAuth credentials are configured.
 */
export function hasGoogleAuthConfig() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

/**
 * Reports whether at least one sign-in path can run.
 */
export function hasAnyAuthConfig() {
  return hasGithubAuthConfig() || hasGoogleAuthConfig() || hasDatabaseConfig()
}

function buildProviders() {
  const providers = []
  if (hasGithubAuthConfig()) {
    providers.push(GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }))
  }
  if (hasGoogleAuthConfig()) {
    providers.push(GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }))
  }
  if (hasDatabaseConfig()) {
    providers.push(CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password ?? ""
        if (!email || !password) return null

        const user = await getPrisma().user.findUnique({
          where: { email },
          include: { passwordCredential: true },
        })
        if (!user?.passwordCredential) return null

        const verified = await verifyPassword(password, user.passwordCredential.passwordHash)
        if (!verified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }))
  }

  return providers
}

export const authOptions: NextAuthOptions = {
  adapter: hasDatabaseConfig() ? PrismaAdapter(getPrisma()) : undefined,
  providers: buildProviders(),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub ?? ""
      }

      return session
    },
  },
  pages: {
    signIn: "/",
  },
  logger: {
    error(code, metadata) {
      const error = metadata instanceof Error ? metadata : metadata.error
      logServerError("auth.provider_failed", error, { authCode: code })
    },
  },
}

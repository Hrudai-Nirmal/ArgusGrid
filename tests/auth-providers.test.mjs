import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

import { hashPassword, verifyPassword } from "../src/lib/password-credentials.mjs"

test("password credential helper hashes and verifies without storing plaintext", async () => {
  const hash = await hashPassword("correct horse battery staple")

  assert.match(hash, /^scrypt\$/)
  assert.notEqual(hash, "correct horse battery staple")
  assert.equal(await verifyPassword("correct horse battery staple", hash), true)
  assert.equal(await verifyPassword("wrong horse battery staple", hash), false)
})

test("Auth config exposes GitHub, Google, and credentials providers safely", async () => {
  const auth = await readFile("src/lib/auth.ts", "utf8")
  const signIn = await readFile("src/components/auth/sign-in-screen.tsx", "utf8")
  const authPanel = await readFile("src/components/auth/auth-entry-panel.tsx", "utf8")
  const page = await readFile("src/app/page.tsx", "utf8")
  const schema = await readFile("prisma/schema.prisma", "utf8")
  const envExample = await readFile(".env.example", "utf8")

  assert.match(auth, /GoogleProvider/)
  assert.match(auth, /CredentialsProvider/)
  assert.match(auth, /hasGoogleAuthConfig/)
  assert.match(auth, /strategy:\s*"jwt"/)
  assert.match(signIn, /AuthEntryPanel/)
  assert.match(signIn, /className="dark flex min-h-screen items-center justify-center bg-background p-6 text-foreground"/)
  assert.doesNotMatch(signIn, /theme|prefers-color-scheme|localStorage/)
  assert.match(authPanel, /Continue with Google/)
  assert.match(authPanel, /Email/)
  assert.match(authPanel, /Password/)
  assert.match(authPanel, /Create account/)
  assert.match(page, /authReady/)
  assert.match(schema, /model UserPasswordCredential/)
  assert.match(envExample, /GOOGLE_CLIENT_ID=/)
  assert.match(envExample, /GOOGLE_CLIENT_SECRET=/)
  assert.doesNotMatch(auth + signIn + authPanel, /passwordHash.*session|console\.log/)
})

test("normal registration route validates and hashes credentials", async () => {
  const route = await readFile("src/app/api/auth/register/route.ts", "utf8")

  assert.match(route, /hashPassword/)
  assert.match(route, /passwordCredential/)
  assert.match(route, /ensureWorkspaceForUser/)
  assert.match(route, /409/)
  assert.doesNotMatch(route, /console\.log|password:\s*parsed\.data\.password/)
})

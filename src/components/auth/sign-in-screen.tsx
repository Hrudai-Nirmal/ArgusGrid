/**
 * Full-screen wrapper around the reusable Meridian auth entry panel.
 */

"use client"

import { AuthEntryPanel } from "@/components/auth/auth-entry-panel"

/**
 * Renders the legacy full-screen auth entry surface.
 */
export function SignInScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md">
        <AuthEntryPanel />
      </div>
    </main>
  )
}

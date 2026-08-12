/**
 * Reusable Meridian auth panel for signed-out entry points.
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import { getCsrfToken, signIn } from "next-auth/react"
import { GitBranch, KeyRound } from "lucide-react"

import { MeridianLogo } from "@/components/brand/meridian-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AuthEntryPanelProps = {
  title?: string
  description?: string
  footerCopy?: string
}

/**
 * Renders resilient GitHub, Google, and email/password auth controls.
 */
export function AuthEntryPanel({
  title = "Sign in to Meridian",
  description = "Enter the AI automation control room for live ops, cost, quality, and client proof.",
  footerCopy = "First sign-in creates your organization and starts an agency-ready automation map you can monitor and report on.",
}: AuthEntryPanelProps) {
  const [csrfToken, setCsrfToken] = useState("")
  const [authError, setAuthError] = useState("")
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(true)
  const [isServiceReady, setIsServiceReady] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [credentialsMode, setCredentialsMode] = useState<"signin" | "register">("signin")
  const [credentialsMessage, setCredentialsMessage] = useState("")
  const [isCredentialsSubmitting, setIsCredentialsSubmitting] = useState(false)

  const loadSignInReadiness = useCallback(async (signal?: AbortSignal) => {
    try {
      const [token, healthResponse] = await Promise.all([
        getCsrfToken(),
        fetch("/api/health", { cache: "no-store", signal }),
      ])
      const health = await healthResponse.json().catch(() => null)
      if (!token) {
        throw new Error("Auth.js did not return a CSRF token.")
      }
      setCsrfToken(token)

      if (!health?.checks?.database) {
        const incidentId = health?.issues?.find((issue: { component?: string }) => issue.component === "database")?.incidentId
        setAuthError(`Meridian cannot create a secure session because its database is unavailable.${incidentId ? ` Incident ID: ${incidentId}` : ""}`)
        return
      }
      if (!health?.checks?.auth) {
        setAuthError("Authentication is temporarily unavailable.")
        return
      }

      setAuthError("")
      setIsServiceReady(true)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setAuthError("Sign-in readiness could not be verified. Please retry.")
    } finally {
      if (!signal?.aborted) setIsCheckingReadiness(false)
    }
  }, [])

  function handleReadinessRetry() {
    setIsCheckingReadiness(true)
    setIsServiceReady(false)
    void loadSignInReadiness()
  }

  useEffect(() => {
    const controller = new AbortController()
    const readinessTimer = window.setTimeout(() => {
      void loadSignInReadiness(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(readinessTimer)
      controller.abort()
    }
  }, [loadSignInReadiness])

  async function handleCredentialsSubmit() {
    setIsCredentialsSubmitting(true)
    setCredentialsMessage(credentialsMode === "register" ? "Creating account..." : "Signing in...")
    try {
      if (credentialsMode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          setCredentialsMessage(payload?.error ?? "Account could not be created.")
          return
        }
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/",
      })
      if (result?.error) {
        setCredentialsMessage("Email or password is incorrect.")
        return
      }
      window.location.href = result?.url ?? "/"
    } catch {
      setCredentialsMessage("Sign-in could not be completed. Please retry.")
    } finally {
      setIsCredentialsSubmitting(false)
    }
  }

  return (
    <Card className="w-full border-border/70 shadow-xl shadow-primary/5">
      <CardHeader>
        <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/25">
          <MeridianLogo className="size-10" />
        </div>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action="/api/auth/signin/github" method="post">
          <input name="csrfToken" type="hidden" value={csrfToken} />
          <input name="callbackUrl" type="hidden" value="/" />
          <Button className="w-full" type="submit" disabled={!csrfToken || !isServiceReady}>
            <GitBranch data-icon="inline-start" />
            {isCheckingReadiness ? "Checking service readiness..." : "Continue with GitHub"}
          </Button>
        </form>
        <form action="/api/auth/signin/google" method="post">
          <input name="csrfToken" type="hidden" value={csrfToken} />
          <input name="callbackUrl" type="hidden" value="/" />
          <Button className="w-full" type="submit" variant="outline" disabled={!csrfToken || !isServiceReady}>
            <KeyRound data-icon="inline-start" />
            Continue with Google
          </Button>
        </form>
        <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
          <div className="text-sm font-medium">{credentialsMode === "register" ? "Create account" : "Sign in with email"}</div>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Email
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!isServiceReady || isCredentialsSubmitting}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Password
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              type="password"
              autoComplete={credentialsMode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!isServiceReady || isCredentialsSubmitting}
            />
          </label>
          <Button type="button" onClick={handleCredentialsSubmit} disabled={!email || password.length < 12 || !isServiceReady || isCredentialsSubmitting}>
            {credentialsMode === "register" ? "Create account" : "Continue with email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setCredentialsMode(credentialsMode === "register" ? "signin" : "register")
              setCredentialsMessage("")
            }}
          >
            {credentialsMode === "register" ? "I already have an account" : "Create account"}
          </Button>
          {credentialsMessage ? (
            <p className="text-xs text-muted-foreground" role="status">
              {credentialsMessage}
            </p>
          ) : null}
        </div>
        {authError ? (
          <p className="text-sm text-destructive" role="alert">
            {authError}
          </p>
        ) : null}
        {authError ? (
          <Button type="button" variant="outline" onClick={handleReadinessRetry} disabled={isCheckingReadiness}>
            Retry readiness
          </Button>
        ) : null}
        {footerCopy ? <p className="text-xs leading-5 text-muted-foreground">{footerCopy}</p> : null}
      </CardContent>
    </Card>
  )
}

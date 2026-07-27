import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const PALETTE = ["#FFFFFF", "#F8F9FA", "#111827", "#4F46E5", "#10B981"]

test("light mode uses the requested Meridian palette", async () => {
  const css = await readFile("src/app/globals.css", "utf8")
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""

  for (const color of PALETTE) {
    assert.match(rootBlock, new RegExp(color, "i"), `Missing ${color} from light-mode root tokens.`)
  }
  assert.match(rootBlock, /--background:\s*#FFFFFF/i)
  assert.match(rootBlock, /--foreground:\s*#111827/i)
  assert.match(rootBlock, /--card:\s*#F8F9FA/i)
  assert.match(rootBlock, /--primary:\s*#4F46E5/i)
  assert.match(rootBlock, /--accent:\s*#10B981/i)
})

test("public reports inherit the app light background palette", async () => {
  const reportPage = await readFile("src/app/reports/[shareToken]/page.tsx", "utf8")

  assert.match(reportPage, /bg-background/)
  assert.doesNotMatch(reportPage, /bg-zinc-100/)
})

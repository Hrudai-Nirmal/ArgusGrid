import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const PALETTE = ["#F9F7F7", "#DBE2EF", "#3F72AF", "#112D4E"]

test("light mode uses the requested Meridian palette", async () => {
  const css = await readFile("src/app/globals.css", "utf8")
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""

  for (const color of PALETTE) {
    assert.match(rootBlock, new RegExp(color, "i"), `Missing ${color} from light-mode root tokens.`)
  }
  assert.match(rootBlock, /--background:\s*#F9F7F7/i)
  assert.match(rootBlock, /--foreground:\s*#112D4E/i)
  assert.match(rootBlock, /--primary:\s*#3F72AF/i)
  assert.match(rootBlock, /--secondary:\s*#DBE2EF/i)
})

test("public reports inherit the app light background palette", async () => {
  const reportPage = await readFile("src/app/reports/[shareToken]/page.tsx", "utf8")

  assert.match(reportPage, /bg-background/)
  assert.doesNotMatch(reportPage, /bg-zinc-100/)
})

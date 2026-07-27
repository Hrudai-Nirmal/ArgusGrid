import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const PALETTE = ["#778873", "#A1BC98", "#DCCFC0", "#FDF6ED"]

test("light mode uses the requested Meridian palette", async () => {
  const css = await readFile("src/app/globals.css", "utf8")
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""

  for (const color of PALETTE) {
    assert.match(rootBlock, new RegExp(color, "i"), `Missing ${color} from light-mode root tokens.`)
  }
  assert.match(rootBlock, /--background:\s*#FDF6ED/i)
  assert.match(rootBlock, /--primary:\s*#778873/i)
  assert.match(rootBlock, /--secondary:\s*#DCCFC0/i)
  assert.match(rootBlock, /--accent:\s*#A1BC98/i)
})

test("public reports inherit the app light background palette", async () => {
  const reportPage = await readFile("src/app/reports/[shareToken]/page.tsx", "utf8")

  assert.match(reportPage, /bg-background/)
  assert.doesNotMatch(reportPage, /bg-zinc-100/)
})

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const PALETTE = ["#A98B76", "#BFA28C", "#F3E4C9", "#BABF94"]

test("light mode uses the requested Meridian palette", async () => {
  const css = await readFile("src/app/globals.css", "utf8")
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ""

  for (const color of PALETTE) {
    assert.match(rootBlock, new RegExp(color, "i"), `Missing ${color} from light-mode root tokens.`)
  }
  assert.match(rootBlock, /--background:\s*#F3E4C9/i)
  assert.match(rootBlock, /--primary:\s*#A98B76/i)
  assert.match(rootBlock, /--secondary:\s*#BFA28C/i)
  assert.match(rootBlock, /--accent:\s*#BABF94/i)
})

test("public reports inherit the app light background palette", async () => {
  const reportPage = await readFile("src/app/reports/[shareToken]/page.tsx", "utf8")

  assert.match(reportPage, /bg-background/)
  assert.doesNotMatch(reportPage, /bg-zinc-100/)
})

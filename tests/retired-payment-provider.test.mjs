import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const FILES_THAT_MUST_NOT_REFERENCE_RETIRED_PROVIDER = [
  ".env.example",
  "package.json",
  "next.config.ts",
  "src/components/meridian/dashboard.tsx",
  "README.md",
  "context.md",
  "docs/private-beta-qa.md",
  "CHANGELOG.md",
]

const retiredProviderPattern = new RegExp("razor" + "pay", "i")

test("Paddle remains the only checkout provider surfaced by Meridian", async () => {
  for (const filePath of FILES_THAT_MUST_NOT_REFERENCE_RETIRED_PROVIDER) {
    const source = await readFile(filePath, "utf8")

    assert.doesNotMatch(source, retiredProviderPattern, `${filePath} still references the retired checkout provider`)
    assert.doesNotMatch(source, /\/api\/create-order/, `${filePath} still references the retired order route`)
    assert.doesNotMatch(source, /\/api\/verify-payment/, `${filePath} still references the retired verification route`)
  }
})

/*
 * Password credential hashing for Meridian email/password sign-in.
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64
const SALT_BYTES = 16
const HASH_VERSION = "scrypt"

/**
 * Creates a non-reversible password hash using Node's built-in scrypt.
 */
export async function hashPassword(password) {
  const normalized = String(password ?? "")
  if (normalized.length < 12) {
    throw new Error("Password must be at least 12 characters.")
  }

  const salt = randomBytes(SALT_BYTES).toString("hex")
  const derived = await scryptAsync(normalized, salt, KEY_LENGTH)
  return `${HASH_VERSION}$${salt}$${Buffer.from(derived).toString("hex")}`
}

/**
 * Verifies a candidate password against a stored Meridian password hash.
 */
export async function verifyPassword(password, storedHash) {
  const parts = String(storedHash ?? "").split("$")
  if (parts.length !== 3 || parts[0] !== HASH_VERSION || !parts[1] || !parts[2]) return false

  try {
    const expected = Buffer.from(parts[2], "hex")
    const actual = await scryptAsync(String(password ?? ""), parts[1], expected.length)
    const actualBuffer = Buffer.from(actual)
    return actualBuffer.length === expected.length && timingSafeEqual(actualBuffer, expected)
  } catch {
    return false
  }
}

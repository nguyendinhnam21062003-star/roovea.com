import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const keyLength = 64

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, keyLength).toString("hex")

  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":")

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)

  if (actual.length !== expected.length) {
    return false
  }

  return timingSafeEqual(actual, expected)
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL ?? "admin@roovea.local"
}

export function verifyAdminCredentials(email: string, password: string) {
  if (email.trim().toLowerCase() !== getAdminEmail().toLowerCase()) {
    return false
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH

  if (passwordHash) {
    return verifyPassword(password, passwordHash)
  }

  if (
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD &&
    process.env.NODE_ENV !== "production"
  ) {
    return password === process.env.ADMIN_PASSWORD
  }

  if (process.env.NODE_ENV !== "production") {
    return password === "admin123"
  }

  return false
}

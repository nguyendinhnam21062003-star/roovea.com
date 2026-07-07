import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { randomBytes, scryptSync } from "node:crypto"

const [, , email, password] = process.argv
const envPath = ".env.local"

if (!email || !password) {
  console.error("Usage: npm run auth:setup -- <admin-email> <admin-password>")
  process.exit(1)
}

if (!email.includes("@")) {
  console.error("Admin email is not valid.")
  process.exit(1)
}

if (password.length < 10) {
  console.error("Admin password should be at least 10 characters.")
  process.exit(1)
}

function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, "m")

  if (pattern.test(content)) {
    return content.replace(pattern, line)
  }

  return `${content.replace(/\s*$/, "")}\n${line}\n`
}

function removeEnvValue(content, key) {
  return content
    .split(/\r?\n/)
    .filter((line) => !line.startsWith(`${key}=`))
    .join("\n")
}

function hashAdminPassword(value) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(value, salt, 64).toString("hex")

  return `scrypt:${salt}:${hash}`
}

let content = ""

if (existsSync(envPath)) {
  content = readFileSync(envPath, "utf8")
} else if (existsSync(".env.example")) {
  content = readFileSync(".env.example", "utf8")
}

content = upsertEnvValue(content, "ADMIN_EMAIL", email)
content = upsertEnvValue(
  content,
  "ADMIN_PASSWORD_HASH",
  hashAdminPassword(password)
)
content = removeEnvValue(content, "ADMIN_PASSWORD")

writeFileSync(envPath, `${content.replace(/\s*$/, "")}\n`)

console.log(`Updated ${envPath} for admin ${email}.`)

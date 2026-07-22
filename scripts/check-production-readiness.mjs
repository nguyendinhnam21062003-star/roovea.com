import { Pool } from "pg"
import * as nextEnv from "@next/env"

const loadEnvConfig = nextEnv.loadEnvConfig ?? nextEnv.default?.loadEnvConfig

if (!loadEnvConfig) {
  throw new Error("Cannot load Next.js environment variables.")
}

loadEnvConfig(process.cwd())

const requiredEnv = [
  "DATABASE_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_SESSION_SECRET",
  "FIELD_ENCRYPTION_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
]

const requiredTables = [
  "audit_logs",
  "contact_channels",
  "customer_inquiries",
  "app_users",
  "app_user_sessions",
  "rental_listing_media",
  "rental_listings",
  "room_media",
  "rooms",
  "suppliers",
]

const issues = []

function addIssue(message) {
  issues.push(message)
}

for (const name of requiredEnv) {
  const value = process.env[name]

  if (!value) {
    addIssue(`${name} is missing.`)
  }
}

if (process.env.ADMIN_PASSWORD_HASH?.startsWith("scrypt:") === false) {
  addIssue(
    "ADMIN_PASSWORD_HASH must be generated with `npm run auth:setup -- <email> <password>`."
  )
}

if ((process.env.ADMIN_SESSION_SECRET ?? "").length < 32) {
  addIssue("ADMIN_SESSION_SECRET should be at least 32 characters.")
}

if (process.env.ADMIN_SESSION_SECRET?.includes("replace-with")) {
  addIssue("ADMIN_SESSION_SECRET is still using the placeholder value.")
}

if ((process.env.FIELD_ENCRYPTION_KEY ?? "").length < 32) {
  addIssue("FIELD_ENCRYPTION_KEY should be at least 32 characters.")
}

if (process.env.FIELD_ENCRYPTION_KEY?.includes("replace-with")) {
  addIssue("FIELD_ENCRYPTION_KEY is still using the placeholder value.")
}

if (process.env.ADMIN_PASSWORD) {
  addIssue(
    "ADMIN_PASSWORD is only for local fallback login. Remove it for production."
  )
}

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    return
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const tables = await pool.query(
      `
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = any($1::text[])
      `,
      [requiredTables]
    )
    const existing = new Set(tables.rows.map((row) => row.table_name))

    for (const table of requiredTables) {
      if (!existing.has(table)) {
        addIssue(`Database table "${table}" is missing. Run migrations.`)
      }
    }
  } catch (error) {
    addIssue(
      `Cannot connect to DATABASE_URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  } finally {
    await pool.end().catch(() => {})
  }
}

await checkDatabase()

if (issues.length > 0) {
  console.error("Production readiness check failed:")

  for (const issue of issues) {
    console.error(`- ${issue}`)
  }

  process.exit(1)
}

console.log("Production readiness check passed.")

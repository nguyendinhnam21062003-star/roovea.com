import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
const isProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build"

if (
  !connectionString &&
  process.env.NODE_ENV === "production" &&
  !isProductionBuild
) {
  throw new Error("DATABASE_URL is required in production.")
}

const globalForDb = globalThis as typeof globalThis & {
  rooveaPgPool?: Pool
}

export const pool =
  globalForDb.rooveaPgPool ??
  new Pool({
    connectionString:
      connectionString ?? "postgres://postgres:postgres@localhost:5432/roovea",
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.rooveaPgPool = pool
}

export const db = drizzle({ client: pool, schema })

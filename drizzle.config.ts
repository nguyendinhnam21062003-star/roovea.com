import { defineConfig } from "drizzle-kit"
import * as nextEnv from "@next/env"

const loadEnvConfig =
  nextEnv.loadEnvConfig ??
  (nextEnv as typeof nextEnv & { default?: typeof nextEnv }).default
    ?.loadEnvConfig

if (!loadEnvConfig) {
  throw new Error("Cannot load Next.js environment variables.")
}

loadEnvConfig(process.cwd())

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5432/roovea",
  },
})

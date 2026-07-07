import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import * as nextEnv from "@next/env"

const loadEnvConfig = nextEnv.loadEnvConfig ?? nextEnv.default?.loadEnvConfig

if (!loadEnvConfig) {
  throw new Error("Cannot load Next.js environment variables.")
}

loadEnvConfig(process.cwd())

const root = process.cwd()
const runtimeDir = join(root, ".dev-postgres")
const dataDir = join(runtimeDir, "data")
const logDir = join(runtimeDir, "logs")
const logFile = join(logDir, "postgres.log")
const defaultUrl = "postgres://postgres:postgres@localhost:55432/roovea"
const databaseUrl = process.env.DATABASE_URL || defaultUrl
const parsedUrl = new URL(databaseUrl)
const host = parsedUrl.hostname || "localhost"
const port = parsedUrl.port || "5432"
const database = parsedUrl.pathname.replace(/^\//, "") || "roovea"
const user = decodeURIComponent(parsedUrl.username || "postgres")
const password = decodeURIComponent(parsedUrl.password || "postgres")
const command = process.argv[2] || "status"

function commandExists(file) {
  return existsSync(file)
}

function findPostgresBin() {
  const candidates = [
    process.env.POSTGRES_BIN,
    "D:\\PostgreSQL_16\\bin",
    "C:\\Program Files\\PostgreSQL\\17\\bin",
    "C:\\Program Files\\PostgreSQL\\16\\bin",
    "C:\\Program Files\\PostgreSQL\\15\\bin",
  ].filter(Boolean)

  const found = candidates.find((candidate) =>
    commandExists(join(candidate, "pg_ctl.exe"))
  )

  if (!found) {
    throw new Error(
      "Cannot find PostgreSQL binaries. Set POSTGRES_BIN to the folder containing pg_ctl.exe."
    )
  }

  return found
}

const postgresBin = findPostgresBin()

function binary(name) {
  return join(postgresBin, `${name}.exe`)
}

function run(name, args, options = {}) {
  const result = spawnSync(binary(name), args, {
    encoding: "utf8",
    env: {
      ...process.env,
      PGPASSWORD: password,
    },
    stdio: options.quiet ? "pipe" : "inherit",
  })

  if (result.status !== 0 && !options.allowFailure) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n")
    throw new Error(output || `${name} failed with exit code ${result.status}`)
  }

  return result
}

function init() {
  if (existsSync(join(dataDir, "PG_VERSION"))) {
    console.log(`PostgreSQL data directory already exists: ${dataDir}`)
    return
  }

  mkdirSync(runtimeDir, { recursive: true })
  mkdirSync(logDir, { recursive: true })

  const pwFile = join(runtimeDir, "pwfile")
  writeFileSync(pwFile, password)

  try {
    run("initdb", [
      "-D",
      dataDir,
      "-U",
      user,
      `--pwfile=${pwFile}`,
      "--auth-host=scram-sha-256",
      "--auth-local=trust",
      "--encoding=UTF8",
    ])
  } finally {
    rmSync(pwFile, { force: true })
  }
}

function start() {
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    init()
  }

  mkdirSync(logDir, { recursive: true })
  run("pg_ctl", [
    "start",
    "-D",
    dataDir,
    "-l",
    logFile,
    "-o",
    `-p ${port}`,
    "-w",
  ])
}

function stop() {
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    console.log("Local PostgreSQL data directory does not exist.")
    return
  }

  run("pg_ctl", ["stop", "-D", dataDir, "-m", "fast"], {
    allowFailure: true,
  })
}

function status() {
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    console.log("Local PostgreSQL has not been initialized.")
    return
  }

  run("pg_ctl", ["status", "-D", dataDir], { allowFailure: true })
}

function createDatabase() {
  const result = run(
    "createdb",
    ["-h", host, "-p", port, "-U", user, database],
    {
      allowFailure: true,
      quiet: true,
    }
  )

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n")

  if (result.status === 0) {
    console.log(`Created database "${database}".`)
    return
  }

  if (output.includes("already exists")) {
    console.log(`Database "${database}" already exists.`)
    return
  }

  throw new Error(output || "Cannot create local database.")
}

function printInfo() {
  console.log(
    JSON.stringify(
      {
        dataDir: resolve(dataDir),
        database,
        host,
        logFile: resolve(logFile),
        port,
        postgresBin,
        user,
      },
      null,
      2
    )
  )
}

try {
  if (command === "init") {
    init()
    createDatabase()
  } else if (command === "start") {
    start()
    createDatabase()
  } else if (command === "stop") {
    stop()
  } else if (command === "status") {
    status()
    printInfo()
  } else if (command === "info") {
    printInfo()
  } else {
    throw new Error(
      "Usage: node scripts/local-postgres.mjs init|start|stop|status|info"
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

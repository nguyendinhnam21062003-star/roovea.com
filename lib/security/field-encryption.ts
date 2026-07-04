import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

function getEncryptionKey() {
  const rawKey = process.env.FIELD_ENCRYPTION_KEY

  if (!rawKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FIELD_ENCRYPTION_KEY is required in production.")
    }

    return createHash("sha256").update("roovea-dev-field-key").digest()
  }

  return createHash("sha256").update(rawKey).digest()
}

export function encryptField(value: string) {
  if (!value) {
    return ""
  }

  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return `v1:${iv.toString("base64url")}:${tag.toString(
    "base64url"
  )}:${encrypted.toString("base64url")}`
}

export function decryptField(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":")

  if (version !== "v1" || !ivRaw || !tagRaw || !encryptedRaw) {
    return ""
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivRaw, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

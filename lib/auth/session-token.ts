const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const adminSessionCookieName = "roovea_admin_session"
export const adminSessionMaxAgeSeconds = 60 * 60 * 8

export type AdminSession = {
  email: string
  expiresAt: number
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  )
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV !== "production") {
    return "roovea-local-admin-session-secret"
  }

  throw new Error("ADMIN_SESSION_SECRET is required in production.")
}

async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"]
  )
}

async function signPayload(payload: string) {
  const key = await getHmacKey()
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload)
  )

  return bytesToBase64Url(new Uint8Array(signature))
}

export async function createAdminSessionToken(email: string) {
  const payload = bytesToBase64Url(
    textEncoder.encode(
      JSON.stringify({
        email,
        expiresAt: Date.now() + adminSessionMaxAgeSeconds * 1000,
      } satisfies AdminSession)
    )
  )
  const signature = await signPayload(payload)

  return `${payload}.${signature}`
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token) {
    return null
  }

  const [payload, signature] = token.split(".")

  if (!payload || !signature) {
    return null
  }

  const key = await getHmacKey()
  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signature),
    textEncoder.encode(payload)
  )

  if (!verified) {
    return null
  }

  try {
    const session = JSON.parse(
      textDecoder.decode(base64UrlToBytes(payload))
    ) as AdminSession

    if (!session.email || session.expiresAt <= Date.now()) {
      return null
    }

    return session
  } catch {
    return null
  }
}

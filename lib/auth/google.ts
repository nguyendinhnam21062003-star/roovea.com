import "server-only"

import { randomBytes } from "node:crypto"
import { OAuth2Client } from "google-auth-library"

export const googleOAuthStateCookieName = "roovea_google_oauth_state"
export const googleOAuthVerifierCookieName = "roovea_google_oauth_verifier"
export const googleOAuthNonceCookieName = "roovea_google_oauth_nonce"
export const googleOAuthNextCookieName = "roovea_google_oauth_next"
export const googleOAuthCookieMaxAgeSeconds = 60 * 10

export function isGoogleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  )
}

export function getGoogleOAuthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth chưa được cấu hình.")
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

export function getGoogleRedirectUri(requestUrl: string) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim()

  if (configured) return configured

  return new URL("/api/auth/google/callback", requestUrl).toString()
}

export function createOAuthSecret() {
  return randomBytes(24).toString("base64url")
}

export function sanitizeAccountReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/taikhoan") || value.startsWith("//")) {
    return "/taikhoan/tindang"
  }

  return value
}

export function safeCompareOAuthValue(
  first: string | undefined,
  second: string | null
) {
  if (!first || !second || first.length !== second.length) return false

  let mismatch = 0

  for (let index = 0; index < first.length; index += 1) {
    mismatch |= first.charCodeAt(index) ^ second.charCodeAt(index)
  }

  return mismatch === 0
}

import { NextRequest } from "next/server"

import {
  getGoogleOAuthClient,
  getGoogleRedirectUri,
  googleOAuthNextCookieName,
  googleOAuthNonceCookieName,
  googleOAuthStateCookieName,
  googleOAuthVerifierCookieName,
  safeCompareOAuthValue,
  sanitizeAccountReturnPath,
} from "@/lib/auth/google"
import { createUserSession } from "@/lib/auth/user-session"
import { redirectToLocalPath } from "@/lib/http/redirect"
import { upsertGoogleUser } from "@/lib/services/app-users"

const oauthCookieNames = [
  googleOAuthStateCookieName,
  googleOAuthVerifierCookieName,
  googleOAuthNonceCookieName,
  googleOAuthNextCookieName,
]

function loginError(error: string) {
  const response = redirectToLocalPath(
    `/dangnhap?error=${encodeURIComponent(error)}`
  )

  oauthCookieNames.forEach((name) => response.cookies.delete(name))
  return response
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error")
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const expectedState = request.cookies.get(googleOAuthStateCookieName)?.value
  const codeVerifier = request.cookies.get(googleOAuthVerifierCookieName)?.value
  const expectedNonce = request.cookies.get(googleOAuthNonceCookieName)?.value

  if (error || !code || !codeVerifier || !expectedNonce) {
    return loginError(error || "oauth_callback_invalid")
  }

  if (!safeCompareOAuthValue(expectedState, state)) {
    return loginError("oauth_state_invalid")
  }

  try {
    const redirectUri = getGoogleRedirectUri(request.url)
    const client = getGoogleOAuthClient(redirectUri)
    const { tokens } = await client.getToken({
      code,
      codeVerifier,
      redirect_uri: redirectUri,
    })

    if (!tokens.id_token) {
      return loginError("oauth_identity_missing")
    }

    const ticket = await client.verifyIdToken({
      audience: process.env.GOOGLE_CLIENT_ID?.trim(),
      idToken: tokens.id_token,
    })
    const payload = ticket.getPayload()

    if (
      !payload?.sub ||
      !payload.email ||
      !payload.email_verified ||
      !safeCompareOAuthValue(expectedNonce, payload.nonce ?? null)
    ) {
      return loginError("oauth_identity_invalid")
    }

    const user = await upsertGoogleUser({
      avatarUrl: payload.picture ?? "",
      displayName: payload.name?.trim() || payload.email.split("@")[0],
      email: payload.email,
      subject: payload.sub,
    })

    if (!user || user.status !== "active") {
      return loginError("account_suspended")
    }

    await createUserSession(user.id)

    const nextPath = sanitizeAccountReturnPath(
      request.cookies.get(googleOAuthNextCookieName)?.value
    )
    const response = redirectToLocalPath(nextPath)
    oauthCookieNames.forEach((name) => response.cookies.delete(name))

    return response
  } catch {
    return loginError("oauth_failed")
  }
}

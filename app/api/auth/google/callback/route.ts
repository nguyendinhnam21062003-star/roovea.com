import { NextRequest, NextResponse } from "next/server"

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
import { upsertGoogleUser } from "@/lib/services/app-users"

const oauthCookieNames = [
  googleOAuthStateCookieName,
  googleOAuthVerifierCookieName,
  googleOAuthNonceCookieName,
  googleOAuthNextCookieName,
]

function loginError(request: NextRequest, error: string) {
  const response = NextResponse.redirect(
    new URL(`/dangnhap?error=${encodeURIComponent(error)}`, request.url)
  )

  oauthCookieNames.forEach((name) => response.cookies.delete(name))
  return response
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error")
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const expectedState = request.cookies.get(googleOAuthStateCookieName)?.value
  const codeVerifier = request.cookies.get(
    googleOAuthVerifierCookieName
  )?.value
  const expectedNonce = request.cookies.get(
    googleOAuthNonceCookieName
  )?.value

  if (error || !code || !codeVerifier || !expectedNonce) {
    return loginError(request, error || "oauth_callback_invalid")
  }

  if (!safeCompareOAuthValue(expectedState, state)) {
    return loginError(request, "oauth_state_invalid")
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
      return loginError(request, "oauth_identity_missing")
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
      return loginError(request, "oauth_identity_invalid")
    }

    const user = await upsertGoogleUser({
      avatarUrl: payload.picture ?? "",
      displayName: payload.name?.trim() || payload.email.split("@")[0],
      email: payload.email,
      subject: payload.sub,
    })

    if (!user || user.status !== "active") {
      return loginError(request, "account_suspended")
    }

    await createUserSession(user.id)

    const nextPath = sanitizeAccountReturnPath(
      request.cookies.get(googleOAuthNextCookieName)?.value
    )
    const response = NextResponse.redirect(new URL(nextPath, request.url))
    oauthCookieNames.forEach((name) => response.cookies.delete(name))

    return response
  } catch {
    return loginError(request, "oauth_failed")
  }
}

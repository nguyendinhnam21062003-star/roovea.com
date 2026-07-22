import { NextRequest, NextResponse } from "next/server"
import { CodeChallengeMethod } from "google-auth-library"

import {
  createOAuthSecret,
  getGoogleOAuthClient,
  getGoogleRedirectUri,
  googleOAuthCookieMaxAgeSeconds,
  googleOAuthNextCookieName,
  googleOAuthNonceCookieName,
  googleOAuthStateCookieName,
  googleOAuthVerifierCookieName,
  isGoogleOAuthConfigured,
  sanitizeAccountReturnPath,
} from "@/lib/auth/google"
import { redirectToLocalPath } from "@/lib/http/redirect"

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return redirectToLocalPath("/dangnhap?error=oauth_not_configured")
  }

  const redirectUri = getGoogleRedirectUri(request.url)
  const client = getGoogleOAuthClient(redirectUri)
  const state = createOAuthSecret()
  const nonce = createOAuthSecret()
  const { codeVerifier, codeChallenge } =
    await client.generateCodeVerifierAsync()
  const nextPath = sanitizeAccountReturnPath(
    request.nextUrl.searchParams.get("next")
  )
  const authorizationUrl = client.generateAuthUrl({
    access_type: "online",
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    include_granted_scopes: true,
    nonce,
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  })
  const response = NextResponse.redirect(authorizationUrl)
  const cookieOptions = {
    httpOnly: true,
    maxAge: googleOAuthCookieMaxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  }

  response.cookies.set(googleOAuthStateCookieName, state, cookieOptions)
  response.cookies.set(
    googleOAuthVerifierCookieName,
    codeVerifier,
    cookieOptions
  )
  response.cookies.set(googleOAuthNonceCookieName, nonce, cookieOptions)
  response.cookies.set(googleOAuthNextCookieName, nextPath, cookieOptions)

  return response
}

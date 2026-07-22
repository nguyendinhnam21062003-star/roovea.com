import { NextResponse } from "next/server"

function assertLocalPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Local redirects must use an absolute path.")
  }
}

export function redirectToLocalPath(path: string, status = 307) {
  assertLocalPath(path)

  return new NextResponse(null, {
    status,
    headers: {
      location: path,
    },
  })
}

export function getPublicAppUrl(path: string, fallbackBaseUrl: string) {
  assertLocalPath(path)

  return new URL(path, process.env.APP_URL?.trim() || fallbackBaseUrl)
}

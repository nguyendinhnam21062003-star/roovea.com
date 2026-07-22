import { clearUserSession } from "@/lib/auth/user-session"
import { redirectToLocalPath } from "@/lib/http/redirect"

export async function POST() {
  await clearUserSession()

  return redirectToLocalPath("/", 303)
}

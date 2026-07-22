import Link from "next/link"
import { redirect } from "next/navigation"
import { GoogleLogoIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import {
  isGoogleOAuthConfigured,
  sanitizeAccountReturnPath,
} from "@/lib/auth/google"
import { getUserSession } from "@/lib/auth/user-session"

const errorMessages: Record<string, string> = {
  account_suspended: "Tài khoản đang tạm ngừng. Vui lòng liên hệ Roovea.",
  oauth_callback_invalid: "Google không trả về đầy đủ thông tin đăng nhập.",
  oauth_failed: "Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.",
  oauth_identity_invalid: "Không thể xác minh danh tính Google.",
  oauth_identity_missing: "Google không trả về thông tin nhận dạng.",
  oauth_not_configured: "Google OAuth chưa được cấu hình trên môi trường này.",
  oauth_state_invalid: "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const session = await getUserSession()
  const params = await searchParams
  const nextPath = sanitizeAccountReturnPath(params.next)

  if (session) redirect(nextPath)

  const configured = isGoogleOAuthConfigured()
  const errorMessage = params.error ? errorMessages[params.error] : ""

  return (
    <div className="min-h-svh bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-lg items-center px-4 py-12 sm:px-6">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center border bg-background">
              <ShieldCheckIcon aria-hidden />
            </div>
            <CardTitle className="text-2xl">Đăng nhập Roovea</CardTitle>
            <CardDescription>
              Dùng tài khoản Google để đăng và quản lý phòng trọ của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {errorMessage ? (
              <Alert>
                <AlertTitle>Không thể đăng nhập</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}
            {!configured ? (
              <Alert>
                <AlertTitle>Chưa có cấu hình Google OAuth</AlertTitle>
                <AlertDescription>
                  Thêm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET và
                  GOOGLE_REDIRECT_URI để bật đăng nhập.
                </AlertDescription>
              </Alert>
            ) : null}
            {configured ? (
              <Button asChild size="lg">
                <a
                  href={`/api/auth/google/start?next=${encodeURIComponent(nextPath)}`}
                >
                  <GoogleLogoIcon data-icon="inline-start" />
                  Tiếp tục với Google
                </a>
              </Button>
            ) : (
              <Button type="button" size="lg" disabled>
                <GoogleLogoIcon data-icon="inline-start" />
                Tiếp tục với Google
              </Button>
            )}
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Thông tin liên hệ của chủ nhà chỉ hiển thị với admin. Khách thuê
              luôn liên hệ qua Roovea.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/login">Đăng nhập dành cho admin</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

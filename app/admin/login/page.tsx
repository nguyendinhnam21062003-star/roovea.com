import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const params = await searchParams

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex size-10 items-center justify-center border bg-background">
            <LockKeyIcon className="size-5 text-primary" />
          </div>
          <CardTitle>Đăng nhập Roovea Admin</CardTitle>
          <CardDescription>
            Toàn bộ trang quản trị và admin API yêu cầu session server-side.
          </CardDescription>
          {process.env.NODE_ENV !== "production" ? (
            <CardDescription>
              Dev mặc định: admin@roovea.local / admin123.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <form
            action="/api/admin/login"
            method="post"
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="next" value={params.next ?? ""} />
            {params.error ? (
              <Alert variant="destructive">
                <AlertTitle>Không thể đăng nhập</AlertTitle>
                <AlertDescription>
                  Email hoặc mật khẩu admin chưa đúng.
                </AlertDescription>
              </Alert>
            ) : null}
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="admin-email">Email admin</FieldLabel>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-password">Mật khẩu</FieldLabel>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit">Đăng nhập</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

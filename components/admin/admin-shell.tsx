"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BuildingsIcon,
  ChatCircleTextIcon,
  HouseLineIcon,
  SidebarSimpleIcon,
  SignOutIcon,
} from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAdminStore } from "@/lib/admin/store"
import { cn } from "@/lib/utils"

const adminNavItems = [
  {
    label: "Phòng",
    href: "/admin/rooms",
    icon: HouseLineIcon,
  },
  {
    label: "Nhà cung cấp/Đối tác",
    href: "/admin/suppliers",
    icon: BuildingsIcon,
  },
  {
    label: "Tin nhắn",
    href: "/admin/messages",
    icon: ChatCircleTextIcon,
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { databaseMessage, databaseReady, unreadInquiryCount } = useAdminStore()

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/admin/login"
  }

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-muted/30 text-foreground">
        <div className="grid min-h-svh lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b bg-background lg:border-r lg:border-b-0">
            <div className="flex min-h-14 items-center justify-between gap-2 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarSimpleIcon aria-hidden />
                <Link
                  href="/admin/rooms"
                  className="truncate font-heading font-semibold"
                >
                  Roovea Admin
                </Link>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Đăng xuất"
                onClick={logout}
              >
                <SignOutIcon />
              </Button>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className={cn("justify-start", active && "font-semibold")}
                  >
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                      {item.href === "/admin/messages" &&
                      unreadInquiryCount > 0 ? (
                        <Badge variant="secondary" className="ml-auto">
                          {unreadInquiryCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </Button>
                )
              })}
            </nav>
          </aside>
          <main className="min-w-0">
            {!databaseReady ? (
              <div className="p-4 pb-0 sm:p-6 sm:pb-0">
                <Alert>
                  <AlertTitle>Database chưa sẵn sàng</AlertTitle>
                  <AlertDescription>
                    {databaseMessage ??
                      "Giao diện đang hiển thị dữ liệu demo. Chạy Postgres, migration và seed để lưu dữ liệu thật."}
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

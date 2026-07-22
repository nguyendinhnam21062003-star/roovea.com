"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HouseLineIcon,
  IdentificationCardIcon,
  SignOutIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const items = [
  { href: "/taikhoan/tindang", label: "Tin đăng", icon: HouseLineIcon },
  { href: "/taikhoan/hoso", label: "Hồ sơ", icon: IdentificationCardIcon },
]

export function AccountNav({
  displayName,
  isVerified,
}: {
  displayName: string
  isVerified: boolean
}) {
  const pathname = usePathname()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mr-auto flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{displayName}</span>
          {isVerified ? <Badge>Đã xác minh</Badge> : null}
        </div>
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              asChild
              variant={active ? "secondary" : "ghost"}
              size="sm"
              className={cn(active && "font-semibold")}
            >
              <Link href={item.href}>
                <Icon data-icon="inline-start" />
                {item.label}
              </Link>
            </Button>
          )
        })}
        <Button type="button" variant="ghost" size="sm" onClick={logout}>
          <SignOutIcon data-icon="inline-start" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}

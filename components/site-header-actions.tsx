"use client"

import Link from "next/link"
import {
  CheckCircleIcon,
  ListIcon,
  SignInIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react"

import { ContactActions } from "@/components/contact-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { siteNavItems } from "@/lib/site-nav"

type HeaderUser = {
  displayName: string
  email: string
  isVerified: boolean
} | null

export function SiteHeaderActions({ user }: { user: HeaderUser }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  const accountMenu = user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-48">
          <UserCircleIcon data-icon="inline-start" />
          <span className="truncate">{user.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="truncate">{user.displayName}</span>
            {user.isVerified ? (
              <CheckCircleIcon className="shrink-0 text-blue-600" weight="fill" />
            ) : null}
          </span>
          <span className="truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/taikhoan/tindang">Quản lý tin đăng</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/taikhoan/hoso">Hồ sơ liên hệ</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <SignOutIcon />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button asChild variant="outline" size="sm">
      <Link href="/dangnhap">
        <SignInIcon data-icon="inline-start" />
        Đăng nhập
      </Link>
    </Button>
  )

  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="hidden items-center gap-2 lg:flex">
        <ContactActions label="Tư vấn nhanh" triggerClassName="h-7" />
        {accountMenu}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Mở menu"
          >
            <ListIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Menu Roovea</SheetTitle>
            <SheetDescription>
              Tìm phòng và quản lý tài khoản của bạn.
            </SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {siteNavItems.map((item) => (
              <SheetClose key={item.href} asChild>
                <Button asChild variant="ghost" className="justify-start">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </SheetClose>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 border-t p-4">
            {user ? (
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <span className="truncate">{user.displayName}</span>
                  {user.isVerified ? (
                    <Badge variant="secondary" className="text-blue-600">
                      <CheckCircleIcon weight="fill" />
                      Đã xác minh
                    </Badge>
                  ) : null}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                <div className="mt-2 grid gap-1">
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/taikhoan/tindang">Quản lý tin đăng</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/taikhoan/hoso">Hồ sơ liên hệ</Link>
                    </Button>
                  </SheetClose>
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-start"
                    onClick={logout}
                  >
                    <SignOutIcon data-icon="inline-start" />
                    Đăng xuất
                  </Button>
                </div>
              </div>
            ) : (
              <SheetClose asChild>
                <Button asChild variant="outline">
                  <Link href="/dangnhap">
                    <SignInIcon data-icon="inline-start" />
                    Đăng nhập
                  </Link>
                </Button>
              </SheetClose>
            )}
            <ContactActions label="Tư vấn nhanh" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  HouseLineIcon,
  IdentificationCardIcon,
  ListIcon,
  SignInIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react"

import { ContactActions } from "@/components/contact-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
              <CheckCircleIcon
                className="shrink-0 text-primary"
                weight="fill"
              />
            ) : null}
          </span>
          <span className="truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/taikhoan/tindang">Quản lý tin đăng</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/taikhoan/hoso">Hồ sơ liên hệ</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={logout}>
            <SignOutIcon />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
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

      <ContactActions
        className="lg:hidden"
        label="Tư vấn nhanh"
        triggerClassName="h-7 px-2"
      />

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
        <SheetContent side="right" className="w-[min(90vw,360px)]!">
          <SheetHeader>
            <SheetTitle>Menu Roovea</SheetTitle>
            <SheetDescription>
              Khám phá chỗ ở và quản lý tài khoản của bạn.
            </SheetDescription>
          </SheetHeader>
          <Separator />

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
            {user ? (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex min-w-0 items-center gap-2">
                    <UserCircleIcon className="size-5 shrink-0 text-primary" />
                    <span className="truncate">{user.displayName}</span>
                  </CardTitle>
                  <CardDescription className="truncate">
                    {user.email}
                  </CardDescription>
                  {user.isVerified ? (
                    <CardAction>
                      <Badge variant="secondary">
                        <CheckCircleIcon weight="fill" />
                        Đã xác minh
                      </Badge>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardContent className="grid gap-2">
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Link href="/taikhoan/tindang">
                        <HouseLineIcon data-icon="inline-start" />
                        Quản lý tin đăng
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Link href="/taikhoan/hoso">
                        <IdentificationCardIcon data-icon="inline-start" />
                        Hồ sơ liên hệ
                      </Link>
                    </Button>
                  </SheetClose>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={logout}
                  >
                    <SignOutIcon data-icon="inline-start" />
                    Đăng xuất
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <SheetClose asChild>
                <Button asChild>
                  <Link href="/dangnhap">
                    <SignInIcon data-icon="inline-start" />
                    Đăng nhập
                  </Link>
                </Button>
              </SheetClose>
            )}

            <div className="order-first flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Khám phá Roovea
              </p>
              <nav className="grid gap-2">
                {siteNavItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-between"
                    >
                      <Link href={item.href}>
                        {item.label}
                        <ArrowRightIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>
            </div>
          </div>

          <Separator />
          <SheetFooter>
            <p className="text-xs text-muted-foreground">
              Bạn cần Roovea hỗ trợ chọn phòng?
            </p>
            <ContactActions
              className="w-full [&>button]:w-full"
              label="Tư vấn nhanh"
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

import Image from "next/image"
import Link from "next/link"

import { ContactActions } from "@/components/contact-actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Tìm phòng", href: "/#tim-phong" },
  { label: "Tour du lịch", href: "/#lien-he" },
  { label: "Vé máy bay", href: "/#lien-he" },
  { label: "Hướng dẫn viên", href: "/#lien-he" },
  { label: "Đối tác", href: "/#lien-he" },
]

type SiteHeaderProps = {
  className?: string
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn("sticky top-0 z-40 border-b bg-background", className)}
    >
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-base font-semibold"
        >
          <Image
            src="/brand/roovea-logo.png"
            alt="Roovea"
            width={32}
            height={32}
            className="size-8 border object-cover"
          />
          <span>Roovea</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Button
              key={item.href + item.label}
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <ContactActions
          className="ml-auto hidden sm:flex"
          label="Tư vấn nhanh"
          triggerClassName="h-7"
        />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:hidden">
        {navItems.map((item) => (
          <Button
            key={item.href + item.label}
            asChild
            variant="ghost"
            size="sm"
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
    </header>
  )
}

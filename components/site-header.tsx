import Link from "next/link"
import { PhoneCallIcon } from "@phosphor-icons/react/dist/ssr"

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
      className={cn(
        "sticky top-0 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70",
        className
      )}
    >
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-base font-semibold">
          Roovea.com
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
        <div className="ml-auto hidden sm:block">
          <Button asChild size="sm">
            <a href="tel:+84901234567">
              <PhoneCallIcon data-icon="inline-start" />
              Tư vấn nhanh
            </a>
          </Button>
        </div>
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

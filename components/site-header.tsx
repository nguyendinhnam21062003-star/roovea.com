import Image from "next/image"
import Link from "next/link"

import { SiteHeaderActions } from "@/components/site-header-actions"
import { Button } from "@/components/ui/button"
import { getUserSession } from "@/lib/auth/user-session"
import { siteNavItems } from "@/lib/site-nav"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  className?: string
}

export async function SiteHeader({ className }: SiteHeaderProps) {
  const session = await getUserSession()

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
          {siteNavItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <SiteHeaderActions
          user={
            session
              ? {
                  displayName: session.user.displayName,
                  email: session.user.email,
                  isVerified: session.user.isVerified,
                }
              : null
          }
        />
      </div>
    </header>
  )
}

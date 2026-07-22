import { AccountNav } from "@/components/account/account-nav"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { requireUserSession } from "@/lib/auth/user-session"

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireUserSession()

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <AccountNav
        displayName={session.user.displayName}
        isVerified={session.user.isVerified}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

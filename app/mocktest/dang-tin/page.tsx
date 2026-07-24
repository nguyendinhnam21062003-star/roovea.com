import type { Metadata } from "next"

import { UnifiedListingForm } from "@/components/listings/unified-listing-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Xem trước form đăng tin | Roovea",
  description: "Xem trước form đăng tin thống nhất.",
}

export default function UnifiedListingFormPreviewPage() {
  return (
    <main className="min-h-svh bg-muted/20">
      <SiteHeader />
      <UnifiedListingForm actorMode="owner" />
      <SiteFooter />
    </main>
  )
}

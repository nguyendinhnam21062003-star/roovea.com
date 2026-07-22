import type { Metadata } from "next"
import { DM_Sans, Geist_Mono, Roboto } from "next/font/google"

import "./globals.css"
import { ContactSettingsProvider } from "@/components/contact-settings-provider"
import { Toaster } from "@/components/ui/sonner"
import { getPublicContactChannels } from "@/lib/services/contact-channels"
import { cn } from "@/lib/utils"

const robotoHeading = Roboto({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
})

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Roovea.com | Tìm phòng trọ và nơi lưu trú",
  description:
    "Roovea.com giúp khách tìm phòng trọ tại TP.HCM, nơi lưu trú du lịch và liên hệ tư vấn trực tiếp.",
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const contactChannels = await getPublicContactChannels()

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        fontMono.variable,
        dmSans.variable,
        robotoHeading.variable
      )}
    >
      <body suppressHydrationWarning>
        <ContactSettingsProvider channels={contactChannels}>
          {children}
          <Toaster />
        </ContactSettingsProvider>
      </body>
    </html>
  )
}

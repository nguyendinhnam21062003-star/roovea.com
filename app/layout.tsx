import type { Metadata } from "next"
import { DM_Sans, Geist_Mono, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
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
  title: "Roovea.com | Tìm nơi lưu trú",
  description:
    "Roovea.com giúp khách tìm nơi lưu trú, xem phòng nhanh và liên hệ tư vấn trực tiếp.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

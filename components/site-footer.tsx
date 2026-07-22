"use client"

import Image from "next/image"
import Link from "next/link"

import { useContactChannels } from "@/components/contact-settings-provider"
import { Separator } from "@/components/ui/separator"
import { buildContactChannelHref } from "@/lib/contact"

export function SiteFooter() {
  const channels = useContactChannels()
  const phoneChannel =
    channels.find((channel) => channel.type === "phone") ?? channels[0]
  const emailChannel = channels.find((channel) => channel.type === "email")

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex w-fit items-center gap-2 font-heading text-base font-semibold"
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
            <p className="max-w-md text-sm text-muted-foreground">
              Roovea hỗ trợ tìm phòng trọ và nơi lưu trú phù hợp, ưu tiên thông
              tin rõ ràng và tư vấn trực tiếp trong quá trình kết nối.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">Dịch vụ</p>
            <Link href="/timphongtro" className="text-muted-foreground">
              Tìm phòng trọ
            </Link>
            <Link href="/timhomestay" className="text-muted-foreground">
              Tìm homestay
            </Link>
            <Link href="/doitac" className="text-muted-foreground">
              Đối tác
            </Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">Liên hệ</p>
            {phoneChannel ? (
              <a
                href={buildContactChannelHref(phoneChannel)}
                className="text-muted-foreground"
                target={phoneChannel.external ? "_blank" : undefined}
                rel={phoneChannel.external ? "noreferrer" : undefined}
              >
                {phoneChannel.content}
              </a>
            ) : null}
            {emailChannel ? (
              <a
                href={buildContactChannelHref(emailChannel)}
                className="text-muted-foreground"
                target={emailChannel.external ? "_blank" : undefined}
                rel={emailChannel.external ? "noreferrer" : undefined}
              >
                {emailChannel.content}
              </a>
            ) : null}
          </div>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">© 2026 Roovea.com</p>
      </div>
    </footer>
  )
}

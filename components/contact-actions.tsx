"use client"

import { useState } from "react"
import {
  ChatCircleTextIcon,
  CopyIcon,
  FacebookLogoIcon,
  PhoneCallIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const contact = {
  email: "hello@roovea.com",
  phone: "0901 234 567",
  phoneHref: "tel:+84901234567",
  zaloUrl: "https://zalo.me/84901234567",
  fanpageUrl: "https://facebook.com/roovea",
  whatsappBaseUrl: "https://wa.me/84901234567",
}

type ContactActionsProps = {
  className?: string
  roomCode?: string
}

export function ContactActions({ className, roomCode }: ContactActionsProps) {
  const [copied, setCopied] = useState(false)
  const whatsappText = roomCode
    ? `Tôi muốn hỏi thêm về phòng mã ${roomCode} trên Roovea.`
    : "Tôi muốn được Roovea tư vấn nơi lưu trú phù hợp."
  const whatsappUrl = `${contact.whatsappBaseUrl}?text=${encodeURIComponent(
    whatsappText
  )}`

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button asChild>
        <a href={contact.zaloUrl} target="_blank" rel="noreferrer">
          <ChatCircleTextIcon data-icon="inline-start" />
          Chuyển sang Zalo
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={contact.fanpageUrl} target="_blank" rel="noreferrer">
          <FacebookLogoIcon data-icon="inline-start" />
          Chuyển sang fanpage
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={contact.phoneHref}>
          <PhoneCallIcon data-icon="inline-start" />
          Gọi {contact.phone}
        </a>
      </Button>
      <Button type="button" variant="outline" onClick={copyEmail}>
        <CopyIcon data-icon="inline-start" />
        {copied ? "Đã copy email" : "Copy email"}
      </Button>
      <Button asChild variant="outline">
        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          <WhatsappLogoIcon data-icon="inline-start" />
          Chuyển sang Whatsapp
        </a>
      </Button>
    </div>
  )
}

"use client"

import type { ComponentProps, ReactNode } from "react"
import Image from "next/image"
import {
  ChatCircleTextIcon,
  EnvelopeIcon,
  type Icon,
  PhoneCallIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { contactConfig, getWhatsappHref } from "@/lib/contact"
import { cn } from "@/lib/utils"

type ContactActionsProps = {
  className?: string
  label?: string
  roomCode?: string
  triggerClassName?: string
  variant?: ComponentProps<typeof Button>["variant"]
}

type ContactDrawerProps = ContactActionsProps & {
  children?: ReactNode
}

type ContactItem = {
  content: string
  external?: boolean
  href: string
  icon?: Icon
  label: string
  logo?: {
    alt: string
    src: string
  }
}

function getContactItems(roomCode?: string): ContactItem[] {
  return [
    {
      content: contactConfig.phone,
      external: true,
      href: contactConfig.zaloUrl,
      label: "Nhắn tin qua Zalo",
      logo: {
        alt: "Zalo",
        src: "/contact/zalo-logo.png",
      },
    },
    {
      content: contactConfig.fanpageLabel,
      external: true,
      href: contactConfig.fanpageUrl,
      label: "Nhắn tin qua Fanpage Facebook",
      logo: {
        alt: "Facebook",
        src: "/contact/facebook-logo.png",
      },
    },
    {
      content: contactConfig.phone,
      href: contactConfig.phoneHref,
      icon: PhoneCallIcon,
      label: "Gọi điện",
    },
    {
      content: contactConfig.phone,
      external: true,
      href: getWhatsappHref(roomCode),
      icon: WhatsappLogoIcon,
      label: "Nhắn tin qua WhatsApp",
    },
    {
      content: contactConfig.email,
      href: `mailto:${contactConfig.email}`,
      icon: EnvelopeIcon,
      label: "Gửi email",
    },
  ]
}

export function ContactDrawer({
  children,
  label = "Liên hệ để đặt phòng",
  roomCode,
  triggerClassName,
  variant = "default",
}: ContactDrawerProps) {
  const items = getContactItems(roomCode)

  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        {children ?? (
          <Button type="button" variant={variant} className={triggerClassName}>
            <ChatCircleTextIcon data-icon="inline-start" />
            {label}
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="mx-auto w-full max-w-xl">
        <DrawerHeader>
          <DrawerTitle>Liên hệ Roovea</DrawerTitle>
          <DrawerDescription>
            Chọn kênh tư vấn phù hợp. Roovea sẽ hỗ trợ theo mã phòng và nhu cầu
            lưu trú của bạn.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <Button
                key={item.label}
                asChild
                variant="outline"
                className="h-auto justify-start py-3"
              >
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  {item.logo ? (
                    <span className="relative size-4 shrink-0">
                      <Image
                        src={item.logo.src}
                        alt={item.logo.alt}
                        fill
                        className="object-contain"
                        sizes="16px"
                      />
                    </span>
                  ) : Icon ? (
                    <Icon data-icon="inline-start" />
                  ) : null}
                  <span className="flex min-w-0 flex-col items-start gap-0.5">
                    <span>{item.label}</span>
                    <span className="max-w-full truncate text-muted-foreground">
                      {item.content}
                    </span>
                  </span>
                </a>
              </Button>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function ContactActions({
  className,
  label,
  roomCode,
  triggerClassName,
  variant,
}: ContactActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <ContactDrawer
        label={label}
        roomCode={roomCode}
        triggerClassName={triggerClassName}
        variant={variant}
      />
    </div>
  )
}

export { ContactDrawer as ContactSheet }

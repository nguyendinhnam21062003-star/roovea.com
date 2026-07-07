"use client"

import type { ComponentProps, ReactNode } from "react"
import Image from "next/image"
import {
  ChatCircleTextIcon,
  EnvelopeIcon,
  type Icon,
  MessengerLogoIcon,
  PhoneCallIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react"

import { useContactChannels } from "@/components/contact-settings-provider"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  buildContactChannelHref,
  type ContactChannel,
  type ContactChannelType,
} from "@/lib/contact"
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

const contactTypeIcons: Record<ContactChannelType, Icon> = {
  custom: ChatCircleTextIcon,
  email: EnvelopeIcon,
  facebook: MessengerLogoIcon,
  phone: PhoneCallIcon,
  whatsapp: WhatsappLogoIcon,
  zalo: ChatCircleTextIcon,
}

function ContactIcon({ channel }: { channel: ContactChannel }) {
  if (channel.logoSrc) {
    return (
      <span className="relative size-4 shrink-0">
        <Image
          src={channel.logoSrc}
          alt={channel.logoAlt || channel.label}
          fill
          className="object-contain"
          sizes="16px"
        />
      </span>
    )
  }

  const Icon = contactTypeIcons[channel.type]

  return <Icon data-icon="inline-start" />
}

export function ContactDrawer({
  children,
  label = "Liên hệ để đặt phòng",
  roomCode,
  triggerClassName,
  variant = "default",
}: ContactDrawerProps) {
  const channels = useContactChannels()

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
            Chọn kênh tư vấn phù hợp. Roovea sẽ hỗ trợ theo nhu cầu
          của bạn.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
          <div className="flex flex-col gap-2">
            {channels.map((channel) => (
              <Button
                key={channel.id}
                asChild
                variant="outline"
                className="h-auto justify-start py-3"
              >
                <a
                  href={buildContactChannelHref(channel, roomCode)}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                >
                  <ContactIcon channel={channel} />
                  <span className="flex min-w-0 flex-col items-start gap-0.5">
                    <span>{channel.label}</span>
                    <span className="max-w-full truncate text-muted-foreground">
                      {channel.content}
                    </span>
                  </span>
                </a>
              </Button>
            ))}
          </div>
        </ScrollArea>
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

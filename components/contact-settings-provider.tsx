"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import {
  defaultContactChannels,
  getPrimaryContactChannels,
  type ContactChannel,
} from "@/lib/contact"

const ContactSettingsContext = createContext<ContactChannel[]>(
  defaultContactChannels
)

export function ContactSettingsProvider({
  children,
  channels,
}: {
  children: ReactNode
  channels: ContactChannel[]
}) {
  const enabledChannels = useMemo(
    () =>
      getPrimaryContactChannels(
        channels.length ? channels : defaultContactChannels
      ),
    [channels]
  )

  return (
    <ContactSettingsContext.Provider value={enabledChannels}>
      {children}
    </ContactSettingsContext.Provider>
  )
}

export function useContactChannels() {
  return useContext(ContactSettingsContext)
}

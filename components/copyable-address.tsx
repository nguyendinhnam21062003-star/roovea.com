"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon, MapPinIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

type CopyableAddressProps = {
  address: string
  className?: string
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand("copy")
  } finally {
    document.body.removeChild(textarea)
  }
}

export function CopyableAddress({ address, className }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false)

  async function copyAddress() {
    try {
      const copiedAddress = await writeClipboardText(address)

      if (!copiedAddress) {
        throw new Error("Clipboard copy failed")
      }

      setCopied(true)
      toast.success("Đã sao chép địa chỉ")
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.info("Bạn có thể chọn và sao chép địa chỉ thủ công.")
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-2 border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
      onClick={copyAddress}
    >
      <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-muted-foreground">{address}</span>
      {copied ? (
        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
      ) : (
        <CopyIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}

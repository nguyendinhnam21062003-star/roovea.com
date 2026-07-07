"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FloppyDiskIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAdminStore } from "@/lib/admin/store"
import { makeId } from "@/lib/admin/helpers"
import type { ContactChannel, ContactChannelType } from "@/lib/contact"

const channelTypeOptions: Array<{
  label: string
  value: ContactChannelType
}> = [
  { label: "Zalo", value: "zalo" },
  { label: "Facebook", value: "facebook" },
  { label: "Điện thoại", value: "phone" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Email", value: "email" },
  { label: "Tùy chỉnh", value: "custom" },
]

const channelTypeLabels = Object.fromEntries(
  channelTypeOptions.map((option) => [option.value, option.label])
) as Record<ContactChannelType, string>

function createContactChannel(sortOrder: number): ContactChannel {
  return {
    id: makeId("contact"),
    type: "custom",
    label: "Kênh liên hệ mới",
    content: "",
    href: "",
    external: true,
    enabled: true,
    sortOrder,
    logoSrc: "",
    logoAlt: "",
    appendRoomMessage: false,
  }
}

export function AdminContactsPage() {
  const {
    contactChannels,
    databaseMessage,
    databaseReady,
    updateContactChannels,
  } = useAdminStore()
  const [draft, setDraft] = useState(contactChannels)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState("")
  const enabledCount = useMemo(
    () => draft.filter((channel) => channel.enabled).length,
    [draft]
  )

  function patchChannel(id: string, patch: Partial<ContactChannel>) {
    setDraft((current) =>
      current.map((channel) =>
        channel.id === id ? { ...channel, ...patch } : channel
      )
    )
    setNotice("")
  }

  function addChannel() {
    setDraft((current) => [...current, createContactChannel(current.length)])
    setNotice("")
  }

  function deleteChannel(id: string) {
    setDraft((current) =>
      current
        .filter((channel) => channel.id !== id)
        .map((channel, index) => ({ ...channel, sortOrder: index }))
    )
    setNotice("")
  }

  function moveChannel(id: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.findIndex((channel) => channel.id === id)
      const nextIndex = index + direction

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)

      return next.map((channel, sortOrder) => ({ ...channel, sortOrder }))
    })
    setNotice("")
  }

  async function saveContacts() {
    if (!databaseReady) {
      setNotice(
        databaseMessage ??
          "Database PostgreSQL chưa sẵn sàng nên chưa thể lưu thông tin liên hệ."
      )
      return
    }

    setSaving(true)
    setNotice("")

    try {
      const saved = await updateContactChannels(
        draft.map((channel, sortOrder) => ({
          ...channel,
          sortOrder,
        }))
      )

      setDraft(saved)
      setNotice("Đã lưu thông tin liên hệ.")
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Không thể lưu thông tin liên hệ."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            Cấu hình website
          </Badge>
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              Thông tin liên hệ
            </h1>
            <p className="text-sm text-muted-foreground">
              Thêm, sửa, sắp xếp và bật/tắt các kênh liên hệ hiện trong popup tư
              vấn.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addChannel}>
            <PlusIcon data-icon="inline-start" />
            Thêm kênh
          </Button>
          <Button
            type="button"
            disabled={saving || !databaseReady}
            onClick={saveContacts}
          >
            <FloppyDiskIcon data-icon="inline-start" />
            {saving ? "Đang lưu" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      {!databaseReady ? (
        <Alert>
          <AlertTitle>Chưa thể lưu contact</AlertTitle>
          <AlertDescription>
            {databaseMessage ??
              "Database PostgreSQL chưa sẵn sàng. Cần kết nối DB, chạy migration rồi tải lại trang admin."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan</CardTitle>
          <CardDescription>
            {enabledCount}/{draft.length} kênh đang bật. Các kênh được hiển thị
            theo thứ tự từ trên xuống.
          </CardDescription>
        </CardHeader>
      </Card>

      {notice ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {notice}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {draft.map((channel, index) => (
          <Card key={channel.id}>
            <CardHeader>
              <CardTitle>{channel.label || "Kênh liên hệ"}</CardTitle>
              <CardDescription>
                {channelTypeLabels[channel.type]} · Thứ tự {index + 1}
              </CardDescription>
              <CardAction>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Đưa lên"
                    disabled={index === 0}
                    onClick={() => moveChannel(channel.id, -1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Đưa xuống"
                    disabled={index === draft.length - 1}
                    onClick={() => moveChannel(channel.id, 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Xóa kênh"
                    onClick={() => deleteChannel(channel.id)}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`${channel.id}-type`}>
                      Loại liên hệ
                    </FieldLabel>
                    <Select
                      value={channel.type}
                      onValueChange={(value) =>
                        patchChannel(channel.id, {
                          type: value as ContactChannelType,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`${channel.id}-type`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {channelTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${channel.id}-label`}>
                      Tên hiển thị
                    </FieldLabel>
                    <Input
                      id={`${channel.id}-label`}
                      value={channel.label}
                      onChange={(event) =>
                        patchChannel(channel.id, { label: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`${channel.id}-content`}>
                      Nội dung hiển thị
                    </FieldLabel>
                    <Input
                      id={`${channel.id}-content`}
                      value={channel.content}
                      placeholder="0901 234 567, hello@..., facebook.com/..."
                      onChange={(event) =>
                        patchChannel(channel.id, {
                          content: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${channel.id}-href`}>
                      Link khi bấm
                    </FieldLabel>
                    <Input
                      id={`${channel.id}-href`}
                      value={channel.href}
                      placeholder="https://..., tel:+84..., mailto:..."
                      onChange={(event) =>
                        patchChannel(channel.id, { href: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`${channel.id}-logo-src`}>
                      Logo URL
                    </FieldLabel>
                    <Input
                      id={`${channel.id}-logo-src`}
                      value={channel.logoSrc}
                      placeholder="/contact/zalo-logo.png"
                      onChange={(event) =>
                        patchChannel(channel.id, {
                          logoSrc: event.target.value,
                        })
                      }
                    />
                    <FieldDescription>
                      Để trống để dùng icon theo loại liên hệ.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${channel.id}-logo-alt`}>
                      Mô tả logo
                    </FieldLabel>
                    <Input
                      id={`${channel.id}-logo-alt`}
                      value={channel.logoAlt}
                      onChange={(event) =>
                        patchChannel(channel.id, {
                          logoAlt: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field orientation="horizontal">
                    <Switch
                      checked={channel.enabled}
                      onCheckedChange={(enabled) =>
                        patchChannel(channel.id, { enabled })
                      }
                    />
                    <FieldLabel>Hiển thị</FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Switch
                      checked={channel.external}
                      onCheckedChange={(external) =>
                        patchChannel(channel.id, { external })
                      }
                    />
                    <FieldLabel>Mở tab mới</FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Switch
                      checked={channel.appendRoomMessage}
                      onCheckedChange={(appendRoomMessage) =>
                        patchChannel(channel.id, { appendRoomMessage })
                      }
                    />
                    <FieldLabel>Gắn mã phòng</FieldLabel>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import {
  ChatCircleTextIcon,
  MagnifyingGlassIcon,
  PhoneCallIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useAdminStore } from "@/lib/admin/store"
import { formatDate } from "@/lib/format"
import type { AdminInquiry } from "@/lib/services/inquiries"
import type { InquiryStatus } from "@/lib/validation/inquiry"

type FilterStatus = "all" | InquiryStatus
type FilterSource = "all" | AdminInquiry["source"]

const statusLabels: Record<InquiryStatus, string> = {
  closed: "Đã đóng",
  contacted: "Đã liên hệ",
  new: "Mới",
  read: "Đã đọc",
  spam: "Spam",
}

const sourceLabels: Record<AdminInquiry["source"], string> = {
  chat_widget_home: "Chat trang chủ",
  chat_widget_room: "Chat phòng",
  contact_drawer: "Contact drawer",
  other: "Khác",
}

export function AdminMessagesPage({
  initialInquiries,
}: {
  initialInquiries: AdminInquiry[]
}) {
  const { setUnreadInquiryCount } = useAdminStore()
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<FilterStatus>("all")
  const [source, setSource] = useState<FilterSource>("all")
  const [selectedId, setSelectedId] = useState("")
  const [noteDraft, setNoteDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState("")
  const selected = inquiries.find((item) => item.id === selectedId) ?? null

  const filteredInquiries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return inquiries.filter((item) => {
      const queryMatched =
        !normalizedQuery ||
        [
          item.customerName,
          item.phone,
          item.email,
          item.message,
          item.roomCode,
          item.roomName,
          item.provinceCity,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      const statusMatched = status === "all" || item.status === status
      const sourceMatched = source === "all" || item.source === source

      return queryMatched && statusMatched && sourceMatched
    })
  }, [inquiries, query, source, status])

  function openInquiry(inquiry: AdminInquiry) {
    setSelectedId(inquiry.id)
    setNoteDraft(inquiry.adminNote)
    setNotice("")

    if (inquiry.status === "new") {
      void saveInquiry(inquiry.id, { status: "read" }, false)
    }
  }

  async function saveInquiry(
    id: string,
    patch: Partial<Pick<AdminInquiry, "adminNote" | "status">>,
    showNotice = true
  ) {
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        body: JSON.stringify(patch),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể cập nhật tin nhắn.")
      }

      setInquiries((current) =>
        current.map((item) => (item.id === id ? payload.inquiry : item))
      )
      setUnreadInquiryCount(
        inquiries.filter((item) =>
          item.id === id
            ? payload.inquiry.status === "new"
            : item.status === "new"
        ).length
      )

      if (showNotice) {
        setNotice("Đã cập nhật tin nhắn.")
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể cập nhật.")
    } finally {
      setSaving(false)
    }
  }

  async function saveNote() {
    if (!selected) {
      return
    }

    await saveInquiry(selected.id, { adminNote: noteDraft })
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">Tin nhắn khách</h1>
        <p className="text-sm text-muted-foreground">
          {filteredInquiries.length} tin nhắn theo bộ lọc hiện tại trên tổng{" "}
          {inquiries.length} tin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_190px] lg:items-end">
            <Field>
              <FieldLabel htmlFor="message-search">Tìm kiếm</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="message-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên, số điện thoại, nội dung, mã phòng"
                />
                <InputGroupAddon>
                  <MagnifyingGlassIcon />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="message-status">Trạng thái</FieldLabel>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as FilterStatus)}
              >
                <SelectTrigger id="message-status" className="w-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="message-source">Nguồn</FieldLabel>
              <Select
                value={source}
                onValueChange={(value) => setSource(value as FilterSource)}
              >
                <SelectTrigger id="message-source" className="w-full">
                  <SelectValue placeholder="Nguồn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả nguồn</SelectItem>
                    {Object.entries(sourceLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {filteredInquiries.length ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry) => (
                  <TableRow
                    key={inquiry.id}
                    className="cursor-pointer"
                    onClick={() => openInquiry(inquiry)}
                  >
                    <TableCell>
                      <div className="flex min-w-40 flex-col gap-1">
                        <span className="font-medium">
                          {inquiry.customerName || "Khách chưa để tên"}
                        </span>
                        <span className="text-muted-foreground">
                          {inquiry.maskedPhone ||
                            inquiry.email ||
                            "Chưa có SĐT"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">
                        {inquiry.message || "Khách chỉ để lại số liên hệ."}
                      </p>
                    </TableCell>
                    <TableCell>
                      {inquiry.roomCode ? (
                        <div className="flex min-w-40 flex-col gap-1">
                          <span className="font-medium">
                            {inquiry.roomCode}
                          </span>
                          <span className="text-muted-foreground">
                            {inquiry.roomName}
                          </span>
                        </div>
                      ) : (
                        "Không gắn phòng"
                      )}
                    </TableCell>
                    <TableCell>{sourceLabels[inquiry.source]}</TableCell>
                    <TableCell>
                      <StatusBadge status={inquiry.status} />
                    </TableCell>
                    <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChatCircleTextIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có tin nhắn phù hợp</EmptyTitle>
            <EmptyDescription>
              Thử đổi từ khóa, nguồn hoặc trạng thái lọc.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("")
                setSource("all")
                setStatus("all")
              }}
            >
              Xóa bộ lọc
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId("")
            setNotice("")
          }
        }}
      >
        <DrawerContent className="mx-auto w-full max-w-3xl">
          {selected ? (
            <>
              <DrawerHeader>
                <DrawerTitle>
                  {selected.customerName || "Khách Roovea"}
                </DrawerTitle>
                <DrawerDescription>
                  {selected.roomCode
                    ? `${selected.roomCode} · ${selected.roomName}`
                    : "Tin nhắn không gắn phòng cụ thể"}
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-4 px-4 md:grid-cols-[1fr_260px]">
                <div className="flex flex-col gap-4">
                  <div className="border bg-muted/30 p-3 text-sm leading-6">
                    {selected.message || "Khách chỉ để lại số liên hệ."}
                  </div>
                  <Field>
                    <FieldLabel htmlFor="admin-note">Ghi chú nội bộ</FieldLabel>
                    <Textarea
                      id="admin-note"
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="VD: Đã gọi lúc 10:30, khách cần villa 6 người..."
                    />
                  </Field>
                  {notice ? (
                    <p className="text-sm text-muted-foreground">{notice}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <StatusBadge status={selected.status} />
                  <Separator />
                  <DetailItem label="Điện thoại" value={selected.phone} />
                  <DetailItem label="Email" value={selected.email} />
                  <DetailItem
                    label="Nguồn"
                    value={sourceLabels[selected.source]}
                  />
                  <DetailItem label="Đường dẫn" value={selected.routePath} />
                  <DetailItem
                    label="Ngày gửi"
                    value={formatDate(selected.createdAt)}
                  />
                  {selected.phone ? (
                    <Button asChild variant="outline">
                      <a href={`tel:${selected.phone}`}>
                        <PhoneCallIcon data-icon="inline-start" />
                        Gọi khách
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
              <DrawerFooter className="gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() =>
                    saveInquiry(selected.id, { status: "contacted" })
                  }
                >
                  Đánh dấu đã liên hệ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => saveInquiry(selected.id, { status: "closed" })}
                >
                  Đóng tin
                </Button>
                <Button type="button" disabled={saving} onClick={saveNote}>
                  Lưu ghi chú
                </Button>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <Badge
      variant={
        status === "new"
          ? "default"
          : status === "spam"
            ? "destructive"
            : "secondary"
      }
    >
      {statusLabels[status]}
    </Badge>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words">{value || "Chưa có"}</span>
    </div>
  )
}

"use client"

/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  EyeIcon,
  ImageSquareIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react"

import { SupplierForm } from "@/components/admin/supplier-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  calculateCommissionAmount,
  calculateExpectedProfit,
  getRoomCompletion,
  getRoomThumbnail,
  isValidUrl,
  isWhitelistedVideoUrl,
  withAutomaticRoomSeo,
} from "@/lib/admin/helpers"
import {
  accommodationTypeLabels,
  accommodationTypeOptions,
  distanceToCenterOptions,
  getNearbyTagLabel,
  nearbyTagOptions,
  priceUnitOptions,
  provinceOptions,
  roomStatusLabels,
  roomStatusOptions,
  supplierStatusLabels,
} from "@/lib/admin/options"
import { buildEmptySupplier, useAdminStore } from "@/lib/admin/store"
import type {
  AccommodationType,
  CommissionType,
  DistanceToCenter,
  PriceUnit,
  Room,
  RoomImage,
  RoomStatus,
} from "@/lib/admin/types"

type RoomFormProps = {
  room: Room
  mode: "create" | "edit"
  onSave: (room: Room) => Promise<Room | null>
}

type RoomErrors = Record<string, string>

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"]
const timeHourOptions = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
)
const timeMinuteOptions = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
)

function toggleValue<T extends string>(
  values: T[],
  value: T,
  checked: boolean
) {
  if (checked) {
    return values.includes(value) ? values : [...values, value]
  }

  return values.filter((item) => item !== value)
}

function splitTimeValue(value: string) {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/)

  return match ? { hour: match[1], minute: match[2] } : { hour: "", minute: "" }
}

function validateRoom(room: Room, saveAsDraft: boolean) {
  const errors: RoomErrors = {}

  if (!room.name.trim()) {
    errors.name = "Vui lòng nhập tên phòng."
  }

  if (!room.roomCode.trim()) {
    errors.roomCode = "Vui lòng nhập mã phòng."
  }

  if (room.description.length > 150) {
    errors.description = "Mô tả nên tối đa khoảng 150 ký tự."
  }

  if (room.accommodationTypes.length > 3) {
    errors.accommodationTypes = "Chỉ chọn tối đa 3 loại hình lưu trú."
  }

  if (
    room.pricing.strikethroughPrice &&
    room.pricing.strikethroughPrice <= room.pricing.referencePrice
  ) {
    errors.strikethroughPrice = "Giá gạch ngang phải lớn hơn giá tham khảo."
  }

  const invalidVideoUrl = room.media.videoUrls.find(
    (url) => !isWhitelistedVideoUrl(url)
  )

  if (invalidVideoUrl) {
    errors.videoUrls =
      "Chỉ nhận URL YouTube, TikTok, Vimeo hoặc Google Drive, mỗi dòng là một URL."
  }

  if (room.location.googleMapsUrl && !isValidUrl(room.location.googleMapsUrl)) {
    errors.googleMapsUrl = "Link Google Maps cần là URL hợp lệ."
  }

  if (!saveAsDraft) {
    if (room.accommodationTypes.length === 0) {
      errors.accommodationTypes = "Chọn ít nhất một loại hình lưu trú."
    }

    if (room.pricing.referencePrice <= 0) {
      errors.referencePrice = "Nhập giá tham khảo lớn hơn 0."
    }

    if (!room.location.provinceCity) {
      errors.provinceCity = "Chọn tỉnh/thành phố."
    }

    if (!room.location.addressDetail.trim()) {
      errors.addressDetail = "Nhập địa chỉ chi tiết."
    }

    if (room.capacity.maxGuests < 1) {
      errors.maxGuests = "Sức chứa tối đa cần lớn hơn 0."
    }

    if (!room.policies.checkInTime) {
      errors.checkInTime = "Nhập giờ nhận phòng."
    }

    if (!room.policies.checkOutTime) {
      errors.checkOutTime = "Nhập giờ trả phòng."
    }
  }

  return errors
}

export function RoomForm({ room, mode, onSave }: RoomFormProps) {
  const { suppliers, createSupplier, nextSupplierCode } = useAdminStore()
  const [draft, setDraft] = useState<Room>(() =>
    JSON.parse(JSON.stringify(room))
  )
  const [errors, setErrors] = useState<RoomErrors>({})
  const [notice, setNotice] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false)
  const [supplierQuery, setSupplierQuery] = useState("")
  const [quickSupplierOpen, setQuickSupplierOpen] = useState(false)
  const [videoUrlText, setVideoUrlText] = useState(() =>
    room.media.videoUrls.join("\n")
  )
  const [videoError, setVideoError] = useState("")
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const completion = useMemo(() => getRoomCompletion(draft), [draft])
  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === draft.supplierId
  )
  const thumbnail = getRoomThumbnail(draft)
  const commissionAmount = calculateCommissionAmount(
    draft.pricing.supplierPrice,
    draft.pricing.commissionType,
    draft.pricing.commissionValue
  )
  const expectedProfit = calculateExpectedProfit(draft.pricing)
  const videoUrlError = errors.videoUrls || videoError

  const supplierResults = useMemo(() => {
    const normalizedQuery = supplierQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return suppliers.slice(0, 8)
    }

    return suppliers.filter((supplier) =>
      [supplier.supplierCode, supplier.fullName, supplier.phone, supplier.email]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [supplierQuery, suppliers])

  function updateRoom(patch: Partial<Room>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function updatePricing(patch: Partial<Room["pricing"]>) {
    setDraft((current) => ({
      ...current,
      pricing: { ...current.pricing, ...patch },
    }))
  }

  function updateCapacity(patch: Partial<Room["capacity"]>) {
    setDraft((current) => ({
      ...current,
      capacity: { ...current.capacity, ...patch },
    }))
  }

  function updateLocation(patch: Partial<Room["location"]>) {
    setDraft((current) => ({
      ...current,
      location: { ...current.location, ...patch },
    }))
  }

  function updatePolicies(patch: Partial<Room["policies"]>) {
    setDraft((current) => ({
      ...current,
      policies: { ...current.policies, ...patch },
    }))
  }

  function clearError(key: string) {
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  function handleNameChange(value: string) {
    updateRoom({ name: value })
    clearError("name")
  }

  async function saveRoom(requestedStatus: RoomStatus) {
    const nextRoom = withAutomaticRoomSeo({
      ...draft,
      status: requestedStatus,
    })
    const saveAsDraft = requestedStatus === "draft"
    const nextErrors = validateRoom(nextRoom, saveAsDraft)

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setNotice("Kiểm tra lại các trường đang báo lỗi trước khi lưu.")
      return
    }

    const nextCompletion = getRoomCompletion(nextRoom)

    if (requestedStatus === "published" && nextCompletion.missing.length) {
      setNotice(
        `Chưa thể đăng hoàn chỉnh. Hệ thống sẽ lưu trạng thái chờ bổ sung: ${nextCompletion.missing.join(", ")}.`
      )
    } else if (nextCompletion.missing.length && requestedStatus !== "draft") {
      setNotice(
        `Dữ liệu còn thiếu ${nextCompletion.missing.join(", ")}; trạng thái sẽ là chờ bổ sung.`
      )
    } else {
      setNotice("Đang lưu thay đổi...")
    }

    setSaving(true)

    try {
      const saved = await onSave(nextRoom)

      if (saved) {
        const savedDraft = JSON.parse(JSON.stringify(saved)) as Room

        setDraft(savedDraft)
        setVideoUrlText(savedDraft.media.videoUrls.join("\n"))
        setNotice("Đã lưu thay đổi vào database.")
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu phòng.")
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void saveRoom(draft.status)
  }

  async function uploadImage(file: File, fallbackId?: string) {
    const formData = new FormData()
    formData.set("file", file)

    const response = await fetch("/api/admin/uploads", {
      body: formData,
      method: "POST",
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error ?? "Không thể upload ảnh.")
    }

    return {
      id: fallbackId ?? payload.media.id,
      url: payload.media.url,
    }
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) {
      return
    }

    const acceptedFiles = Array.from(files).filter((file) =>
      imageMimeTypes.includes(file.type)
    )

    if (acceptedFiles.length !== files.length) {
      setNotice("Chỉ nhận JPG, JPEG, PNG hoặc WEBP cho ảnh phòng.")
    }

    try {
      setNotice("Đang upload ảnh phòng...")
      const uploadedImages = await Promise.all(
        acceptedFiles.map(async (file, index): Promise<RoomImage> => {
          const media = await uploadImage(file)

          return {
            id: media.id,
            url: media.url,
            caption: file.name,
            isThumbnail: draft.media.images.length === 0 && index === 0,
            warning:
              file.size < 140000
                ? "Ảnh có dung lượng nhỏ, nên kiểm tra lại chất lượng."
                : undefined,
          }
        })
      )

      setDraft((current) => ({
        ...current,
        media: {
          ...current.media,
          images: [...current.media.images, ...uploadedImages],
        },
      }))
      setNotice("Đã upload ảnh. Nhấn lưu để ghi media vào database.")
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể upload ảnh."
      )
    }
  }

  async function replaceImage(imageId: string, file: File | undefined) {
    if (!file || !imageMimeTypes.includes(file.type)) {
      setNotice("Ảnh thay thế cần là JPG, JPEG, PNG hoặc WEBP.")
      return
    }

    try {
      setNotice("Đang thay thế ảnh...")
      const media = await uploadImage(file, imageId)

      setDraft((current) => ({
        ...current,
        media: {
          ...current.media,
          images: current.media.images.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  url: media.url,
                  caption: image.caption || file.name,
                  warning:
                    file.size < 140000
                      ? "Ảnh có dung lượng nhỏ, nên kiểm tra lại chất lượng."
                      : undefined,
                }
              : image
          ),
        },
      }))
      setNotice("Đã thay thế ảnh. Nhấn lưu để ghi media vào database.")
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể upload ảnh."
      )
    }
  }

  function setThumbnail(imageId: string) {
    setDraft((current) => {
      const images = current.media.images.map((image) => ({
        ...image,
        isThumbnail: image.id === imageId,
      }))
      const selected = images.find((image) => image.id === imageId)
      const rest = images.filter((image) => image.id !== imageId)

      return {
        ...current,
        media: {
          ...current.media,
          images: selected ? [selected, ...rest] : images,
        },
        seo: {
          ...current.seo,
          shareThumbnailImageId: imageId,
        },
      }
    })
  }

  function removeImage(imageId: string) {
    setDraft((current) => {
      const images = current.media.images.filter(
        (image) => image.id !== imageId
      )
      const normalizedImages =
        images.length > 0 && !images.some((image) => image.isThumbnail)
          ? images.map((image, index) => ({
              ...image,
              isThumbnail: index === 0,
            }))
          : images

      return {
        ...current,
        media: {
          ...current.media,
          images: normalizedImages,
        },
      }
    })
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.media.images.findIndex(
        (image) => image.id === imageId
      )

      if (index < 0) {
        return current
      }

      const targetIndex = index + direction

      if (targetIndex < 0 || targetIndex >= current.media.images.length) {
        return current
      }

      const images = [...current.media.images]
      const [image] = images.splice(index, 1)
      images.splice(targetIndex, 0, image)

      return {
        ...current,
        media: { ...current.media, images },
      }
    })
  }

  function dropImage(targetImageId: string) {
    if (!draggingImageId || draggingImageId === targetImageId) {
      return
    }

    setDraft((current) => {
      const sourceIndex = current.media.images.findIndex(
        (image) => image.id === draggingImageId
      )
      const targetIndex = current.media.images.findIndex(
        (image) => image.id === targetImageId
      )

      if (sourceIndex < 0 || targetIndex < 0) {
        return current
      }

      const images = [...current.media.images]
      const [image] = images.splice(sourceIndex, 1)
      images.splice(targetIndex, 0, image)

      return {
        ...current,
        media: { ...current.media, images },
      }
    })
    setDraggingImageId(null)
  }

  function parseVideoUrlLines(value: string) {
    return Array.from(
      new Set(
        value
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }

  function updateVideoUrlText(value: string) {
    const urls = parseVideoUrlLines(value)
    const invalidUrl = urls.find((url) => !isWhitelistedVideoUrl(url))

    setVideoUrlText(value)
    setVideoError(
      invalidUrl
        ? "Chỉ nhận URL YouTube, TikTok, Vimeo hoặc Google Drive, mỗi dòng là một URL."
        : ""
    )
    clearError("videoUrls")
    setDraft((current) => ({
      ...current,
      media: {
        ...current.media,
        videoUrls: urls,
      },
    }))
  }

  function removeVideoUrl(url: string) {
    const urls = draft.media.videoUrls.filter((item) => item !== url)

    setVideoUrlText(urls.join("\n"))
    setVideoError("")
    clearError("videoUrls")
    setDraft((current) => ({
      ...current,
      media: {
        ...current.media,
        videoUrls: urls,
      },
    }))
  }

  async function createQuickSupplier(
    supplier: Parameters<typeof createSupplier>[0]
  ) {
    try {
      const created = await createSupplier(supplier)
      updateRoom({ supplierId: created.id })
      setQuickSupplierOpen(false)
      setSupplierPickerOpen(false)
      setNotice(`${created.supplierCode} đã được tạo và gán cho phòng.`)
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không thể tạo nhà cung cấp."
      )
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card className="sticky top-0">
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {roomStatusLabels[draft.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Hoàn thiện {completion.percent}%
                </span>
              </div>
              <Progress value={completion.percent} />
              <div className="flex flex-wrap gap-2">
                {Object.entries({
                  basic: "Thông tin cơ bản",
                  supplier: "Nhà cung cấp",
                  pricing: "Giá",
                  location: "Vị trí",
                  media: "Media",
                  policies: "Chính sách",
                }).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={
                      completion.sections[
                        key as keyof typeof completion.sections
                      ]
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {completion.sections[
                      key as keyof typeof completion.sections
                    ] ? (
                      <CheckCircleIcon data-icon="inline-start" />
                    ) : (
                      <WarningCircleIcon data-icon="inline-start" />
                    )}
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  updateRoom({ status: value as RoomStatus })
                }
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {roomStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setPreviewOpen(true)}
              >
                <EyeIcon data-icon="inline-start" />
                Xem trước
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Đang lưu..."
                  : mode === "create"
                    ? "Tạo phòng"
                    : "Lưu thay đổi"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {notice ? (
          <Alert>
            <AlertTitle>Trạng thái lưu</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <CardDescription>
              Các trường này phục vụ tìm kiếm, lọc và hiển thị mã phòng cho
              khách.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 lg:grid-cols-2">
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="room-name">Tên phòng</FieldLabel>
                <Input
                  id="room-name"
                  value={draft.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.roomCode)}>
                <FieldLabel htmlFor="room-code">Mã phòng</FieldLabel>
                <Input
                  id="room-code"
                  value={draft.roomCode}
                  readOnly
                  aria-readonly="true"
                  aria-invalid={Boolean(errors.roomCode)}
                  className="bg-muted text-muted-foreground"
                />
                <FieldDescription>
                  Mã phòng do hệ thống tự tạo và không thể chỉnh sửa.
                </FieldDescription>
                <FieldError>{errors.roomCode}</FieldError>
              </Field>
              <Field
                data-invalid={Boolean(errors.accommodationTypes)}
                className="lg:col-span-2"
              >
                <FieldLabel>Loại hình lưu trú</FieldLabel>
                <CheckboxGrid
                  options={accommodationTypeOptions}
                  values={draft.accommodationTypes}
                  maxSelected={3}
                  idPrefix="room-accommodation"
                  onChange={(value, checked) => {
                    updateRoom({
                      accommodationTypes: toggleValue(
                        draft.accommodationTypes,
                        value as AccommodationType,
                        checked
                      ),
                    })
                    clearError("accommodationTypes")
                  }}
                />
                <FieldDescription>
                  Chọn tối đa 3 loại hình phù hợp với phòng.
                </FieldDescription>
                <FieldError>{errors.accommodationTypes}</FieldError>
              </Field>
              {draft.accommodationTypes.includes("other") ? (
                <Field className="lg:col-span-2">
                  <FieldLabel htmlFor="room-other-type">
                    Loại hình “Khác”
                  </FieldLabel>
                  <Input
                    id="room-other-type"
                    value={draft.otherAccommodationType}
                    onChange={(event) =>
                      updateRoom({ otherAccommodationType: event.target.value })
                    }
                  />
                </Field>
              ) : null}
              <Field
                data-invalid={Boolean(errors.description)}
                className="lg:col-span-2"
              >
                <FieldLabel htmlFor="room-description">Mô tả phòng</FieldLabel>
                <Textarea
                  id="room-description"
                  value={draft.description}
                  maxLength={180}
                  onChange={(event) =>
                    updateRoom({ description: event.target.value })
                  }
                  aria-invalid={Boolean(errors.description)}
                />
                <FieldDescription>
                  {draft.description.length}/150 ký tự khuyến nghị.
                </FieldDescription>
                <FieldError>{errors.description}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="room-area">Diện tích (m²)</FieldLabel>
                <Input
                  id="room-area"
                  type="number"
                  min={0}
                  value={draft.areaM2 ?? ""}
                  onChange={(event) =>
                    updateRoom({
                      areaM2: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                />
              </Field>
              <Field data-invalid={Boolean(errors.maxGuests)}>
                <FieldLabel htmlFor="room-guests">Sức chứa tối đa</FieldLabel>
                <Input
                  id="room-guests"
                  type="number"
                  min={1}
                  max={99}
                  value={draft.capacity.maxGuests}
                  onChange={(event) =>
                    updateCapacity({ maxGuests: Number(event.target.value) })
                  }
                  aria-invalid={Boolean(errors.maxGuests)}
                />
                <FieldError>{errors.maxGuests}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="room-bedrooms">Số phòng ngủ</FieldLabel>
                <Input
                  id="room-bedrooms"
                  type="number"
                  min={0}
                  value={draft.capacity.bedrooms}
                  onChange={(event) =>
                    updateCapacity({ bedrooms: Number(event.target.value) })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="room-bathrooms">Số phòng tắm</FieldLabel>
                <Input
                  id="room-bathrooms"
                  type="number"
                  min={0}
                  step="0.5"
                  value={draft.capacity.bathrooms}
                  onChange={(event) =>
                    updateCapacity({ bathrooms: Number(event.target.value) })
                  }
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nhà cung cấp/Đối tác</CardTitle>
            <CardDescription>
              Chọn nhà cung cấp có sẵn hoặc tạo nhanh trong database.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedSupplier ? (
              <div className="grid gap-3 border bg-muted/30 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{selectedSupplier.supplierCode}</Badge>
                    <Badge variant="secondary">
                      {supplierStatusLabels[selectedSupplier.status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{selectedSupplier.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSupplier.phone}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button asChild variant="outline">
                    <Link href={`/admin/suppliers/${selectedSupplier.id}/edit`}>
                      Chỉnh sửa nhà cung cấp
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateRoom({ supplierId: undefined })}
                  >
                    Thay đổi nhà cung cấp
                  </Button>
                </div>
              </div>
            ) : (
              <Field>
                <FieldLabel>Tìm nhà cung cấp</FieldLabel>
                <Popover
                  open={supplierPickerOpen}
                  onOpenChange={setSupplierPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      Chọn nhà cung cấp
                      <PlusIcon data-icon="inline-end" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(520px,calc(100vw-2rem))] p-0">
                    <Command>
                      <CommandInput
                        value={supplierQuery}
                        onValueChange={setSupplierQuery}
                        placeholder="Tìm theo mã, tên, điện thoại, email"
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="flex flex-col items-center gap-3 p-4">
                            <span>Không tìm thấy nhà cung cấp phù hợp.</span>
                            <Button
                              type="button"
                              onClick={() => setQuickSupplierOpen(true)}
                            >
                              Tạo nhà cung cấp mới
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {supplierResults.map((supplier) => (
                            <CommandItem
                              key={supplier.id}
                              value={`${supplier.supplierCode} ${supplier.fullName}`}
                              onSelect={() => {
                                updateRoom({ supplierId: supplier.id })
                                setSupplierPickerOpen(false)
                              }}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {supplier.supplierCode} · {supplier.fullName}
                                </span>
                                <span className="text-muted-foreground">
                                  {supplier.phone} ·{" "}
                                  {supplier.email || "Chưa có email"}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() => setQuickSupplierOpen(true)}
                >
                  <PlusIcon data-icon="inline-start" />
                  Tạo nhà cung cấp mới
                </Button>
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giá và hoa hồng</CardTitle>
            <CardDescription>
              Tách dữ liệu nội bộ với giá hiển thị cho khách.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="supplier-price">
                  Giá nhà cung cấp/Giá nhập
                </FieldLabel>
                <Input
                  id="supplier-price"
                  type="number"
                  min={0}
                  value={draft.pricing.supplierPrice}
                  onChange={(event) =>
                    updatePricing({ supplierPrice: Number(event.target.value) })
                  }
                />
                <FieldDescription>
                  {formatCurrency(draft.pricing.supplierPrice)}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="commission-type">Loại hoa hồng</FieldLabel>
                <Select
                  value={draft.pricing.commissionType}
                  onValueChange={(value) =>
                    updatePricing({ commissionType: value as CommissionType })
                  }
                >
                  <SelectTrigger id="commission-type" className="w-full">
                    <SelectValue placeholder="Chọn loại hoa hồng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="percentage">Phần trăm</SelectItem>
                      <SelectItem value="fixed">Cố định</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="commission-value">
                  Giá trị hoa hồng
                </FieldLabel>
                <Input
                  id="commission-value"
                  type="number"
                  min={0}
                  value={draft.pricing.commissionValue}
                  onChange={(event) =>
                    updatePricing({
                      commissionValue: Number(event.target.value),
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Số tiền hoa hồng</FieldLabel>
                <Input value={formatCurrency(commissionAmount)} readOnly />
              </Field>
              <Field data-invalid={Boolean(errors.referencePrice)}>
                <FieldLabel htmlFor="reference-price">
                  Giá tham khảo/Giá bán dự kiến
                </FieldLabel>
                <Input
                  id="reference-price"
                  type="number"
                  min={0}
                  value={draft.pricing.referencePrice}
                  onChange={(event) => {
                    updatePricing({
                      referencePrice: Number(event.target.value),
                    })
                    clearError("referencePrice")
                  }}
                  aria-invalid={Boolean(errors.referencePrice)}
                />
                <FieldDescription>
                  {formatCurrency(draft.pricing.referencePrice)}
                </FieldDescription>
                <FieldError>{errors.referencePrice}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Đơn vị giá</FieldLabel>
                <Select
                  value={draft.pricing.priceUnit}
                  onValueChange={(value) =>
                    updatePricing({ priceUnit: value as PriceUnit })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Đơn vị giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {priceUnitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field data-invalid={Boolean(errors.strikethroughPrice)}>
                <FieldLabel htmlFor="strike-price">Giá gạch ngang</FieldLabel>
                <Input
                  id="strike-price"
                  type="number"
                  min={0}
                  value={draft.pricing.strikethroughPrice ?? ""}
                  onChange={(event) =>
                    updatePricing({
                      strikethroughPrice: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                  aria-invalid={Boolean(errors.strikethroughPrice)}
                />
                <FieldDescription>
                  {draft.pricing.strikethroughPrice
                    ? formatCurrency(draft.pricing.strikethroughPrice)
                    : "Chưa khai báo giá gạch ngang."}
                </FieldDescription>
                <FieldError>{errors.strikethroughPrice}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Lợi nhuận dự kiến mỗi đêm</FieldLabel>
                <Input value={formatCurrency(expectedProfit)} readOnly />
              </Field>
              <Field className="lg:col-span-2">
                <FieldLabel htmlFor="price-note">Ghi chú giá</FieldLabel>
                <Textarea
                  id="price-note"
                  value={draft.pricing.priceNote}
                  onChange={(event) =>
                    updatePricing({ priceNote: event.target.value })
                  }
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hình ảnh và video</CardTitle>
            <CardDescription>
              Ảnh được upload qua storage adapter local và lưu URL vào media
              record khi lưu phòng.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="room-images">Thêm ảnh</FieldLabel>
              <Input
                id="room-images"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void addImages(event.target.files)}
              />
              <FieldDescription>
                Kéo thả từng ảnh trong danh sách để đổi thứ tự. Ảnh thumbnail
                được đánh dấu riêng.
              </FieldDescription>
            </Field>
            {draft.media.images.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {draft.media.images.map((image, index) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={() => setDraggingImageId(image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropImage(image.id)}
                    className="flex flex-col gap-3 border bg-muted/30 p-3"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={image.url}
                        alt={image.caption || draft.name || "Ảnh phòng"}
                        className="size-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        {image.isThumbnail ? <Badge>Thumbnail</Badge> : null}
                      </div>
                    </div>
                    {image.warning ? (
                      <Alert>
                        <WarningCircleIcon />
                        <AlertTitle>Cảnh báo ảnh</AlertTitle>
                        <AlertDescription>{image.warning}</AlertDescription>
                      </Alert>
                    ) : null}
                    <Field>
                      <FieldLabel htmlFor={`image-caption-${image.id}`}>
                        Chú thích ảnh
                      </FieldLabel>
                      <Input
                        id={`image-caption-${image.id}`}
                        value={image.caption}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            media: {
                              ...current.media,
                              images: current.media.images.map((item) =>
                                item.id === image.id
                                  ? { ...item, caption: event.target.value }
                                  : item
                              ),
                            },
                          }))
                        }
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setThumbnail(image.id)}
                      >
                        Đặt thumbnail
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Đưa ảnh lên"
                        disabled={index === 0}
                        onClick={() => moveImage(image.id, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Đưa ảnh xuống"
                        disabled={index === draft.media.images.length - 1}
                        onClick={() => moveImage(image.id, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button asChild type="button" variant="outline">
                        <label>
                          Thay thế
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(event) =>
                              void replaceImage(
                                image.id,
                                event.target.files?.[0]
                              )
                            }
                          />
                        </label>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label="Xóa ảnh"
                        onClick={() => removeImage(image.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 border bg-muted/30 p-6 text-center">
                <ImageSquareIcon aria-hidden />
                <p className="text-sm font-medium">Chưa có ảnh phòng</p>
                <p className="text-xs text-muted-foreground">
                  Phòng chưa có ảnh sẽ được xem là chờ bổ sung thông tin.
                </p>
              </div>
            )}
            <Field data-invalid={Boolean(videoUrlError)}>
              <FieldLabel htmlFor="video-url">URL video</FieldLabel>
              <Textarea
                id="video-url"
                value={videoUrlText}
                onChange={(event) => updateVideoUrlText(event.target.value)}
                placeholder="Mỗi dòng là một URL YouTube, TikTok, Vimeo hoặc Google Drive"
                aria-invalid={Boolean(videoUrlError)}
                className="min-h-28"
              />
              <FieldDescription>
                Mỗi dòng được tính là một link video riêng.
              </FieldDescription>
              <FieldError>{videoUrlError}</FieldError>
            </Field>
            <div className="flex flex-wrap gap-2">
              {draft.media.videoUrls.map((url) => (
                <Badge key={url} variant="outline">
                  {url}
                  <button
                    type="button"
                    aria-label="Xóa video"
                    onClick={() => removeVideoUrl(url)}
                  >
                    <XIcon data-icon="inline-end" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vị trí</CardTitle>
            <CardDescription>
              Dữ liệu vị trí được lưu có cấu trúc để phục vụ lọc phòng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 lg:grid-cols-2">
              <Field data-invalid={Boolean(errors.provinceCity)}>
                <FieldLabel htmlFor="room-province">Tỉnh/Thành phố</FieldLabel>
                <Select
                  value={draft.location.provinceCity || "manual"}
                  onValueChange={(value) => {
                    updateLocation({
                      provinceCity: value === "manual" ? "" : value,
                      districtCity: "",
                    })
                    clearError("provinceCity")
                  }}
                >
                  <SelectTrigger id="room-province" className="w-full">
                    <SelectValue placeholder="Chọn tỉnh/thành" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="manual">Nhập tay</SelectItem>
                      {provinceOptions.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {!draft.location.provinceCity ? (
                  <Input
                    value={draft.location.provinceCity}
                    onChange={(event) =>
                      updateLocation({ provinceCity: event.target.value })
                    }
                    placeholder="Hoặc nhập tỉnh/thành"
                  />
                ) : null}
                <FieldError>{errors.provinceCity}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="room-district">Quận/Huyện</FieldLabel>
                <Select
                  value={draft.location.districtCity || "manual"}
                  onValueChange={(value) =>
                    updateLocation({
                      districtCity: value === "manual" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="room-district" className="w-full">
                    <SelectValue placeholder="Chọn hoặc nhập quận/huyện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="manual">Nhập tay</SelectItem>
                      {provinceOptions
                        .find(
                          (province) =>
                            province.value === draft.location.provinceCity
                        )
                        ?.districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {!draft.location.districtCity ? (
                  <Input
                    value={draft.location.districtCity}
                    onChange={(event) =>
                      updateLocation({ districtCity: event.target.value })
                    }
                    placeholder="Hoặc nhập quận/huyện"
                  />
                ) : null}
              </Field>
              <Field
                data-invalid={Boolean(errors.addressDetail)}
                className="lg:col-span-2"
              >
                <FieldLabel htmlFor="room-address">Địa chỉ chi tiết</FieldLabel>
                <Textarea
                  id="room-address"
                  value={draft.location.addressDetail}
                  onChange={(event) => {
                    updateLocation({ addressDetail: event.target.value })
                    clearError("addressDetail")
                  }}
                  aria-invalid={Boolean(errors.addressDetail)}
                />
                <FieldError>{errors.addressDetail}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.googleMapsUrl)}>
                <FieldLabel htmlFor="google-map">Link Google Maps</FieldLabel>
                <Input
                  id="google-map"
                  value={draft.location.googleMapsUrl}
                  onChange={(event) =>
                    updateLocation({ googleMapsUrl: event.target.value })
                  }
                  aria-invalid={Boolean(errors.googleMapsUrl)}
                />
                <FieldError>{errors.googleMapsUrl}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Khoảng cách đến trung tâm</FieldLabel>
                <Select
                  value={draft.location.distanceToCenter}
                  onValueChange={(value) =>
                    updateLocation({
                      distanceToCenter: value as DistanceToCenter,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Khoảng cách" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {distanceToCenterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="lg:col-span-2">
                <FieldLabel>Khu vực nổi bật gần phòng</FieldLabel>
                <CheckboxGrid
                  options={nearbyTagOptions}
                  values={draft.location.nearbyTags}
                  idPrefix="nearby-tag"
                  onChange={(value, checked) =>
                    updateLocation({
                      nearbyTags: toggleValue(
                        draft.location.nearbyTags,
                        value,
                        checked
                      ),
                    })
                  }
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chính sách phòng</CardTitle>
            <CardDescription>
              Chính sách chưa khai báo sẽ không hiển thị ở giao diện khách.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 lg:grid-cols-2">
              <TimePickerField
                idPrefix="check-in"
                label="Giờ nhận phòng"
                value={draft.policies.checkInTime}
                error={errors.checkInTime}
                onChange={(value) => {
                  updatePolicies({ checkInTime: value })
                  clearError("checkInTime")
                }}
              />
              <TimePickerField
                idPrefix="check-out"
                label="Giờ trả phòng"
                value={draft.policies.checkOutTime}
                error={errors.checkOutTime}
                onChange={(value) => {
                  updatePolicies({ checkOutTime: value })
                  clearError("checkOutTime")
                }}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiển thị</CardTitle>
            <CardDescription>
              SEO, slug, thumbnail chia sẻ và thứ tự hiển thị được hệ thống tự
              tạo từ thông tin phòng.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-4 lg:grid-cols-2">
              <Field orientation="horizontal">
                <Switch
                  id="featured-room"
                  checked={draft.isFeatured}
                  onCheckedChange={(checked) =>
                    updateRoom({ isFeatured: checked })
                  }
                />
                <FieldLabel htmlFor="featured-room">Phòng nổi bật</FieldLabel>
              </Field>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Tạo: {formatDate(draft.createdAt)}
                </Badge>
                <Badge variant="outline">
                  Cập nhật: {formatDate(draft.updatedAt)}
                </Badge>
                <Badge variant="outline">Người tạo: {draft.createdBy}</Badge>
                <Badge variant="outline">
                  Người cập nhật: {draft.updatedBy}
                </Badge>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      </form>

      <Sheet open={quickSupplierOpen} onOpenChange={setQuickSupplierOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Tạo nhà cung cấp mới</SheetTitle>
            <SheetDescription>
              Sau khi lưu, nhà cung cấp sẽ xuất hiện ở trang quản lý và được gán
              ngay cho phòng này.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <SupplierForm
              compact
              mode="create"
              supplier={buildEmptySupplier(nextSupplierCode)}
              submitLabel="Tạo và gán"
              onCancel={() => setQuickSupplierOpen(false)}
              onSubmit={createQuickSupplier}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xem trước phòng</DialogTitle>
            <DialogDescription>
              Preview chỉ dùng dữ liệu public, không hiển thị thông tin nội bộ
              nhà cung cấp hoặc CCCD.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {thumbnail ? (
                <img
                  src={thumbnail.url}
                  alt={thumbnail.caption || draft.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageSquareIcon aria-hidden />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{draft.roomCode}</Badge>
                {draft.isFeatured ? (
                  <Badge variant="secondary">Nổi bật</Badge>
                ) : null}
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  {draft.name || "Chưa đặt tên phòng"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {[draft.location.districtCity, draft.location.provinceCity]
                    .filter(Boolean)
                    .join(", ") || "Chưa khai báo vị trí"}
                </p>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {draft.description || "Chưa có mô tả hiển thị."}
              </p>
              <div className="flex flex-wrap gap-2">
                {draft.accommodationTypes.map((type) => (
                  <Badge key={type} variant="outline">
                    {accommodationTypeLabels[type]}
                  </Badge>
                ))}
                {draft.location.nearbyTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {getNearbyTagLabel(tag)}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Giá tham khảo
                </span>
                <strong className="text-base">
                  {formatCurrency(draft.pricing.referencePrice)}
                </strong>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setPreviewOpen(false)}>
              Đóng preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function TimePickerField({
  error,
  idPrefix,
  label,
  onChange,
  value,
}: {
  error?: string
  idPrefix: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const { hour, minute } = splitTimeValue(value)

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={hour || undefined}
          onValueChange={(nextHour) =>
            onChange(`${nextHour}:${minute || "00"}`)
          }
        >
          <SelectTrigger id={`${idPrefix}-hour`} className="w-full">
            <SelectValue placeholder="Giờ" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {timeHourOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={minute || undefined}
          onValueChange={(nextMinute) =>
            onChange(`${hour || "00"}:${nextMinute}`)
          }
        >
          <SelectTrigger id={`${idPrefix}-minute`} className="w-full">
            <SelectValue placeholder="Phút" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {timeMinuteOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function CheckboxGrid({
  options,
  values,
  idPrefix,
  maxSelected,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  values: string[]
  idPrefix: string
  maxSelected?: number
  onChange: (value: string, checked: boolean) => void
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {options.map((option) => {
        const checked = values.includes(option.value)
        const disabled = Boolean(
          maxSelected && values.length >= maxSelected && !checked
        )

        return (
          <Field
            key={option.value}
            orientation="horizontal"
            data-disabled={disabled}
          >
            <Checkbox
              id={`${idPrefix}-${option.value}`}
              checked={checked}
              disabled={disabled}
              onCheckedChange={(nextChecked) =>
                onChange(option.value, nextChecked === true)
              }
            />
            <FieldLabel htmlFor={`${idPrefix}-${option.value}`}>
              {option.label}
            </FieldLabel>
          </Field>
        )
      })}
    </div>
  )
}

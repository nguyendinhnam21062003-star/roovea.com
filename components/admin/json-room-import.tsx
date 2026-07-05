"use client"

import { useState } from "react"
import { CodeIcon, WarningCircleIcon } from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/format"
import {
  getRoomCompletion,
  hasUnsafeHtml,
  isWhitelistedVideoUrl,
  makeId,
  todayIso,
  withAutomaticRoomSeo,
} from "@/lib/admin/helpers"
import {
  accommodationTypeLabels,
  getNearbyTagLabel,
  roomStatusLabels,
} from "@/lib/admin/options"
import { useAdminStore } from "@/lib/admin/store"
import type {
  AccommodationType,
  DistanceToCenter,
  PriceUnit,
  Room,
  RoomImage,
} from "@/lib/admin/types"

type JsonRoomImportProps = {
  nextRoomCode: string
  onImport: (room: Room) => Promise<Room | null>
}

const sampleJson = `{
  "name": "Homestay view biển Hạ Long",
  "roomCode": "HL-SEA-001",
  "accommodationTypes": ["homestay"],
  "otherAccommodationType": "",
  "description": "Phòng gần biển, phù hợp cho nhóm bạn hoặc gia đình nhỏ.",
  "areaM2": 35,
  "capacity": {
    "maxGuests": 4,
    "bedrooms": 1,
    "bathrooms": 1
  },
  "supplier": {
    "supplierCode": "NCC-000001",
    "fullName": ""
  },
  "pricing": {
    "supplierPrice": 650000,
    "commissionType": "percentage",
    "commissionValue": 10,
    "referencePrice": 850000,
    "strikethroughPrice": 990000,
    "priceUnit": "per_night",
    "priceNote": ""
  },
  "location": {
    "provinceCity": "Quảng Ninh",
    "districtCity": "Thành phố Hạ Long",
    "addressDetail": "154 đường Bãi Muối, thành phố Hạ Long, Quảng Ninh",
    "googleMapsUrl": "",
    "nearbyTags": ["near_beach", "near_center"],
    "distanceToCenter": "under_3km"
  },
  "policies": {
    "checkInTime": "14:00",
    "checkOutTime": "12:00"
  },
  "media": {
    "images": [],
    "videoUrls": []
  },
  "isFeatured": false
}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function validateJsonShape(value: unknown) {
  const errors: string[] = []

  if (!isRecord(value)) {
    return ["JSON gốc phải là object."]
  }

  const capacity = isRecord(value.capacity) ? value.capacity : {}
  const pricing = isRecord(value.pricing) ? value.pricing : {}
  const location = isRecord(value.location) ? value.location : {}
  const policies = isRecord(value.policies) ? value.policies : {}
  const media = isRecord(value.media) ? value.media : {}

  if (!stringValue(value.name).trim()) {
    errors.push("name: thiếu tên phòng.")
  }

  if (stringArray(value.accommodationTypes).length === 0) {
    errors.push("accommodationTypes: cần ít nhất một loại hình lưu trú.")
  }

  if (numberValue(pricing.referencePrice) <= 0) {
    errors.push("pricing.referencePrice: cần là số lớn hơn 0.")
  }

  if (!stringValue(location.provinceCity).trim()) {
    errors.push("location.provinceCity: thiếu tỉnh/thành phố.")
  }

  if (!stringValue(location.addressDetail).trim()) {
    errors.push("location.addressDetail: thiếu địa chỉ chi tiết.")
  }

  if (numberValue(capacity.maxGuests) <= 0) {
    errors.push("capacity.maxGuests: cần là số lớn hơn 0.")
  }

  if (!stringValue(policies.checkInTime).trim()) {
    errors.push("policies.checkInTime: thiếu giờ nhận phòng.")
  }

  if (!stringValue(policies.checkOutTime).trim()) {
    errors.push("policies.checkOutTime: thiếu giờ trả phòng.")
  }

  const videoUrls = stringArray(media.videoUrls)
  const invalidVideoUrl = videoUrls.find((url) => !isWhitelistedVideoUrl(url))

  if (invalidVideoUrl) {
    errors.push(
      `media.videoUrls: URL không thuộc whitelist hoặc chứa nội dung nguy hiểm (${invalidVideoUrl}).`
    )
  }

  return errors
}

function containsUnsafeString(value: unknown): boolean {
  if (typeof value === "string") {
    return hasUnsafeHtml(value)
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeString(item))
  }

  if (isRecord(value)) {
    return Object.values(value).some((item) => containsUnsafeString(item))
  }

  return false
}

export function JsonRoomImport({
  nextRoomCode,
  onImport,
}: JsonRoomImportProps) {
  const { suppliers } = useAdminStore()
  const [jsonText, setJsonText] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null)
  const [importing, setImporting] = useState(false)

  const matchedSupplier = previewRoom?.supplierId
    ? suppliers.find((supplier) => supplier.id === previewRoom.supplierId)
    : null

  function parseJson() {
    const trimmed = jsonText.trim()

    setPreviewRoom(null)

    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
      setErrors([
        "Chỉ nhận JSON thuần. Không thêm markdown, giải thích hoặc text ngoài object JSON.",
      ])
      return
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(trimmed)
    } catch (error) {
      setErrors([
        `JSON không parse được: ${error instanceof Error ? error.message : "Sai cú pháp"}.`,
      ])
      return
    }

    if (containsUnsafeString(parsed)) {
      setErrors([
        "JSON có chứa HTML/script/iframe hoặc mã thực thi nguy hiểm. Vui lòng loại bỏ trước khi import.",
      ])
      return
    }

    const shapeErrors = validateJsonShape(parsed)

    if (shapeErrors.length > 0) {
      setErrors(shapeErrors)
      return
    }

    setErrors([])
    setPreviewRoom(mapJsonToRoom(parsed, nextRoomCode, suppliers))
  }

  async function importRoom() {
    if (!previewRoom) {
      return
    }

    setImporting(true)

    try {
      await onImport(previewRoom)
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Không thể import phòng.",
      ])
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Nhập phòng bằng JSON</CardTitle>
          <CardDescription>
            Dán JSON thuần theo schema. Prototype chỉ parse và validate ở
            frontend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            className="min-h-[520px] font-mono"
            placeholder="Dán JSON thuần vào đây"
          />
          {errors.length > 0 ? (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertTitle>Không thể import</AlertTitle>
              <AlertDescription>
                <ul className="flex list-disc flex-col gap-1 pl-4">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setJsonText(sampleJson)
              setErrors([])
              setPreviewRoom(null)
            }}
          >
            <CodeIcon data-icon="inline-start" />
            Dùng JSON mẫu
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={parseJson}>
              Parse và preview
            </Button>
            <Button
              type="button"
              disabled={!previewRoom || importing}
              onClick={() => void importRoom()}
            >
              {importing ? "Đang import..." : "Xác nhận import"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview dữ liệu đọc được</CardTitle>
          <CardDescription>
            Sau import, admin sẽ được chuyển sang trang edit để bổ sung media
            hoặc nhà cung cấp nếu thiếu.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {previewRoom ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge>{previewRoom.roomCode}</Badge>
                <Badge variant="secondary">
                  {roomStatusLabels[previewRoom.status]}
                </Badge>
              </div>
              <div>
                <h2 className="font-heading text-base font-semibold">
                  {previewRoom.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {previewRoom.location.addressDetail}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {previewRoom.accommodationTypes.map((type) => (
                  <Badge key={type} variant="outline">
                    {accommodationTypeLabels[type]}
                  </Badge>
                ))}
                {previewRoom.location.nearbyTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {getNearbyTagLabel(tag)}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-2 border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">
                  Giá tham khảo
                </span>
                <strong>
                  {formatCurrency(previewRoom.pricing.referencePrice)}
                </strong>
              </div>
              <div className="grid gap-2 border bg-muted/30 p-3">
                <span className="text-xs text-muted-foreground">
                  Nhà cung cấp
                </span>
                <strong>
                  {matchedSupplier
                    ? `${matchedSupplier.supplierCode} · ${matchedSupplier.fullName}`
                    : "Chưa liên kết"}
                </strong>
              </div>
              {getRoomCompletion(previewRoom).missing.length > 0 ? (
                <Alert>
                  <WarningCircleIcon />
                  <AlertTitle>Sẽ cần bổ sung</AlertTitle>
                  <AlertDescription>
                    {getRoomCompletion(previewRoom).missing.join(", ")}
                  </AlertDescription>
                </Alert>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 border bg-muted/30 p-6 text-center">
              <CodeIcon aria-hidden />
              <p className="text-sm font-medium">
                Chưa có dữ liệu preview hợp lệ
              </p>
              <p className="text-xs text-muted-foreground">
                Bấm parse sau khi dán JSON hoặc dùng JSON mẫu để test nhanh.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function mapJsonToRoom(
  value: unknown,
  fallbackRoomCode: string,
  suppliers: ReturnType<typeof useAdminStore>["suppliers"]
): Room {
  const record = value as Record<string, unknown>
  const capacity = isRecord(record.capacity) ? record.capacity : {}
  const supplierRecord = isRecord(record.supplier) ? record.supplier : {}
  const pricing = isRecord(record.pricing) ? record.pricing : {}
  const location = isRecord(record.location) ? record.location : {}
  const policies = isRecord(record.policies) ? record.policies : {}
  const media = isRecord(record.media) ? record.media : {}
  const now = todayIso()
  const matchedSupplier = suppliers.find(
    (supplier) =>
      supplier.supplierCode === stringValue(supplierRecord.supplierCode)
  )
  const images = mapJsonImages(media.images)

  const room: Room = withAutomaticRoomSeo({
    id: "",
    roomCode:
      stringValue(record.roomCode, fallbackRoomCode) || fallbackRoomCode,
    name: stringValue(record.name),
    status: "draft",
    accommodationTypes: stringArray(
      record.accommodationTypes
    ) as AccommodationType[],
    otherAccommodationType: stringValue(record.otherAccommodationType),
    description: stringValue(record.description).slice(0, 150),
    areaM2: numberValue(record.areaM2) || undefined,
    capacity: {
      maxGuests: numberValue(capacity.maxGuests, 1),
      bedrooms: numberValue(capacity.bedrooms),
      bathrooms: numberValue(capacity.bathrooms),
      beds: numberValue(capacity.beds),
    },
    supplierId: matchedSupplier?.id,
    pricing: {
      supplierPrice: numberValue(pricing.supplierPrice),
      commissionType:
        stringValue(pricing.commissionType, "percentage") === "fixed"
          ? "fixed"
          : "percentage",
      commissionValue: numberValue(pricing.commissionValue),
      referencePrice: numberValue(pricing.referencePrice),
      strikethroughPrice: numberValue(pricing.strikethroughPrice) || undefined,
      priceUnit: (stringValue(pricing.priceUnit, "per_night") ||
        "per_night") as PriceUnit,
      priceNote: stringValue(pricing.priceNote),
    },
    location: {
      provinceCity: stringValue(location.provinceCity),
      districtCity: stringValue(location.districtCity),
      addressDetail: stringValue(location.addressDetail),
      googleMapsUrl: stringValue(location.googleMapsUrl),
      nearbyTags: stringArray(location.nearbyTags),
      distanceToCenter: (stringValue(
        location.distanceToCenter,
        "not_declared"
      ) || "not_declared") as DistanceToCenter,
    },
    policies: {
      checkInTime: stringValue(policies.checkInTime),
      checkOutTime: stringValue(policies.checkOutTime),
      smoking: "not_allowed",
      pets: "not_allowed",
      cancellationType: "conditional",
      cancellationDetail: "",
      depositRequired: false,
      depositDetail: "",
      minimumNights: 1,
      quietHours: "",
      otherPolicy: "",
    },
    amenities: [],
    customAmenities: [],
    media: {
      images,
      videoUrls: stringArray(media.videoUrls),
    },
    seo: {
      slug: "",
      metaTitle: "",
      metaDescription: "",
    },
    isFeatured: Boolean(record.isFeatured),
    displayPriority: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: "Admin Demo",
    updatedBy: "Admin Demo",
  })

  room.status = getRoomCompletion(room).missing.length
    ? "pending_completion"
    : "draft"

  return room
}

function mapJsonImages(value: unknown): RoomImage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index): RoomImage | null => {
      if (typeof item === "string") {
        return {
          id: makeId("json-image"),
          url: item,
          caption: "",
          isThumbnail: index === 0,
        }
      }

      if (isRecord(item)) {
        const url = stringValue(item.url || item.src)

        if (!url) {
          return null
        }

        return {
          id: makeId("json-image"),
          url,
          caption: stringValue(item.caption || item.alt),
          isThumbnail: index === 0,
        }
      }

      return null
    })
    .filter((item): item is RoomImage => Boolean(item))
}

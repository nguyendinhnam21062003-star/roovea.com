"use client"

/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ImageSquareIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { buildEmptyRentalListing, parseRentalTextList } from "@/lib/rentals/helpers"
import {
  rentalAmenityOptions,
  rentalAvailabilityOptions,
  rentalPublicationStatusLabels,
  rentalTypeOptions,
} from "@/lib/rentals/options"
import type {
  RentalListing,
  RentalPublicationStatus,
} from "@/lib/rentals/types"

type SupplierOption = {
  id: string
  supplierCode: string
  fullName: string
}

type RentalListingFormProps = {
  initialRental?: RentalListing
  mode: "owner" | "admin"
  suppliers?: SupplierOption[]
}

type FormErrors = Record<string, string>

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"]

function errorText(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(" ")
  return typeof value === "string" ? value : ""
}

function toggleValue(values: string[], value: string, checked: boolean) {
  return checked
    ? values.includes(value)
      ? values
      : [...values, value]
    : values.filter((item) => item !== value)
}

export function RentalListingForm({
  initialRental,
  mode,
  suppliers = [],
}: RentalListingFormProps) {
  const router = useRouter()
  const [draft, setDraft] = useState<RentalListing>(() =>
    structuredClone(initialRental ?? buildEmptyRentalListing())
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [notice, setNotice] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nearbyText, setNearbyText] = useState(() =>
    draft.nearbyPlaces.join(", ")
  )
  const [customAmenityText, setCustomAmenityText] = useState(() =>
    draft.customAmenities.join(", ")
  )
  const [allowedText, setAllowedText] = useState(() =>
    draft.allowedRules.join("\n")
  )
  const [disallowedText, setDisallowedText] = useState(() =>
    draft.disallowedRules.join("\n")
  )
  const [videoText, setVideoText] = useState(() =>
    draft.media.videoUrls.join("\n")
  )
  const isAdminOwned = mode === "admin" && draft.source === "admin"
  const backHref = mode === "admin" ? "/admin/phongtro" : "/taikhoan/tindang"
  const imageCountLabel = `${draft.media.images.length}/12 ảnh`
  const sortedImages = useMemo(
    () =>
      [...draft.media.images].sort(
        (first, second) =>
          Number(second.isThumbnail) - Number(first.isThumbnail)
      ),
    [draft.media.images]
  )

  function updateDraft(patch: Partial<RentalListing>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function clearError(key: string) {
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  function normalizeDraft(
    rental: RentalListing,
    publicationStatus: RentalPublicationStatus
  ): RentalListing {
    return {
      ...rental,
      publicationStatus,
      city: "TP. Hồ Chí Minh",
      nearbyPlaces: parseRentalTextList(nearbyText, 3),
      customAmenities: parseRentalTextList(customAmenityText, 20),
      allowedRules: parseRentalTextList(allowedText),
      disallowedRules: parseRentalTextList(disallowedText),
      media: {
        ...rental.media,
        videoUrls: parseRentalTextList(videoText, 5),
      },
    }
  }

  async function persist(
    publicationStatus: RentalPublicationStatus,
    options?: { quiet?: boolean }
  ) {
    const payload = normalizeDraft(draft, publicationStatus)
    const baseEndpoint =
      mode === "admin" ? "/api/admin/phongtro" : "/api/taikhoan/tindang"
    const endpoint = payload.id ? `${baseEndpoint}/${payload.id}` : baseEndpoint

    setSaving(true)
    setErrors({})
    setNotice("Đang lưu tin đăng...")

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: payload.id ? "PATCH" : "POST",
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const nextErrors = Object.fromEntries(
          Object.entries(result.fieldErrors ?? {}).map(([key, value]) => [
            key,
            errorText(value),
          ])
        )
        setErrors(nextErrors)
        throw new Error(result.error ?? "Không thể lưu tin đăng.")
      }

      const saved = result.rental as RentalListing
      setDraft(saved)
      setNotice("Đã lưu tin đăng.")

      if (!options?.quiet) {
        toast.success(
          saved.publicationStatus === "published"
            ? "Tin đã được xuất bản."
            : "Đã lưu thay đổi."
        )
        router.push(backHref)
        router.refresh()
      }

      return saved
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể lưu tin đăng."
      setNotice(message)
      if (!options?.quiet) toast.error(message)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function ensureDraft() {
    if (draft.id) return draft
    return persist("draft", { quiet: true })
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return

    const accepted = Array.from(files)
      .filter((file) => imageMimeTypes.includes(file.type))
      .slice(0, Math.max(0, 12 - draft.media.images.length))

    if (!accepted.length) {
      toast.error("Chỉ nhận ảnh JPG, PNG hoặc WEBP.")
      return
    }

    setUploading(true)

    try {
      const savedDraft = await ensureDraft()
      if (!savedDraft) return

      const uploadEndpoint =
        mode === "admin"
          ? "/api/admin/uploads"
          : `/api/taikhoan/tindang/${savedDraft.id}/upload`
      const uploaded = await Promise.all(
        accepted.map(async (file, index) => {
          const formData = new FormData()
          formData.set("file", file)
          const response = await fetch(uploadEndpoint, {
            body: formData,
            method: "POST",
          })
          const result = await response.json().catch(() => ({}))

          if (!response.ok) {
            throw new Error(result.error ?? "Không thể upload ảnh.")
          }

          return {
            id: result.media.id as string,
            url: result.media.url as string,
            caption: file.name,
            isThumbnail:
              savedDraft.media.images.length === 0 && index === 0,
          }
        })
      )

      setDraft((current) => ({
        ...current,
        id: savedDraft.id,
        code: savedDraft.code,
        media: {
          ...current.media,
          images: [...current.media.images, ...uploaded].slice(0, 12),
        },
      }))
      setNotice("Ảnh đã tải lên. Hãy lưu tin để hoàn tất.")
      toast.success(`Đã tải ${uploaded.length} ảnh.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể upload ảnh."
      )
    } finally {
      setUploading(false)
    }
  }

  function removeImage(id: string) {
    setDraft((current) => {
      const images = current.media.images.filter((image) => image.id !== id)
      const normalized =
        images.length > 0 && !images.some((image) => image.isThumbnail)
          ? images.map((image, index) => ({
              ...image,
              isThumbnail: index === 0,
            }))
          : images

      return { ...current, media: { ...current.media, images: normalized } }
    })
  }

  function setThumbnail(id: string) {
    setDraft((current) => ({
      ...current,
      media: {
        ...current.media,
        images: current.media.images.map((image) => ({
          ...image,
          isThumbnail: image.id === id,
        })),
      },
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void persist(draft.publicationStatus)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href={backHref}>
            <ArrowLeftIcon data-icon="inline-start" />
            Quay lại
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {draft.code ? <Badge variant="outline">{draft.code}</Badge> : null}
          <Badge variant="secondary">
            {rentalPublicationStatusLabels[draft.publicationStatus]}
          </Badge>
        </div>
      </div>

      {draft.publicationStatus === "hidden" ? (
        <Alert>
          <AlertTitle>Tin đang bị ẩn</AlertTitle>
          <AlertDescription>
            {draft.hiddenReason ||
              "Bạn có thể chỉnh sửa nội dung, nhưng chỉ admin mới có thể xuất bản lại."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>
            Một tin tương ứng với một phòng cụ thể.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {isAdminOwned ? (
              <Field data-invalid={Boolean(errors.supplierId)}>
                <FieldLabel htmlFor="rental-supplier">Đối tác/chủ nhà</FieldLabel>
                <Select
                  value={draft.supplierId || "none"}
                  onValueChange={(value) => {
                    updateDraft({ supplierId: value === "none" ? "" : value })
                    clearError("supplierId")
                  }}
                >
                  <SelectTrigger
                    id="rental-supplier"
                    className="w-full"
                    aria-invalid={Boolean(errors.supplierId)}
                  >
                    <SelectValue placeholder="Chọn đối tác" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Chưa chọn</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplierCode} · {supplier.fullName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{errors.supplierId}</FieldError>
              </Field>
            ) : null}

            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="rental-name">Tên phòng</FieldLabel>
              <Input
                id="rental-name"
                value={draft.name}
                onChange={(event) => {
                  updateDraft({ name: event.target.value })
                  clearError("name")
                }}
                placeholder="Ví dụ: Phòng có gác gần Đại học Văn Lang"
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>

            <FieldSet>
              <FieldLegend>Loại hình</FieldLegend>
              <ToggleGroup
                type="single"
                variant="outline"
                value={draft.rentalType}
                onValueChange={(value) => {
                  if (value) {
                    updateDraft({
                      rentalType: value as RentalListing["rentalType"],
                    })
                  }
                }}
                className="flex flex-wrap justify-start"
              >
                {rentalTypeOptions.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            {draft.rentalType === "other" ? (
              <Field data-invalid={Boolean(errors.otherRentalType)}>
                <FieldLabel htmlFor="rental-other-type">
                  Loại hình khác
                </FieldLabel>
                <Input
                  id="rental-other-type"
                  value={draft.otherRentalType}
                  onChange={(event) =>
                    updateDraft({ otherRentalType: event.target.value })
                  }
                  aria-invalid={Boolean(errors.otherRentalType)}
                />
                <FieldError>{errors.otherRentalType}</FieldError>
              </Field>
            ) : null}

            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="rental-description">Mô tả</FieldLabel>
              <Textarea
                id="rental-description"
                value={draft.description}
                onChange={(event) => {
                  updateDraft({ description: event.target.value })
                  clearError("description")
                }}
                rows={6}
                placeholder="Mô tả không gian, ưu điểm và đối tượng phù hợp."
                aria-invalid={Boolean(errors.description)}
              />
              <FieldError>{errors.description}</FieldError>
            </Field>

            <FieldSet>
              <FieldLegend>Tình trạng phòng</FieldLegend>
              <ToggleGroup
                type="single"
                variant="outline"
                value={draft.availabilityStatus}
                onValueChange={(value) => {
                  if (value) {
                    updateDraft({
                      availabilityStatus:
                        value as RentalListing["availabilityStatus"],
                    })
                  }
                }}
                className="flex flex-wrap justify-start"
              >
                {rentalAvailabilityOptions.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Địa chỉ</CardTitle>
          <CardDescription>
            Nhập đầy đủ địa giới mới và cũ. Hệ thống không đối chiếu hai cách
            gọi này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="rental-city">Thành phố</FieldLabel>
              <Input id="rental-city" value={draft.city} disabled />
            </Field>
            <Field data-invalid={Boolean(errors.newWard)}>
              <FieldLabel htmlFor="rental-new-ward">
                Phường/xã theo địa giới mới
              </FieldLabel>
              <Input
                id="rental-new-ward"
                value={draft.newWard}
                onChange={(event) => {
                  updateDraft({ newWard: event.target.value })
                  clearError("newWard")
                }}
                aria-invalid={Boolean(errors.newWard)}
              />
              <FieldError>{errors.newWard}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.legacyDistrict)}>
              <FieldLabel htmlFor="rental-legacy-district">
                Quận/huyện cũ
              </FieldLabel>
              <Input
                id="rental-legacy-district"
                value={draft.legacyDistrict}
                onChange={(event) => {
                  updateDraft({ legacyDistrict: event.target.value })
                  clearError("legacyDistrict")
                }}
                placeholder="Ví dụ: Quận Bình Thạnh"
                aria-invalid={Boolean(errors.legacyDistrict)}
              />
              <FieldError>{errors.legacyDistrict}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.legacyWard)}>
              <FieldLabel htmlFor="rental-legacy-ward">
                Phường/xã cũ
              </FieldLabel>
              <Input
                id="rental-legacy-ward"
                value={draft.legacyWard}
                onChange={(event) => {
                  updateDraft({ legacyWard: event.target.value })
                  clearError("legacyWard")
                }}
                aria-invalid={Boolean(errors.legacyWard)}
              />
              <FieldError>{errors.legacyWard}</FieldError>
            </Field>
            <Field
              className="md:col-span-2"
              data-invalid={Boolean(errors.addressDetail)}
            >
              <FieldLabel htmlFor="rental-address">Địa chỉ đầy đủ</FieldLabel>
              <Input
                id="rental-address"
                value={draft.addressDetail}
                onChange={(event) => {
                  updateDraft({ addressDetail: event.target.value })
                  clearError("addressDetail")
                }}
                placeholder="Số nhà, tên đường, phường/xã, TP.HCM"
                aria-invalid={Boolean(errors.addressDetail)}
              />
              <FieldError>{errors.addressDetail}</FieldError>
            </Field>
            <Field
              className="md:col-span-2"
              data-invalid={Boolean(errors.googleMapsUrl)}
            >
              <FieldLabel htmlFor="rental-map">Link Google Maps</FieldLabel>
              <Input
                id="rental-map"
                type="url"
                value={draft.googleMapsUrl}
                onChange={(event) => {
                  updateDraft({ googleMapsUrl: event.target.value })
                  clearError("googleMapsUrl")
                }}
                placeholder="https://maps.google.com/..."
                aria-invalid={Boolean(errors.googleMapsUrl)}
              />
              <FieldError>{errors.googleMapsUrl}</FieldError>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="rental-nearby">
                Địa điểm nổi bật lân cận
              </FieldLabel>
              <Input
                id="rental-nearby"
                value={nearbyText}
                onChange={(event) => setNearbyText(event.target.value)}
                placeholder="Tối đa 3 địa điểm, ngăn cách bằng dấu phẩy"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giá và chi phí</CardTitle>
          <CardDescription>
            Các khoản khác như tiền cọc, internet, gửi xe hoặc phí rác có thể
            ghi chung ở phần chi phí khác.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid md:grid-cols-2">
            <Field data-invalid={Boolean(errors.monthlyPrice)}>
              <FieldLabel htmlFor="rental-price">
                Giá thuê mỗi tháng (đ)
              </FieldLabel>
              <Input
                id="rental-price"
                type="number"
                min={0}
                step={100000}
                value={draft.monthlyPrice || ""}
                onChange={(event) => {
                  updateDraft({ monthlyPrice: Number(event.target.value) || 0 })
                  clearError("monthlyPrice")
                }}
                aria-invalid={Boolean(errors.monthlyPrice)}
              />
              <FieldError>{errors.monthlyPrice}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.areaM2)}>
              <FieldLabel htmlFor="rental-area">Diện tích (m²)</FieldLabel>
              <Input
                id="rental-area"
                type="number"
                min={0}
                value={draft.areaM2 || ""}
                onChange={(event) => {
                  updateDraft({ areaM2: Number(event.target.value) || 0 })
                  clearError("areaM2")
                }}
                aria-invalid={Boolean(errors.areaM2)}
              />
              <FieldError>{errors.areaM2}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="rental-occupants">
                Số người ở tối đa
              </FieldLabel>
              <Input
                id="rental-occupants"
                type="number"
                min={1}
                value={draft.maxOccupants}
                onChange={(event) =>
                  updateDraft({
                    maxOccupants: Math.max(1, Number(event.target.value) || 1),
                  })
                }
              />
            </Field>
            <Field data-invalid={Boolean(errors.electricityPrice)}>
              <FieldLabel htmlFor="rental-electricity">Giá điện</FieldLabel>
              <Input
                id="rental-electricity"
                value={draft.electricityPrice}
                onChange={(event) => {
                  updateDraft({ electricityPrice: event.target.value })
                  clearError("electricityPrice")
                }}
                placeholder="Ví dụ: 4.000đ/kWh"
                aria-invalid={Boolean(errors.electricityPrice)}
              />
              <FieldError>{errors.electricityPrice}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.waterPrice)}>
              <FieldLabel htmlFor="rental-water">Giá nước</FieldLabel>
              <Input
                id="rental-water"
                value={draft.waterPrice}
                onChange={(event) => {
                  updateDraft({ waterPrice: event.target.value })
                  clearError("waterPrice")
                }}
                placeholder="Ví dụ: 100.000đ/người/tháng"
                aria-invalid={Boolean(errors.waterPrice)}
              />
              <FieldError>{errors.waterPrice}</FieldError>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="rental-other-costs">Chi phí khác</FieldLabel>
              <Textarea
                id="rental-other-costs"
                value={draft.otherCosts}
                onChange={(event) =>
                  updateDraft({ otherCosts: event.target.value })
                }
                placeholder="Tiền cọc, internet, gửi xe, phí rác hoặc chi phí phát sinh khác"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tiện ích phòng</CardTitle>
          <CardDescription>Chọn đúng những tiện ích đang có.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend variant="label">Danh sách tiện ích</FieldLegend>
            <FieldGroup className="grid sm:grid-cols-2 lg:grid-cols-3">
              {rentalAmenityOptions.map((option) => (
                <Field key={option.value} orientation="horizontal">
                  <Checkbox
                    id={`amenity-${option.value}`}
                    checked={draft.amenities.includes(option.value)}
                    onCheckedChange={(checked) =>
                      updateDraft({
                        amenities: toggleValue(
                          draft.amenities,
                          option.value,
                          checked === true
                        ),
                      })
                    }
                  />
                  <FieldLabel htmlFor={`amenity-${option.value}`}>
                    {option.label}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>
          <Field className="mt-5">
            <FieldLabel htmlFor="rental-custom-amenities">
              Tiện ích khác
            </FieldLabel>
            <Input
              id="rental-custom-amenities"
              value={customAmenityText}
              onChange={(event) => setCustomAmenityText(event.target.value)}
              placeholder="Ngăn cách bằng dấu phẩy"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quy định</CardTitle>
          <CardDescription>
            Mỗi dòng hoặc mỗi nội dung ngăn cách bằng dấu phẩy sẽ trở thành một
            mục riêng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="rental-allowed">Được phép</FieldLabel>
              <Textarea
                id="rental-allowed"
                value={allowedText}
                onChange={(event) => setAllowedText(event.target.value)}
                rows={5}
                placeholder="Nấu ăn&#10;Giờ giấc tự do"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="rental-disallowed">
                Không được phép
              </FieldLabel>
              <Textarea
                id="rental-disallowed"
                value={disallowedText}
                onChange={(event) => setDisallowedText(event.target.value)}
                rows={5}
                placeholder="Hút thuốc trong phòng"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Hình ảnh và video</CardTitle>
              <CardDescription>
                Cần tối thiểu 3 ảnh để xuất bản. Ảnh JPG, PNG hoặc WEBP, tối đa
                8MB mỗi ảnh.
              </CardDescription>
            </div>
            <Badge variant="outline">{imageCountLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field data-invalid={Boolean(errors.images)}>
            <FieldLabel htmlFor="rental-images">Tải ảnh</FieldLabel>
            <Input
              id="rental-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading || draft.media.images.length >= 12}
              onChange={(event) => void uploadImages(event.target.files)}
              aria-invalid={Boolean(errors.images)}
            />
            <FieldDescription>
              {uploading ? "Đang tải ảnh..." : "Tối đa 12 ảnh cho một tin."}
            </FieldDescription>
            <FieldError>{errors.images}</FieldError>
          </Field>

          {sortedImages.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedImages.map((image) => (
                <div key={image.id} className="border bg-muted/30 p-2">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt={image.caption || "Ảnh phòng trọ"}
                      className="size-full object-cover"
                    />
                    {image.isThumbnail ? (
                      <Badge className="absolute top-2 left-2">Ảnh đại diện</Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!image.isThumbnail ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setThumbnail(image.id)}
                      >
                        <CheckCircleIcon data-icon="inline-start" />
                        Chọn đại diện
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
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
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 border bg-muted/20 text-center text-muted-foreground">
              <ImageSquareIcon aria-hidden />
              <p className="text-sm">Chưa có ảnh phòng.</p>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="rental-video">Link video</FieldLabel>
            <Textarea
              id="rental-video"
              value={videoText}
              onChange={(event) => setVideoText(event.target.value)}
              rows={3}
              placeholder="Mỗi dòng một URL, không bắt buộc"
            />
          </Field>
        </CardContent>
      </Card>

      {mode === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Quản lý nội bộ</CardTitle>
            <CardDescription>
              Các thông tin này không xuất hiện trên trang public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Trạng thái xuất bản</FieldLegend>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={draft.publicationStatus}
                  onValueChange={(value) => {
                    if (value) {
                      updateDraft({
                        publicationStatus: value as RentalPublicationStatus,
                      })
                    }
                  }}
                  className="flex flex-wrap justify-start"
                >
                  {(["draft", "published", "hidden", "archived"] as const).map(
                    (status) => (
                      <ToggleGroupItem key={status} value={status}>
                        {rentalPublicationStatusLabels[status]}
                      </ToggleGroupItem>
                    )
                  )}
                </ToggleGroup>
              </FieldSet>
              {draft.publicationStatus === "hidden" ? (
                <Field>
                  <FieldLabel htmlFor="rental-hidden-reason">Lý do ẩn</FieldLabel>
                  <Textarea
                    id="rental-hidden-reason"
                    value={draft.hiddenReason}
                    onChange={(event) =>
                      updateDraft({ hiddenReason: event.target.value })
                    }
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="rental-internal-note">
                  Ghi chú admin
                </FieldLabel>
                <Textarea
                  id="rental-internal-note"
                  value={draft.internalNote}
                  onChange={(event) =>
                    updateDraft({ internalNote: event.target.value })
                  }
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {notice ? (
        <Alert>
          <AlertTitle>Trạng thái</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardFooter className="flex-wrap justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href={backHref}>Hủy</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving || uploading}
              onClick={() => void persist("draft")}
            >
              <UploadSimpleIcon data-icon="inline-start" />
              Lưu bản nháp
            </Button>
            <Button
              type="button"
              disabled={saving || uploading}
              onClick={() =>
                void persist(
                  mode === "admin"
                    ? draft.publicationStatus
                    : draft.publicationStatus === "hidden"
                      ? "hidden"
                      : "published"
                )
              }
            >
              <CheckCircleIcon data-icon="inline-start" />
              {draft.publicationStatus === "hidden"
                ? "Lưu thay đổi"
                : mode === "admin"
                  ? "Lưu tin"
                  : "Xuất bản tin"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}

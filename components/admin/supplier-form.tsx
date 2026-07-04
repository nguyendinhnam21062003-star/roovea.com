"use client"

import { useMemo, useState } from "react"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"

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
import {
  accommodationTypeOptions,
  genderOptions,
  provinceOptions,
  serviceTypeLabels,
  serviceTypeOptions,
  supplierStatusOptions,
} from "@/lib/admin/options"
import {
  isValidCitizenId,
  isValidUrl,
  isValidVietnamPhone,
  makeId,
} from "@/lib/admin/helpers"
import type {
  AccommodationType,
  Gender,
  ServiceArea,
  ServiceType,
  Supplier,
  SupplierStatus,
} from "@/lib/admin/types"

type SupplierFormProps = {
  supplier: Supplier
  mode: "create" | "edit"
  compact?: boolean
  submitLabel?: string
  onCancel?: () => void
  onSubmit: (supplier: Supplier) => void | Promise<void>
}

type SupplierErrors = Partial<Record<keyof Supplier | "serviceAreas", string>>

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

function validateSupplier(supplier: Supplier) {
  const errors: SupplierErrors = {}

  if (!supplier.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ và tên."
  }

  if (supplier.citizenId && !isValidCitizenId(supplier.citizenId)) {
    errors.citizenId = "CCCD chỉ gồm 9 hoặc 12 chữ số giả trong prototype."
  }

  if (supplier.age && (supplier.age < 18 || supplier.age > 100)) {
    errors.age = "Tuổi cần nằm trong khoảng 18-100."
  }

  if (!isValidVietnamPhone(supplier.phone)) {
    errors.phone = "Vui lòng nhập số điện thoại Việt Nam hợp lệ."
  }

  if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) {
    errors.email = "Email chưa đúng định dạng."
  }

  if (supplier.facebookUrl && !isValidUrl(supplier.facebookUrl)) {
    errors.facebookUrl = "Facebook cần là URL hợp lệ."
  }

  if (supplier.tiktokUrl && !isValidUrl(supplier.tiktokUrl)) {
    errors.tiktokUrl = "TikTok cần là URL hợp lệ."
  }

  if (supplier.serviceTypes.length === 0) {
    errors.serviceTypes = "Chọn ít nhất một loại dịch vụ."
  }

  return errors
}

export function SupplierForm({
  supplier,
  mode,
  compact = false,
  submitLabel,
  onCancel,
  onSubmit,
}: SupplierFormProps) {
  const [draft, setDraft] = useState<Supplier>(() =>
    JSON.parse(JSON.stringify(supplier))
  )
  const [errors, setErrors] = useState<SupplierErrors>({})
  const [saving, setSaving] = useState(false)

  const providesAccommodation = draft.serviceTypes.includes("accommodation")

  const serviceSummary = useMemo(
    () =>
      draft.serviceTypes
        .map((value) => serviceTypeLabels[value])
        .filter(Boolean)
        .join(", "),
    [draft.serviceTypes]
  )

  function updateField<Key extends keyof Supplier>(
    key: Key,
    value: Supplier[Key]
  ) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function updateServiceArea(id: string, patch: Partial<ServiceArea>) {
    setDraft((current) => ({
      ...current,
      serviceAreas: current.serviceAreas.map((area) =>
        area.id === id ? { ...area, ...patch } : area
      ),
    }))
  }

  function addServiceArea() {
    setDraft((current) => ({
      ...current,
      serviceAreas: [
        ...current.serviceAreas,
        {
          id: makeId("area"),
          country: "Việt Nam",
          provinceCity: "",
          districtCity: "",
        },
      ],
    }))
  }

  function removeServiceArea(id: string) {
    setDraft((current) => ({
      ...current,
      serviceAreas:
        current.serviceAreas.length > 1
          ? current.serviceAreas.filter((area) => area.id !== id)
          : current.serviceAreas,
    }))
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateSupplier(draft)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      await onSubmit({
        ...draft,
        zalo: draft.zalo || draft.phone,
        accommodationTypes: providesAccommodation
          ? draft.accommodationTypes
          : [],
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submitForm} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? "Thông tin nhà cung cấp mới"
              : "Chỉnh sửa nhà cung cấp"}
          </CardTitle>
          <CardDescription>
            CCCD là dữ liệu nội bộ, chỉ hiển thị đầy đủ trong form quản trị.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="supplier-code">Mã nhà cung cấp</FieldLabel>
              <Input id="supplier-code" value={draft.supplierCode} readOnly />
              <FieldDescription>
                Mã tự sinh, không tái sử dụng trong database.
              </FieldDescription>
            </Field>
            <Field data-invalid={Boolean(errors.fullName)}>
              <FieldLabel htmlFor="supplier-full-name">Họ và tên</FieldLabel>
              <Input
                id="supplier-full-name"
                value={draft.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                aria-invalid={Boolean(errors.fullName)}
                placeholder="Nhập họ tên"
              />
              <FieldError>{errors.fullName}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.citizenId)}>
              <FieldLabel htmlFor="supplier-citizen-id">Số CCCD</FieldLabel>
              <Input
                id="supplier-citizen-id"
                inputMode="numeric"
                value={draft.citizenId}
                onChange={(event) =>
                  updateField(
                    "citizenId",
                    event.target.value.replace(/\D/g, "")
                  )
                }
                aria-invalid={Boolean(errors.citizenId)}
                placeholder="Dữ liệu giả, chỉ dùng nội bộ"
              />
              <FieldError>{errors.citizenId}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.age)}>
              <FieldLabel htmlFor="supplier-age">Tuổi</FieldLabel>
              <Input
                id="supplier-age"
                type="number"
                min={18}
                max={100}
                value={draft.age ?? ""}
                onChange={(event) =>
                  updateField(
                    "age",
                    event.target.value ? Number(event.target.value) : undefined
                  )
                }
                aria-invalid={Boolean(errors.age)}
              />
              <FieldError>{errors.age}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-gender">Giới tính</FieldLabel>
              <Select
                value={draft.gender}
                onValueChange={(value) =>
                  updateField("gender", value as Gender)
                }
              >
                <SelectTrigger id="supplier-gender" className="w-full">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-status">
                Trạng thái hợp tác
              </FieldLabel>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  updateField("status", value as SupplierStatus)
                }
              >
                <SelectTrigger id="supplier-status" className="w-full">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {supplierStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liên hệ và nơi ở</CardTitle>
          <CardDescription>
            Zalo mặc định lấy theo số điện thoại khi tạo mới nếu để trống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor="supplier-phone">Số điện thoại</FieldLabel>
              <Input
                id="supplier-phone"
                value={draft.phone}
                onChange={(event) => {
                  const phone = event.target.value
                  setDraft((current) => ({
                    ...current,
                    phone,
                    zalo:
                      mode === "create" && !current.zalo ? phone : current.zalo,
                  }))
                  setErrors((current) => ({ ...current, phone: undefined }))
                }}
                aria-invalid={Boolean(errors.phone)}
                placeholder="0900000000"
              />
              <FieldError>{errors.phone}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-zalo">Zalo</FieldLabel>
              <Input
                id="supplier-zalo"
                value={draft.zalo}
                onChange={(event) => updateField("zalo", event.target.value)}
              />
            </Field>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="supplier-email">Email</FieldLabel>
              <Input
                id="supplier-email"
                type="email"
                value={draft.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.facebookUrl)}>
              <FieldLabel htmlFor="supplier-facebook">Facebook</FieldLabel>
              <Input
                id="supplier-facebook"
                value={draft.facebookUrl}
                onChange={(event) =>
                  updateField("facebookUrl", event.target.value)
                }
                aria-invalid={Boolean(errors.facebookUrl)}
                placeholder="https://facebook.com/..."
              />
              <FieldError>{errors.facebookUrl}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.tiktokUrl)}>
              <FieldLabel htmlFor="supplier-tiktok">TikTok</FieldLabel>
              <Input
                id="supplier-tiktok"
                value={draft.tiktokUrl}
                onChange={(event) =>
                  updateField("tiktokUrl", event.target.value)
                }
                aria-invalid={Boolean(errors.tiktokUrl)}
                placeholder="https://www.tiktok.com/@..."
              />
              <FieldError>{errors.tiktokUrl}</FieldError>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="supplier-address">Địa chỉ/Nơi ở</FieldLabel>
              <Textarea
                id="supplier-address"
                value={draft.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Địa chỉ liên hệ nội bộ"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động dịch vụ</CardTitle>
          <CardDescription>
            {serviceSummary || "Chưa chọn loại dịch vụ cung cấp."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field data-invalid={Boolean(errors.serviceTypes)}>
            <FieldLabel>Loại dịch vụ cung cấp</FieldLabel>
            <div className="grid gap-2 md:grid-cols-3">
              {serviceTypeOptions.map((option) => (
                <Field key={option.value} orientation="horizontal">
                  <Checkbox
                    id={`service-${option.value}`}
                    checked={draft.serviceTypes.includes(option.value)}
                    onCheckedChange={(checked) =>
                      updateField(
                        "serviceTypes",
                        toggleValue(
                          draft.serviceTypes,
                          option.value as ServiceType,
                          checked === true
                        )
                      )
                    }
                  />
                  <FieldLabel htmlFor={`service-${option.value}`}>
                    {option.label}
                  </FieldLabel>
                </Field>
              ))}
            </div>
            <FieldError>{errors.serviceTypes}</FieldError>
          </Field>

          {providesAccommodation ? (
            <Field>
              <FieldLabel>Loại hình lưu trú có thể cung cấp</FieldLabel>
              <div className="grid gap-2 md:grid-cols-3">
                {accommodationTypeOptions.map((option) => (
                  <Field key={option.value} orientation="horizontal">
                    <Checkbox
                      id={`supplier-accommodation-${option.value}`}
                      checked={draft.accommodationTypes.includes(option.value)}
                      onCheckedChange={(checked) =>
                        updateField(
                          "accommodationTypes",
                          toggleValue(
                            draft.accommodationTypes,
                            option.value as AccommodationType,
                            checked === true
                          )
                        )
                      }
                    />
                    <FieldLabel
                      htmlFor={`supplier-accommodation-${option.value}`}
                    >
                      {option.label}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </Field>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-sm font-medium">
                  Phạm vi hoạt động dịch vụ
                </h3>
                <p className="text-xs text-muted-foreground">
                  Có thể thêm nhiều khu vực theo Quốc gia, Tỉnh/Thành phố và
                  Quận/Huyện.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addServiceArea}>
                <PlusIcon data-icon="inline-start" />
                Thêm khu vực
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {draft.serviceAreas.map((area, index) => (
                <div
                  key={area.id}
                  className="grid gap-3 border bg-muted/30 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <Field>
                    <FieldLabel htmlFor={`area-country-${area.id}`}>
                      Quốc gia
                    </FieldLabel>
                    <Input
                      id={`area-country-${area.id}`}
                      value={area.country}
                      onChange={(event) =>
                        updateServiceArea(area.id, {
                          country: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`area-province-${area.id}`}>
                      Tỉnh/Thành phố
                    </FieldLabel>
                    <Select
                      value={area.provinceCity || "manual"}
                      onValueChange={(value) =>
                        updateServiceArea(area.id, {
                          provinceCity: value === "manual" ? "" : value,
                          districtCity: "",
                        })
                      }
                    >
                      <SelectTrigger
                        id={`area-province-${area.id}`}
                        className="w-full"
                      >
                        <SelectValue placeholder="Chọn tỉnh/thành" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="manual">Nhập tay</SelectItem>
                          {provinceOptions.map((province) => (
                            <SelectItem
                              key={province.value}
                              value={province.value}
                            >
                              {province.value}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {!area.provinceCity ? (
                      <Input
                        value={area.provinceCity}
                        onChange={(event) =>
                          updateServiceArea(area.id, {
                            provinceCity: event.target.value,
                          })
                        }
                        placeholder="Hoặc nhập tỉnh/thành"
                      />
                    ) : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`area-district-${area.id}`}>
                      Quận/Huyện
                    </FieldLabel>
                    <Input
                      id={`area-district-${area.id}`}
                      value={area.districtCity}
                      onChange={(event) =>
                        updateServiceArea(area.id, {
                          districtCity: event.target.value,
                        })
                      }
                      placeholder="Quận/Huyện"
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Xóa khu vực ${index + 1}`}
                      disabled={draft.serviceAreas.length === 1}
                      onClick={() => removeServiceArea(area.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!compact ? (
        <Card>
          <CardHeader>
            <CardTitle>Quản trị nội bộ</CardTitle>
            <CardDescription>
              Ghi chú này chỉ dùng trong màn hình admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="supplier-note">Ghi chú nội bộ</FieldLabel>
                <Textarea
                  id="supplier-note"
                  value={draft.internalNote}
                  onChange={(event) =>
                    updateField("internalNote", event.target.value)
                  }
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Tạo: {draft.createdAt}</Badge>
                <Badge variant="outline">Cập nhật: {draft.updatedAt}</Badge>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardFooter className="justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {mode === "create"
              ? "Nhà cung cấp sẽ xuất hiện ngay sau khi lưu database."
              : "Ngày cập nhật sẽ tự đổi sau khi lưu."}
          </div>
          <div className="flex flex-wrap gap-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            ) : null}
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : (submitLabel ?? "Lưu nhà cung cấp")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}

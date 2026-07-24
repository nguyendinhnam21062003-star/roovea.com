"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BedIcon,
  BuildingsIcon,
  CaretUpDownIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  HouseLineIcon,
  MapPinIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UploadSimpleIcon,
  UsersThreeIcon,
  XIcon,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type {
  ListingActorMode,
  ListingSupplierOption,
  UnifiedListing,
} from "@/lib/listings/types"

type ListingMode = "long_stay" | "short_stay"
type AddressSystem = "new" | "legacy"

type LegacyDistrict = {
  code: number
  name: string
  codename: string
  division_type: string
  province_code: number
}

type LegacyWard = {
  code: number
  name: string
  codename: string
  division_type: string
  district_code: number
}

type LegacyProvince = {
  code: number
  name: string
  codename: string
  division_type: string
  districts: LegacyDistrict[]
}

type NewWard = {
  code: number
  name: string
  codename: string
  division_type: string
  province_code?: number
}

type NewProvince = {
  code: number
  name: string
  codename: string
  division_type: string
  wards: NewWard[]
}

type LegacyWardMapping = {
  code: number
  name: string
  codename: string
  division_type: string
  district_code: number
  province_code: number
}

type NewWardMapping = {
  source_code: number
  ward: NewWard & { province_code: number }
}

type CommonDraft = {
  title: string
  addressSystem: AddressSystem
  provinceCode: string
  districtCode: string
  legacyWardCode: string
  newProvinceCode: string
  newWardCode: string
  addressDetail: string
  googleMapsUrl: string
  nearbyText: string
  additionalCosts: string
  description: string
  policyDescription: string
  allowedText: string
  disallowedText: string
}

type LongStayDraft = {
  types: string[]
  otherType: string
  ownerLivesOnSite: string
  monthlyPrice: string
  areaM2: string
  maxOccupants: string
  minimumLease: string
}

type ShortStayDraft = {
  types: string[]
  otherType: string
  nightlyPrice: string
  maxAdults: string
  maxChildren: string
  bedrooms: string
  bathrooms: string
  checkIn: string
  checkOut: string
}

type AmenityDraft = {
  selected: string[]
  customText: string
}

type MockImage = {
  id: string
  name: string
  url: string
  caption: string
  file?: File
}

type SearchOption = {
  value: string
  label: string
  keywords?: string[]
}

type LegacyMappingOption = SearchOption & {
  provinceCode: string
  districtCode: string
  wardCode: string
  wardName: string
}

type NewMappingOption = SearchOption & {
  provinceCode: string
  wardCode: string
}

const provinceProxyUrl = "/api/public/provinces"
const legacyProvinceApiUrl = `${provinceProxyUrl}?resource=legacy-provinces`
const newProvinceApiUrl = `${provinceProxyUrl}?resource=new-provinces`

let provinceRequest: Promise<LegacyProvince[]> | null = null
let newProvinceRequest: Promise<NewProvince[]> | null = null
const legacyDistrictRequests = new Map<number, Promise<LegacyWard[]>>()

function getLegacyProvinces() {
  if (!provinceRequest) {
    provinceRequest = fetch(legacyProvinceApiUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được dữ liệu địa chỉ.")
        return response.json() as Promise<LegacyProvince[]>
      })
      .catch((error) => {
        provinceRequest = null
        throw error
      })
  }

  return provinceRequest
}

function getNewProvinces() {
  if (!newProvinceRequest) {
    newProvinceRequest = fetch(newProvinceApiUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Không tải được dữ liệu địa chỉ mới.")
        return response.json() as Promise<NewProvince[]>
      })
      .catch((error) => {
        newProvinceRequest = null
        throw error
      })
  }

  return newProvinceRequest
}

async function getLegacyMappingsFromNewWard(code: number) {
  const response = await fetch(
    `${provinceProxyUrl}?resource=to-legacies&code=${code}`
  )
  if (!response.ok) throw new Error("Không ánh xạ được địa chỉ cũ.")
  return response.json() as Promise<LegacyWardMapping[]>
}

function getLegacyWards(code: number) {
  const cached = legacyDistrictRequests.get(code)
  if (cached) return cached

  const request = fetch(
    `${provinceProxyUrl}?resource=legacy-district&code=${code}`
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Không tải được Phường/Xã cũ.")
      const district = (await response.json()) as { wards: LegacyWard[] }
      return district.wards
    })
    .catch((error) => {
      legacyDistrictRequests.delete(code)
      throw error
    })

  legacyDistrictRequests.set(code, request)
  return request
}

async function getNewMappingsFromLegacyWard(code: number) {
  const response = await fetch(
    `${provinceProxyUrl}?resource=from-legacy&code=${code}`
  )
  if (!response.ok) throw new Error("Không ánh xạ được Phường/Xã mới.")
  const payload = (await response.json()) as NewWardMapping | NewWardMapping[]
  return (Array.isArray(payload) ? payload : [payload]).filter((mapping) =>
    Boolean(mapping?.ward?.code)
  )
}

const longStayTypes = [
  { value: "apartment", label: "Chung cư" },
  { value: "mini_apartment", label: "Chung cư mini" },
  { value: "boarding_room", label: "Phòng trọ" },
  { value: "dormitory", label: "Ký túc xá" },
  { value: "whole_house", label: "Nhà nguyên căn" },
  { value: "room_in_house", label: "Phòng trong nhà" },
  { value: "other", label: "Khác" },
]

const shortStayTypes = [
  { value: "homestay", label: "Homestay" },
  { value: "apartment", label: "Chung cư" },
  { value: "hotel", label: "Khách sạn" },
  { value: "guesthouse", label: "Nhà nghỉ" },
  { value: "whole_house", label: "Nhà nguyên căn" },
  { value: "villa", label: "Biệt thự" },
  { value: "cruise", label: "Du thuyền" },
  { value: "other", label: "Khác" },
]

function normalizeInitialTypes(
  listing: UnifiedListing | undefined,
  stayType: ListingMode
) {
  if (!listing || listing.stayType !== stayType) {
    return stayType === "long_stay" ? ["boarding_room"] : ["homestay"]
  }

  const options = stayType === "long_stay" ? longStayTypes : shortStayTypes
  const allowed = new Set(options.map((option) => option.value))
  const normalized = listing.accommodationTypes
    .map((type) => {
      if (stayType === "long_stay" && type === "shared_room") {
        return "room_in_house"
      }
      if (stayType === "short_stay" && type === "resort") return "hotel"
      if (stayType === "short_stay" && type === "studio") return "apartment"
      return type
    })
    .filter((type) => allowed.has(type))

  return normalized.length
    ? Array.from(new Set(normalized))
    : stayType === "long_stay"
      ? ["boarding_room"]
      : ["homestay"]
}

const longStayAmenities = [
  "Điều hòa",
  "Nóng lạnh",
  "Giường",
  "Tủ quần áo",
  "Bàn học",
  "Bếp",
  "Máy giặt",
  "Tủ lạnh",
  "Ban công",
  "Cửa sổ",
  "WC riêng",
  "Gác lửng",
  "Thang máy",
  "Chỗ để xe",
  "Internet",
  "Khóa vân tay",
  "Camera an ninh",
]

const shortStayAmenities = [
  "Điều hòa",
  "Hồ bơi",
  "Bếp",
  "Máy giặt",
  "Tủ lạnh",
  "Bãi đỗ xe",
  "BBQ",
  "Ban công",
  "View đẹp",
  "Gần biển",
  "Wifi",
  "Smart TV",
  "Bồn tắm",
  "Máy sấy tóc",
  "Dọn phòng",
  "Lễ tân",
  "Đưa đón sân bay",
]

const steps = [
  { label: "Bắt đầu", description: "Loại hình và tiêu đề" },
  { label: "Địa chỉ", description: "Khu vực và vị trí" },
  { label: "Thông tin chính", description: "Không gian và giá" },
  { label: "Nội dung", description: "Tiện ích và mô tả" },
  { label: "Hình ảnh", description: "Media và chính sách" },
  { label: "Kiểm tra", description: "Xem lại tin đăng" },
]

const selectedOptionClass =
  "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"

function moneyLabel(value: string) {
  const number = Number(value)
  return number > 0 ? `${number.toLocaleString("vi-VN")} đ` : "Chưa nhập"
}

function countWords(value: string) {
  const text = value.trim()
  return text ? text.split(/\s+/).length : 0
}

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function searchKeyword(value: string) {
  return value.replaceAll("_", " ")
}

function isValidOptionalUrl(value: string) {
  if (!value.trim()) return true

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file)
  const maxSide = 1920
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")

  if (!context) {
    bitmap.close()
    throw new Error("Không thể xử lý ảnh này.")
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Không thể tối ưu ảnh.")),
      "image/webp",
      0.8
    )
  })

  const baseName = file.name.replace(/\.[^.]+$/, "")
  return new File([blob], `${baseName}.webp`, { type: "image/webp" })
}

export function UnifiedListingForm({
  actorMode = "owner",
  initialListing,
  suppliers = [],
  defaultStayType = "long_stay",
}: {
  actorMode?: ListingActorMode
  initialListing?: UnifiedListing
  suppliers?: ListingSupplierOption[]
  defaultStayType?: ListingMode
}) {
  const router = useRouter()
  const [mode, setMode] = useState<ListingMode>(
    initialListing?.stayType ?? defaultStayType
  )
  const [step, setStep] = useState(0)
  const [highestStep, setHighestStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savedListingId, setSavedListingId] = useState(
    initialListing?.id ?? ""
  )
  const [publicationStatus, setPublicationStatus] = useState(
    initialListing?.publicationStatus ??
      (actorMode === "owner" ? "published" : "draft")
  )
  const [supplierId, setSupplierId] = useState(
    initialListing?.supplierId ?? ""
  )
  const [internalNote, setInternalNote] = useState(
    initialListing?.internalNote ?? ""
  )
  const [adminOperations, setAdminOperations] = useState(
    initialListing?.admin ?? {
      supplierPrice: 0,
      commissionType: "percentage" as const,
      commissionValue: 0,
      specialCustomerPrice: 0,
      metaTitle: "",
      metaDescription: "",
    }
  )
  const [isFeatured, setIsFeatured] = useState(
    initialListing?.isFeatured ?? false
  )
  const [displayPriority, setDisplayPriority] = useState(
    initialListing?.displayPriority ?? 0
  )
  const [provinces, setProvinces] = useState<LegacyProvince[]>([])
  const [newProvinces, setNewProvinces] = useState<NewProvince[]>([])
  const [legacyWards, setLegacyWards] = useState<LegacyWard[]>([])
  const [addressLoading, setAddressLoading] = useState(true)
  const [legacyWardsLoading, setLegacyWardsLoading] = useState(false)
  const [addressError, setAddressError] = useState("")
  const [mappingLoading, setMappingLoading] = useState(false)
  const [legacyMappingOptions, setLegacyMappingOptions] = useState<
    LegacyMappingOption[]
  >([])
  const [newMappingOptions, setNewMappingOptions] = useState<
    NewMappingOption[]
  >([])
  const [images, setImages] = useState<MockImage[]>(
    initialListing?.media.images.map((image) => ({
      id: image.id,
      name: image.caption || "Ảnh chỗ ở",
      url: image.url,
      caption: image.caption,
    })) ?? []
  )
  const [thumbnailImageId, setThumbnailImageId] = useState(
    initialListing?.media.images.find((image) => image.isThumbnail)?.id ??
      initialListing?.media.images[0]?.id ??
      ""
  )
  const [videoInput, setVideoInput] = useState("")
  const [videoLinks, setVideoLinks] = useState<string[]>(
    initialListing?.media.videoUrls ?? []
  )
  const [optimizingImages, setOptimizingImages] = useState(false)
  const [common, setCommon] = useState<CommonDraft>({
    title: initialListing?.title ?? "",
    addressSystem: initialListing?.address.addressSystem ?? "new",
    provinceCode: String(initialListing?.address.legacyProvinceCode || ""),
    districtCode: String(initialListing?.address.legacyDistrictCode || ""),
    legacyWardCode: String(initialListing?.address.legacyWardCode || ""),
    newProvinceCode: String(initialListing?.address.newProvinceCode || ""),
    newWardCode: String(initialListing?.address.newWardCode || ""),
    addressDetail: initialListing?.address.addressDetail ?? "",
    googleMapsUrl: initialListing?.address.googleMapsUrl ?? "",
    nearbyText: initialListing?.address.nearbyPlaces.join(", ") ?? "",
    additionalCosts: initialListing?.otherCosts ?? "",
    description: initialListing?.description ?? "",
    policyDescription: initialListing?.policyDescription ?? "",
    allowedText: initialListing?.allowedRules.join(", ") ?? "",
    disallowedText: initialListing?.disallowedRules.join(", ") ?? "",
  })
  const [longStay, setLongStay] = useState<LongStayDraft>({
    types: normalizeInitialTypes(initialListing, "long_stay"),
    otherType:
      initialListing?.stayType === "long_stay"
        ? initialListing.otherAccommodationType
        : "",
    ownerLivesOnSite: initialListing?.longStay.ownerLivesOnSite ?? "",
    monthlyPrice: String(initialListing?.longStay.monthlyPrice || ""),
    areaM2: String(initialListing?.longStay.areaM2 || ""),
    maxOccupants: String(initialListing?.longStay.maxOccupants || 2),
    minimumLease: String(
      initialListing?.longStay.minimumLeaseMonths ?? 6
    ),
  })
  const [shortStay, setShortStay] = useState<ShortStayDraft>({
    types: normalizeInitialTypes(initialListing, "short_stay"),
    otherType:
      initialListing?.stayType === "short_stay"
        ? initialListing.otherAccommodationType
        : "",
    nightlyPrice: String(initialListing?.shortStay.nightlyPrice || ""),
    maxAdults: String(initialListing?.shortStay.maxAdults || 2),
    maxChildren: String(initialListing?.shortStay.maxChildren ?? 0),
    bedrooms: String(initialListing?.shortStay.bedrooms ?? 1),
    bathrooms: String(initialListing?.shortStay.bathrooms ?? 1),
    checkIn: initialListing?.shortStay.checkIn || "14:00",
    checkOut: initialListing?.shortStay.checkOut || "12:00",
  })
  const [amenitiesByMode, setAmenitiesByMode] = useState<
    Record<ListingMode, AmenityDraft>
  >({
    long_stay: {
      selected:
        initialListing?.stayType === "long_stay"
          ? [
              ...initialListing.amenities,
              ...(initialListing.customAmenities.length ? ["other"] : []),
            ]
          : [],
      customText:
        initialListing?.stayType === "long_stay"
          ? initialListing.customAmenities.join(", ")
          : "",
    },
    short_stay: {
      selected:
        initialListing?.stayType === "short_stay"
          ? [
              ...initialListing.amenities,
              ...(initialListing.customAmenities.length ? ["other"] : []),
            ]
          : [],
      customText:
        initialListing?.stayType === "short_stay"
          ? initialListing.customAmenities.join(", ")
          : "",
    },
  })

  useEffect(() => {
    let active = true

    Promise.all([getLegacyProvinces(), getNewProvinces()])
      .then(([legacyData, newData]) => {
        if (!active) return
        setProvinces(legacyData)
        setNewProvinces(newData)
        setAddressError("")
      })
      .catch(() => {
        if (!active) return
        setAddressError("Chưa tải được danh sách địa chỉ. Vui lòng thử lại.")
      })
      .finally(() => {
        if (active) setAddressLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const districtCode = initialListing?.address.legacyDistrictCode
    if (!districtCode) return

    let active = true
    getLegacyWards(districtCode)
      .then((wards) => {
        if (active) setLegacyWards(wards)
      })
      .catch(() => {
        if (active) setLegacyWards([])
      })

    return () => {
      active = false
    }
  }, [initialListing?.address.legacyDistrictCode])

  const selectedProvince = useMemo(
    () =>
      provinces.find(
        (province) => String(province.code) === common.provinceCode
      ),
    [common.provinceCode, provinces]
  )
  const selectedDistrict = useMemo(
    () =>
      selectedProvince?.districts.find(
        (district) => String(district.code) === common.districtCode
      ),
    [common.districtCode, selectedProvince]
  )
  const selectedLegacyWard = useMemo(
    () =>
      legacyWards.find((ward) => String(ward.code) === common.legacyWardCode),
    [common.legacyWardCode, legacyWards]
  )
  const selectedLegacyWardName =
    selectedLegacyWard?.name ??
    legacyMappingOptions.find(
      (option) => option.wardCode === common.legacyWardCode
    )?.wardName
  const selectedNewProvince = useMemo(
    () =>
      newProvinces.find(
        (province) => String(province.code) === common.newProvinceCode
      ),
    [common.newProvinceCode, newProvinces]
  )
  const selectedNewWard = useMemo(
    () =>
      selectedNewProvince?.wards.find(
        (ward) => String(ward.code) === common.newWardCode
      ),
    [common.newWardCode, selectedNewProvince]
  )
  const modeLabel =
    mode === "long_stay" ? "Phòng trọ dài hạn" : "Homestay ngắn hạn"
  const typeOptions = mode === "long_stay" ? longStayTypes : shortStayTypes
  const activeTypes = mode === "long_stay" ? longStay.types : shortStay.types
  const activeOtherType =
    mode === "long_stay" ? longStay.otherType : shortStay.otherType
  const amenityOptions =
    mode === "long_stay" ? longStayAmenities : shortStayAmenities
  const activeAmenityDraft = amenitiesByMode[mode]
  const descriptionWords = countWords(common.description)
  const completion = ((step + 1) / steps.length) * 100

  function clearErrors(...keys: string[]) {
    setErrors((current) => {
      const next = { ...current }
      keys.forEach((key) => delete next[key])
      return next
    })
  }

  function retryAddressLoad() {
    setAddressLoading(true)
    setAddressError("")

    Promise.all([getLegacyProvinces(), getNewProvinces()])
      .then(([legacyData, newData]) => {
        setProvinces(legacyData)
        setNewProvinces(newData)
      })
      .catch(() =>
        setAddressError("Chưa tải được danh sách địa chỉ. Vui lòng thử lại.")
      )
      .finally(() => setAddressLoading(false))
  }

  function changeMode(value: string) {
    if (value !== "long_stay" && value !== "short_stay") return
    setMode(value)
    setSubmitted(false)
    clearErrors(
      "types",
      "otherType",
      "price",
      "space",
      "ownerLivesOnSite",
      "amenities",
      "customAmenities"
    )
    toast.info(
      value === "long_stay"
        ? "Đã chuyển sang phòng trọ dài hạn"
        : "Đã chuyển sang homestay ngắn hạn",
      { description: "Những thông tin bạn đã nhập vẫn được giữ lại." }
    )
  }

  function updateTypes(value: string[]) {
    const currentTypes = mode === "long_stay" ? longStay.types : shortStay.types
    const added = value.filter((item) => !currentTypes.includes(item))
    const next = currentTypes
      .filter((item) => value.includes(item))
      .concat(added)

    if (mode === "long_stay") {
      setLongStay((current) => ({ ...current, types: next }))
    } else {
      setShortStay((current) => ({ ...current, types: next }))
    }
    clearErrors("types", "otherType")
  }

  function updateOtherType(value: string) {
    if (mode === "long_stay") {
      setLongStay((current) => ({ ...current, otherType: value }))
    } else {
      setShortStay((current) => ({ ...current, otherType: value }))
    }
    clearErrors("otherType")
  }

  function changeLegacyProvince(value: string) {
    setCommon((current) => ({
      ...current,
      provinceCode: value,
      districtCode: "",
      legacyWardCode: "",
      newProvinceCode: "",
      newWardCode: "",
    }))
    setLegacyWards([])
    setNewMappingOptions([])
    setLegacyMappingOptions([])
    clearErrors("province", "district")
  }

  async function changeLegacyDistrict(value: string) {
    setCommon((current) => ({
      ...current,
      districtCode: value,
      legacyWardCode: "",
      newProvinceCode: "",
      newWardCode: "",
    }))
    setNewMappingOptions([])
    setLegacyMappingOptions([])
    clearErrors("district", "legacyWard", "newWard")
    setLegacyWardsLoading(true)

    try {
      const wards = await getLegacyWards(Number(value))
      setLegacyWards(wards)
    } catch {
      setLegacyWards([])
      toast.error("Chưa tải được danh sách Phường/Xã cũ.")
    } finally {
      setLegacyWardsLoading(false)
    }
  }

  async function changeLegacyWard(value: string) {
    setCommon((current) => ({
      ...current,
      legacyWardCode: value,
      newProvinceCode: "",
      newWardCode: "",
    }))
    setNewMappingOptions([])
    clearErrors("legacyWard", "newWard")
    setMappingLoading(true)

    try {
      const mappings = await getNewMappingsFromLegacyWard(Number(value))
      const unique = new Map<number, NewWardMapping>()
      mappings.forEach((mapping) => unique.set(mapping.ward.code, mapping))
      const options = Array.from(unique.values()).map((mapping) => {
        const province = newProvinces.find(
          (item) => item.code === mapping.ward.province_code
        )
        return {
          value: String(mapping.ward.code),
          label: `${mapping.ward.name}, ${province?.name ?? "Tỉnh/Thành phố mới"}`,
          keywords: [
            searchKeyword(mapping.ward.codename),
            searchKeyword(province?.codename ?? ""),
          ],
          provinceCode: String(mapping.ward.province_code),
          wardCode: String(mapping.ward.code),
        }
      })
      setNewMappingOptions(options)
      if (options.length === 1) {
        setCommon((current) => ({
          ...current,
          newProvinceCode: options[0].provinceCode,
          newWardCode: options[0].wardCode,
        }))
      }
    } catch {
      toast.error("Chưa đối chiếu được Phường/Xã mới. Vui lòng thử lại.")
    } finally {
      setMappingLoading(false)
    }
  }

  function changeNewProvince(value: string) {
    setCommon((current) => ({
      ...current,
      newProvinceCode: value,
      newWardCode: "",
      provinceCode: "",
      districtCode: "",
      legacyWardCode: "",
    }))
    setLegacyWards([])
    setLegacyMappingOptions([])
    setNewMappingOptions([])
    clearErrors("newProvince", "newWard", "province", "district", "legacyWard")
  }

  async function changeNewWard(value: string) {
    setCommon((current) => ({
      ...current,
      newWardCode: value,
      provinceCode: "",
      districtCode: "",
      legacyWardCode: "",
    }))
    setLegacyWards([])
    setLegacyMappingOptions([])
    setNewMappingOptions([])
    clearErrors("newWard", "province", "district", "legacyWard")
    setMappingLoading(true)

    try {
      const mappings = await getLegacyMappingsFromNewWard(Number(value))
      const unique = new Map<number, LegacyWardMapping>()
      mappings.forEach((mapping) => unique.set(mapping.code, mapping))
      const options = Array.from(unique.values()).map((mapping) => {
        const province = provinces.find(
          (item) => item.code === mapping.province_code
        )
        const district = province?.districts.find(
          (item) => item.code === mapping.district_code
        )
        return {
          value: `${mapping.province_code}-${mapping.district_code}-${mapping.code}`,
          label: `${mapping.name}, ${district?.name ?? "Quận/Huyện cũ"}, ${province?.name ?? "Tỉnh/Thành phố cũ"}`,
          keywords: [
            searchKeyword(mapping.codename),
            searchKeyword(district?.codename ?? ""),
            searchKeyword(province?.codename ?? ""),
          ],
          provinceCode: String(mapping.province_code),
          districtCode: String(mapping.district_code),
          wardCode: String(mapping.code),
          wardName: mapping.name,
        }
      })
      setLegacyMappingOptions(options)
      if (options.length === 1) {
        setCommon((current) => ({
          ...current,
          provinceCode: options[0].provinceCode,
          districtCode: options[0].districtCode,
          legacyWardCode: options[0].wardCode,
        }))
      }
    } catch {
      toast.error("Chưa đối chiếu được địa chỉ cũ. Vui lòng thử lại.")
    } finally {
      setMappingLoading(false)
    }
  }

  function validateCurrentStep() {
    const nextErrors: Record<string, string> = {}

    if (step === 0) {
      if (common.title.trim().length < 10) {
        nextErrors.title = "Hãy viết tiêu đề rõ ràng, tối thiểu 10 ký tự."
      }
      if (activeTypes.length === 0) {
        nextErrors.types = "Chọn ít nhất một loại hình chỗ ở."
      }
      if (activeTypes.includes("other") && !activeOtherType.trim()) {
        nextErrors.otherType = "Nhập tên loại hình khác."
      }
    }

    if (step === 1) {
      if (common.addressSystem === "legacy") {
        if (!common.provinceCode)
          nextErrors.province = "Chọn Tỉnh/Thành phố cũ."
        if (!common.districtCode) nextErrors.district = "Chọn Quận/Huyện cũ."
        if (!common.legacyWardCode) {
          nextErrors.legacyWard = "Chọn Phường/Xã cũ."
        }
        if (!common.newWardCode) {
          nextErrors.newWard = "Chọn Phường/Xã mới được hệ thống gợi ý."
        }
      } else {
        if (!common.newProvinceCode) {
          nextErrors.newProvince = "Chọn Tỉnh/Thành phố mới."
        }
        if (!common.newWardCode) nextErrors.newWard = "Chọn Phường/Xã mới."
        if (!common.legacyWardCode) {
          nextErrors.legacyWard = "Xác nhận Phường/Xã cũ tương ứng."
        }
      }
      if (!common.addressDetail.trim()) {
        nextErrors.addressDetail = "Nhập số nhà và tên đường."
      }
      if (!isValidOptionalUrl(common.googleMapsUrl)) {
        nextErrors.googleMapsUrl = "Link Google Maps chưa hợp lệ."
      }
    }

    if (step === 2 && mode === "long_stay") {
      if (Number(longStay.monthlyPrice) <= 0) {
        nextErrors.price = "Nhập giá thuê hàng tháng."
      }
      if (!longStay.ownerLivesOnSite) {
        nextErrors.ownerLivesOnSite = "Xác nhận phòng có chung chủ hay không."
      }
    }

    if (step === 2 && mode === "short_stay") {
      if (Number(shortStay.nightlyPrice) <= 0) {
        nextErrors.price = "Nhập giá bán mỗi đêm."
      }
      if (Number(shortStay.maxAdults) <= 0) {
        nextErrors.space = "Nhập số khách người lớn tối đa."
      }
    }

    if (step === 3) {
      if (activeAmenityDraft.selected.length === 0) {
        nextErrors.amenities = "Chọn ít nhất một tiện ích nổi bật."
      }
      if (
        activeAmenityDraft.selected.includes("other") &&
        !activeAmenityDraft.customText.trim()
      ) {
        nextErrors.customAmenities = "Nhập tiện ích bổ sung."
      }
      if (common.description.trim().length < 30) {
        nextErrors.description = "Mô tả nên có ít nhất 30 ký tự."
      } else if (descriptionWords > 500) {
        nextErrors.description = "Mô tả không được vượt quá 500 từ."
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function nextStep() {
    if (!validateCurrentStep()) return
    const next = Math.min(step + 1, steps.length - 1)
    setStep(next)
    setHighestStep((current) => Math.max(current, next))
    setSubmitted(false)
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0))
    setErrors({})
    setSubmitted(false)
  }

  function goToVisitedStep(index: number) {
    if (index > highestStep) return
    setStep(index)
    setErrors({})
    setSubmitted(false)
  }

  async function handleImages(files: FileList | null) {
    if (!files?.length) return

    const availableSlots = Math.max(12 - images.length, 0)
    const selectedFiles = Array.from(files).slice(0, availableSlots)

    if (!selectedFiles.length) {
      toast.info("Tin đăng đã có đủ 12 ảnh.")
      return
    }

    setOptimizingImages(true)

    try {
      const optimized = await Promise.all(
        selectedFiles.map(async (file) => {
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            throw new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.")
          }

          const compressed = await compressImage(file)
          return {
            id: crypto.randomUUID(),
            name: compressed.name,
            url: URL.createObjectURL(compressed),
            caption: compressed.name,
            file: compressed,
          }
        })
      )
      setImages((current) => {
        const next = [...current, ...optimized].slice(0, 12)
        setThumbnailImageId((thumbnail) => thumbnail || next[0]?.id || "")
        return next
      })
      toast.success(`Đã thêm ${optimized.length} ảnh.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xử lý ảnh."
      )
    } finally {
      setOptimizingImages(false)
    }
  }

  function removeImage(id: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === id)
      if (target?.file) URL.revokeObjectURL(target.url)
      const next = current.filter((image) => image.id !== id)
      setThumbnailImageId((thumbnail) =>
        thumbnail === id ? next[0]?.id || "" : thumbnail
      )
      return next
    })
  }

  function addVideoLink() {
    const value = videoInput.trim()
    if (!isValidOptionalUrl(value) || !value) {
      setErrors((current) => ({
        ...current,
        video: "Nhập link video bắt đầu bằng http:// hoặc https://.",
      }))
      return
    }
    if (videoLinks.includes(value)) {
      setErrors((current) => ({
        ...current,
        video: "Link video này đã được thêm.",
      }))
      return
    }
    setVideoLinks((current) => [...current, value])
    setVideoInput("")
    clearErrors("video")
  }

  function buildPayload(
    mediaImages: Array<{
      id: string
      url: string
      caption: string
      isThumbnail: boolean
    }>
  ) {
    return {
      id: savedListingId,
      stayType: mode,
      title: common.title,
      accommodationTypes: activeTypes,
      otherAccommodationType: activeOtherType,
      description: common.description,
      address: {
        addressSystem: common.addressSystem,
        newProvinceCode: Number(common.newProvinceCode),
        newProvinceName:
          selectedNewProvince?.name ??
          initialListing?.address.newProvinceName ??
          "",
        newWardCode: Number(common.newWardCode),
        newWardName:
          selectedNewWard?.name ??
          initialListing?.address.newWardName ??
          "",
        legacyProvinceCode: Number(common.provinceCode),
        legacyProvinceName:
          selectedProvince?.name ??
          initialListing?.address.legacyProvinceName ??
          "",
        legacyDistrictCode: Number(common.districtCode),
        legacyDistrictName:
          selectedDistrict?.name ??
          initialListing?.address.legacyDistrictName ??
          "",
        legacyWardCode: Number(common.legacyWardCode),
        legacyWardName:
          selectedLegacyWardName ??
          initialListing?.address.legacyWardName ??
          "",
        addressDetail: common.addressDetail,
        googleMapsUrl: common.googleMapsUrl,
        nearbyPlaces: parseCommaList(common.nearbyText),
      },
      longStay: {
        ownerLivesOnSite: longStay.ownerLivesOnSite,
        monthlyPrice: Number(longStay.monthlyPrice),
        areaM2: longStay.areaM2 ? Number(longStay.areaM2) : undefined,
        maxOccupants: Number(longStay.maxOccupants),
        minimumLeaseMonths: Number(longStay.minimumLease),
      },
      shortStay: {
        nightlyPrice: Number(shortStay.nightlyPrice),
        maxAdults: Number(shortStay.maxAdults),
        maxChildren: Number(shortStay.maxChildren),
        bedrooms: Number(shortStay.bedrooms),
        bathrooms: Number(shortStay.bathrooms),
        checkIn: shortStay.checkIn,
        checkOut: shortStay.checkOut,
      },
      otherCosts: common.additionalCosts,
      amenities: activeAmenityDraft.selected.filter(
        (item) => item !== "other"
      ),
      customAmenities: parseCommaList(activeAmenityDraft.customText),
      policyDescription: common.policyDescription,
      allowedRules: parseCommaList(common.allowedText),
      disallowedRules: parseCommaList(common.disallowedText),
      media: { images: mediaImages, videoUrls: videoLinks },
      publicationStatus,
      availabilityStatus:
        initialListing?.availabilityStatus ?? ("available" as const),
      supplierId,
      admin: adminOperations,
      internalNote,
      isFeatured,
      displayPriority,
    }
  }

  async function savePayload(payload: ReturnType<typeof buildPayload>) {
    const id = payload.id
    const endpoint =
      actorMode === "admin"
        ? id
          ? `/api/admin/listings/${id}`
          : "/api/admin/listings"
        : id
          ? `/api/taikhoan/tindang/${id}`
          : "/api/taikhoan/tindang"
    const response = await fetch(endpoint, {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = (await response.json().catch(() => ({}))) as {
      listing?: UnifiedListing
      error?: string
    }
    if (!response.ok || !result.listing) {
      throw new Error(result.error ?? "Không thể lưu tin đăng.")
    }
    return result.listing
  }

  async function uploadImage(listingId: string, image: MockImage) {
    if (!image.file) return null
    const formData = new FormData()
    formData.append("file", image.file)
    const endpoint =
      actorMode === "admin"
        ? "/api/admin/uploads"
        : `/api/taikhoan/tindang/${listingId}/upload`
    const response = await fetch(endpoint, { method: "POST", body: formData })
    const result = (await response.json().catch(() => ({}))) as {
      media?: { id: string; url: string }
      error?: string
    }
    if (!response.ok || !result.media) {
      throw new Error(result.error ?? `Không thể upload ${image.name}.`)
    }
    return {
      localId: image.id,
      id: result.media.id,
      url: result.media.url,
      caption: image.caption,
    }
  }

  async function finishPreview() {
    setSubmitting(true)

    try {
      const existingImages = images
        .filter((image) => !image.file)
        .map((image) => ({
          id: image.id,
          url: image.url,
          caption: image.caption,
          isThumbnail: image.id === thumbnailImageId,
        }))
      let saved = await savePayload(buildPayload(existingImages))
      setSavedListingId(saved.id)
      const uploaded = (
        await Promise.all(
          images
            .filter((image) => image.file)
            .map((image) => uploadImage(saved.id, image))
        )
      ).filter(Boolean) as Array<{
        localId: string
        id: string
        url: string
        caption: string
      }>

      if (uploaded.length) {
        saved = await savePayload({
          ...buildPayload([
            ...existingImages,
            ...uploaded.map((image) => ({
              id: image.id,
              url: image.url,
              caption: image.caption,
              isThumbnail: image.localId === thumbnailImageId,
            })),
          ]),
          id: saved.id,
        })
      }

      setSubmitted(true)
      toast.success(
        actorMode === "admin"
          ? "Đã lưu tin đăng."
          : "Tin đăng đã được công khai."
      )
      router.push(
        actorMode === "admin"
          ? "/admin/listings"
          : "/taikhoan/tindang"
      )
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu tin đăng."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="font-heading text-3xl font-semibold md:text-5xl">
            Đăng chỗ ở cùng Roovea
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Chọn cách bạn muốn cho thuê, Roovea sẽ chỉ hỏi những thông tin cần
            thiết cho loại tin đó.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bạn muốn đăng loại chỗ ở nào?</CardTitle>
            <CardDescription>
              Thông tin chung được giữ nguyên khi bạn chuyển qua lại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={changeMode}
              variant="outline"
              className="grid w-full gap-3 md:grid-cols-2"
              aria-label="Chọn loại tin đăng"
            >
              <ToggleGroupItem
                value="long_stay"
                className="h-auto min-w-0 items-start justify-start px-4 py-4 text-left whitespace-normal"
              >
                <HouseLineIcon data-icon="inline-start" />
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <strong>Phòng trọ · Dài hạn</strong>
                  <span className="font-normal text-muted-foreground">
                    Thuê theo tháng, có chi phí sinh hoạt và thời hạn thuê.
                  </span>
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="short_stay"
                className="h-auto min-w-0 items-start justify-start px-4 py-4 text-left whitespace-normal"
              >
                <BedIcon data-icon="inline-start" />
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <strong>Homestay · Ngắn hạn</strong>
                  <span className="font-normal text-muted-foreground">
                    Đặt theo đêm, có sức chứa và giờ nhận/trả phòng.
                  </span>
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        {actorMode === "admin" ? (
          <Card>
            <CardHeader>
              <CardTitle>Vận hành nội bộ</CardTitle>
              <CardDescription>
                Chỉ quản trị viên nhìn thấy các trường này.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Nhà cung cấp</FieldLabel>
                  <SearchCombobox
                    value={supplierId}
                    options={suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: supplier.label,
                    }))}
                    placeholder="Chọn nhà cung cấp nếu có"
                    searchPlaceholder="Tìm nhà cung cấp..."
                    emptyText="Không tìm thấy nhà cung cấp."
                    onChange={setSupplierId}
                  />
                </Field>
                <FieldSet>
                  <FieldLegend>Giá và hoa hồng nội bộ</FieldLegend>
                  <FieldDescription>
                    Giá bán thông thường vẫn được khai báo trong bước thông
                    tin chính.
                  </FieldDescription>
                  <FieldGroup className="grid md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="supplier-price">
                        Giá nhà cung cấp
                      </FieldLabel>
                      <Input
                        id="supplier-price"
                        type="number"
                        min={0}
                        value={adminOperations.supplierPrice}
                        onChange={(event) =>
                          setAdminOperations((current) => ({
                            ...current,
                            supplierPrice: Number(event.target.value),
                          }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="commission-value">
                        Giá trị hoa hồng
                      </FieldLabel>
                      <Input
                        id="commission-value"
                        type="number"
                        min={0}
                        value={adminOperations.commissionValue}
                        onChange={(event) =>
                          setAdminOperations((current) => ({
                            ...current,
                            commissionValue: Number(event.target.value),
                          }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Loại hoa hồng</FieldLabel>
                      <ToggleGroup
                        type="single"
                        value={adminOperations.commissionType}
                        onValueChange={(value) => {
                          if (value === "percentage" || value === "fixed") {
                            setAdminOperations((current) => ({
                              ...current,
                              commissionType: value,
                            }))
                          }
                        }}
                        variant="outline"
                        className="justify-start"
                      >
                        <ToggleGroupItem value="percentage">
                          Phần trăm
                        </ToggleGroupItem>
                        <ToggleGroupItem value="fixed">
                          Số tiền cố định
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="special-customer-price">
                        Giá bán dịp đặc biệt
                      </FieldLabel>
                      <Input
                        id="special-customer-price"
                        type="number"
                        min={0}
                        value={adminOperations.specialCustomerPrice}
                        onChange={(event) =>
                          setAdminOperations((current) => ({
                            ...current,
                            specialCustomerPrice: Number(event.target.value),
                          }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <FieldSet>
                  <FieldLegend>Trạng thái hiển thị</FieldLegend>
                  <ToggleGroup
                    type="single"
                    value={publicationStatus}
                    onValueChange={(value) => {
                      if (
                        value === "draft" ||
                        value === "published" ||
                        value === "hidden" ||
                        value === "archived"
                      ) {
                        setPublicationStatus(value)
                      }
                    }}
                    variant="outline"
                    className="flex w-full flex-wrap justify-start"
                  >
                    <ToggleGroupItem value="draft">
                      Bản nháp
                    </ToggleGroupItem>
                    <ToggleGroupItem value="published">
                      Công khai
                    </ToggleGroupItem>
                    <ToggleGroupItem value="hidden">Tạm ẩn</ToggleGroupItem>
                    <ToggleGroupItem value="archived">
                      Lưu trữ
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FieldSet>
                <FieldSet>
                  <FieldLegend>Ưu tiên và SEO</FieldLegend>
                  <FieldGroup className="grid md:grid-cols-2">
                    <Field>
                      <FieldLabel>Đánh dấu nổi bật</FieldLabel>
                      <ToggleGroup
                        type="single"
                        value={isFeatured ? "yes" : "no"}
                        onValueChange={(value) => {
                          if (value) setIsFeatured(value === "yes")
                        }}
                        variant="outline"
                        className="justify-start"
                      >
                        <ToggleGroupItem value="no">Không</ToggleGroupItem>
                        <ToggleGroupItem value="yes">Có</ToggleGroupItem>
                      </ToggleGroup>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="display-priority">
                        Thứ tự ưu tiên
                      </FieldLabel>
                      <Input
                        id="display-priority"
                        type="number"
                        min={0}
                        value={displayPriority}
                        onChange={(event) =>
                          setDisplayPriority(Number(event.target.value))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="meta-title">
                        Meta title
                      </FieldLabel>
                      <Input
                        id="meta-title"
                        value={adminOperations.metaTitle}
                        onChange={(event) =>
                          setAdminOperations((current) => ({
                            ...current,
                            metaTitle: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="meta-description">
                        Meta description
                      </FieldLabel>
                      <Textarea
                        id="meta-description"
                        value={adminOperations.metaDescription}
                        onChange={(event) =>
                          setAdminOperations((current) => ({
                            ...current,
                            metaDescription: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <Field>
                  <FieldLabel htmlFor="internal-note">
                    Ghi chú nội bộ
                  </FieldLabel>
                  <Textarea
                    id="internal-note"
                    value={internalNote}
                    onChange={(event) => setInternalNote(event.target.value)}
                    placeholder="Thông tin chỉ dành cho đội vận hành"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden flex-col gap-4 lg:sticky lg:top-20 lg:flex">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Tiến độ</CardTitle>
                  <Badge variant="secondary">
                    {step + 1}/{steps.length}
                  </Badge>
                </div>
                <CardDescription>{modeLabel}</CardDescription>
                <Progress
                  value={completion}
                  aria-label={`Hoàn thành ${completion}%`}
                />
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {steps.map((item, index) => {
                  const accessible = index <= highestStep
                  const current = index === step
                  const completed = index < step || index < highestStep

                  return (
                    <Button
                      key={item.label}
                      type="button"
                      variant={current ? "secondary" : "ghost"}
                      className="h-auto justify-start px-2 py-2 text-left"
                      disabled={!accessible}
                      onClick={() => goToVisitedStep(index)}
                    >
                      {completed ? (
                        <CheckCircleIcon
                          data-icon="inline-start"
                          weight="fill"
                        />
                      ) : (
                        <span className="inline-flex size-4 shrink-0 items-center justify-center">
                          {index + 1}
                        </span>
                      )}
                      <span className="flex min-w-0 flex-col items-start">
                        <span>{item.label}</span>
                        <span className="font-normal text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </Button>
                  )
                })}
              </CardContent>
            </Card>
          </aside>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardDescription>
                    Bước {step + 1} trên {steps.length}
                  </CardDescription>
                  <CardTitle>{getStepTitle(step, mode)}</CardTitle>
                </div>
                <Badge variant="outline">{modeLabel}</Badge>
              </div>
              <CardDescription>
                {getStepDescription(step, mode)}
              </CardDescription>
              <Progress
                value={completion}
                className="lg:hidden"
                aria-label={`Hoàn thành ${completion}%`}
              />
            </CardHeader>
            <CardContent>
              {step === 0 ? (
                <StartStep
                  mode={mode}
                  common={common}
                  typeOptions={typeOptions}
                  types={activeTypes}
                  otherType={activeOtherType}
                  errors={errors}
                  onCommonChange={(patch) =>
                    setCommon((current) => ({ ...current, ...patch }))
                  }
                  onTypesChange={updateTypes}
                  onOtherTypeChange={updateOtherType}
                  onClearError={clearErrors}
                />
              ) : null}

              {step === 1 ? (
                <AddressStep
                  common={common}
                  provinces={provinces}
                  legacyWards={legacyWards}
                  newProvinces={newProvinces}
                  selectedProvince={selectedProvince}
                  selectedDistrict={selectedDistrict}
                  selectedLegacyWardName={selectedLegacyWardName}
                  selectedNewProvince={selectedNewProvince}
                  selectedNewWard={selectedNewWard}
                  legacyMappingOptions={legacyMappingOptions}
                  newMappingOptions={newMappingOptions}
                  loading={addressLoading}
                  legacyWardsLoading={legacyWardsLoading}
                  mappingLoading={mappingLoading}
                  loadError={addressError}
                  errors={errors}
                  onChange={(patch) =>
                    setCommon((current) => ({ ...current, ...patch }))
                  }
                  onLegacyProvinceChange={changeLegacyProvince}
                  onLegacyDistrictChange={changeLegacyDistrict}
                  onLegacyWardChange={changeLegacyWard}
                  onNewProvinceChange={changeNewProvince}
                  onNewWardChange={changeNewWard}
                  onLegacyMappingChange={(value) => {
                    const option = legacyMappingOptions.find(
                      (item) => item.value === value
                    )
                    if (!option) return
                    setCommon((current) => ({
                      ...current,
                      provinceCode: option.provinceCode,
                      districtCode: option.districtCode,
                      legacyWardCode: option.wardCode,
                    }))
                    clearErrors("province", "district", "legacyWard")
                  }}
                  onNewMappingChange={(value) => {
                    const option = newMappingOptions.find(
                      (item) => item.value === value
                    )
                    if (!option) return
                    setCommon((current) => ({
                      ...current,
                      newProvinceCode: option.provinceCode,
                      newWardCode: option.wardCode,
                    }))
                    clearErrors("newProvince", "newWard")
                  }}
                  onRetry={retryAddressLoad}
                  onClearError={clearErrors}
                />
              ) : null}

              {step === 2 && mode === "long_stay" ? (
                <LongStayStep
                  draft={longStay}
                  additionalCosts={common.additionalCosts}
                  errors={errors}
                  onChange={(patch) =>
                    setLongStay((current) => ({ ...current, ...patch }))
                  }
                  onAdditionalCostsChange={(value) =>
                    setCommon((current) => ({
                      ...current,
                      additionalCosts: value,
                    }))
                  }
                  onClearError={clearErrors}
                />
              ) : null}

              {step === 2 && mode === "short_stay" ? (
                <ShortStayStep
                  draft={shortStay}
                  additionalCosts={common.additionalCosts}
                  errors={errors}
                  onChange={(patch) =>
                    setShortStay((current) => ({ ...current, ...patch }))
                  }
                  onAdditionalCostsChange={(value) =>
                    setCommon((current) => ({
                      ...current,
                      additionalCosts: value,
                    }))
                  }
                  onClearError={clearErrors}
                />
              ) : null}

              {step === 3 ? (
                <ContentStep
                  mode={mode}
                  common={common}
                  amenityOptions={amenityOptions}
                  amenityDraft={activeAmenityDraft}
                  descriptionWords={descriptionWords}
                  errors={errors}
                  onCommonChange={(patch) =>
                    setCommon((current) => ({ ...current, ...patch }))
                  }
                  onAmenityChange={(patch) =>
                    setAmenitiesByMode((current) => ({
                      ...current,
                      [mode]: { ...current[mode], ...patch },
                    }))
                  }
                  onClearError={clearErrors}
                />
              ) : null}

              {step === 4 ? (
                <MediaPolicyStep
                  common={common}
                  images={images}
                  thumbnailImageId={thumbnailImageId}
                  videoInput={videoInput}
                  videoLinks={videoLinks}
                  optimizingImages={optimizingImages}
                  errors={errors}
                  onCommonChange={(patch) =>
                    setCommon((current) => ({ ...current, ...patch }))
                  }
                  onImagesChange={handleImages}
                  onRemoveImage={removeImage}
                  onThumbnailChange={setThumbnailImageId}
                  onVideoInputChange={(value) => {
                    setVideoInput(value)
                    clearErrors("video")
                  }}
                  onAddVideo={addVideoLink}
                  onRemoveVideo={(link) =>
                    setVideoLinks((current) =>
                      current.filter((item) => item !== link)
                    )
                  }
                />
              ) : null}

              {step === 5 ? (
                <ReviewStep
                  mode={mode}
                  common={common}
                  longStay={longStay}
                  shortStay={shortStay}
                  province={selectedProvince}
                  district={selectedDistrict}
                  legacyWardName={selectedLegacyWardName}
                  newProvince={selectedNewProvince}
                  newWard={selectedNewWard}
                  amenities={activeAmenityDraft}
                  images={images}
                  thumbnailImageId={thumbnailImageId}
                  videoCount={videoLinks.length}
                  submitted={submitted}
                />
              ) : null}
            </CardContent>
            <CardFooter className="flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={previousStep}
                disabled={step === 0}
              >
                <ArrowLeftIcon data-icon="inline-start" />
                Quay lại
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Tiếp tục
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={finishPreview}
                  disabled={submitting}
                >
                  <CheckCircleIcon data-icon="inline-start" />
                  {submitting ? "Đang lưu..." : "Lưu tin đăng"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

function StartStep({
  mode,
  common,
  typeOptions,
  types,
  otherType,
  errors,
  onCommonChange,
  onTypesChange,
  onOtherTypeChange,
  onClearError,
}: {
  mode: ListingMode
  common: CommonDraft
  typeOptions: Array<{ value: string; label: string }>
  types: string[]
  otherType: string
  errors: Record<string, string>
  onCommonChange: (patch: Partial<CommonDraft>) => void
  onTypesChange: (value: string[]) => void
  onOtherTypeChange: (value: string) => void
  onClearError: (...keys: string[]) => void
}) {
  return (
    <FieldGroup>
      <FieldSet data-invalid={Boolean(errors.types)}>
        <FieldLegend>Loại hình chỗ ở</FieldLegend>
        <FieldDescription>
          Có thể chọn nhiều loại. Loại được chọn đầu tiên sẽ được ưu tiên hiển
          thị.
        </FieldDescription>
        <ToggleGroup
          type="multiple"
          value={types}
          onValueChange={onTypesChange}
          variant="outline"
          className="flex w-full flex-wrap justify-start"
          aria-label="Chọn loại hình chỗ ở"
        >
          {typeOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className={selectedOptionClass}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {types.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {types.map((type, index) => {
              const option = typeOptions.find((item) => item.value === type)
              const label =
                type === "other" ? otherType || "Khác" : option?.label || type
              return (
                <Badge key={type} variant={index === 0 ? "default" : "outline"}>
                  {index === 0 ? <StarIcon data-icon="inline-start" /> : null}
                  {label}
                  {index === 0 ? " · Ưu tiên" : ""}
                </Badge>
              )
            })}
          </div>
        ) : null}
        <FieldError>{errors.types}</FieldError>
      </FieldSet>

      {types.includes("other") ? (
        <Field data-invalid={Boolean(errors.otherType)}>
          <FieldLabel htmlFor="other-property-label">Loại hình khác</FieldLabel>
          <Input
            id="other-property-label"
            value={otherType}
            placeholder={
              mode === "long_stay"
                ? "Ví dụ: Phòng studio"
                : "Ví dụ: Nhà gỗ, bungalow"
            }
            onChange={(event) => onOtherTypeChange(event.target.value)}
            aria-invalid={Boolean(errors.otherType)}
          />
          <FieldError>{errors.otherType}</FieldError>
        </Field>
      ) : null}

      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor="listing-title">Tiêu đề tin</FieldLabel>
        <Input
          id="listing-title"
          value={common.title}
          placeholder={
            mode === "long_stay"
              ? "Ví dụ: Phòng trọ có gác gần Đại học Văn Lang"
              : "Ví dụ: Villa hồ bơi riêng gần biển An Bàng"
          }
          onChange={(event) => {
            onCommonChange({ title: event.target.value })
            onClearError("title")
          }}
          aria-invalid={Boolean(errors.title)}
        />
        <FieldDescription>
          Nên gồm loại chỗ ở, điểm nổi bật và khu vực.
        </FieldDescription>
        <FieldError>{errors.title}</FieldError>
      </Field>
    </FieldGroup>
  )
}

function SearchCombobox({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  invalid,
  onChange,
}: {
  value: string
  options: SearchOption[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  invalid?: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <CaretUpDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={option.keywords}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function AddressStep({
  common,
  provinces,
  legacyWards,
  newProvinces,
  selectedProvince,
  selectedDistrict,
  selectedLegacyWardName,
  selectedNewProvince,
  selectedNewWard,
  legacyMappingOptions,
  newMappingOptions,
  loading,
  legacyWardsLoading,
  mappingLoading,
  loadError,
  errors,
  onChange,
  onLegacyProvinceChange,
  onLegacyDistrictChange,
  onLegacyWardChange,
  onNewProvinceChange,
  onNewWardChange,
  onLegacyMappingChange,
  onNewMappingChange,
  onRetry,
  onClearError,
}: {
  common: CommonDraft
  provinces: LegacyProvince[]
  legacyWards: LegacyWard[]
  newProvinces: NewProvince[]
  selectedProvince?: LegacyProvince
  selectedDistrict?: LegacyDistrict
  selectedLegacyWardName?: string
  selectedNewProvince?: NewProvince
  selectedNewWard?: NewWard
  legacyMappingOptions: LegacyMappingOption[]
  newMappingOptions: NewMappingOption[]
  loading: boolean
  legacyWardsLoading: boolean
  mappingLoading: boolean
  loadError: string
  errors: Record<string, string>
  onChange: (patch: Partial<CommonDraft>) => void
  onLegacyProvinceChange: (value: string) => void
  onLegacyDistrictChange: (value: string) => void
  onLegacyWardChange: (value: string) => void
  onNewProvinceChange: (value: string) => void
  onNewWardChange: (value: string) => void
  onLegacyMappingChange: (value: string) => void
  onNewMappingChange: (value: string) => void
  onRetry: () => void
  onClearError: (...keys: string[]) => void
}) {
  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Không tải được danh sách địa chỉ</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{loadError}</span>
          <Button type="button" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const legacyProvinceOptions = provinces.map((province) => ({
    value: String(province.code),
    label: province.name,
    keywords: [searchKeyword(province.codename)],
  }))
  const legacyDistrictOptions =
    selectedProvince?.districts.map((district) => ({
      value: String(district.code),
      label: district.name,
      keywords: [searchKeyword(district.codename)],
    })) ?? []
  const legacyWardOptions = legacyWards.map((ward) => ({
    value: String(ward.code),
    label: ward.name,
    keywords: [searchKeyword(ward.codename)],
  }))
  const effectiveLegacyWardOptions =
    legacyWardOptions.length ||
    !common.legacyWardCode ||
    !selectedLegacyWardName
      ? legacyWardOptions
      : [
          {
            value: common.legacyWardCode,
            label: selectedLegacyWardName,
          },
        ]
  const newProvinceOptions = newProvinces.map((province) => ({
    value: String(province.code),
    label: province.name,
    keywords: [searchKeyword(province.codename)],
  }))
  const newWardOptions =
    selectedNewProvince?.wards.map((ward) => ({
      value: String(ward.code),
      label: ward.name,
      keywords: [searchKeyword(ward.codename)],
    })) ?? []
  const effectiveLegacyMappingOptions =
    legacyMappingOptions.length ||
    !selectedProvince ||
    !selectedDistrict ||
    !selectedLegacyWardName
      ? legacyMappingOptions
      : [
          {
            value: `${selectedProvince.code}-${selectedDistrict.code}-${common.legacyWardCode}`,
            label: `${selectedLegacyWardName}, ${selectedDistrict.name}, ${selectedProvince.name}`,
            provinceCode: String(selectedProvince.code),
            districtCode: String(selectedDistrict.code),
            wardCode: common.legacyWardCode,
            wardName: selectedLegacyWardName,
          },
        ]
  const effectiveNewMappingOptions =
    newMappingOptions.length || !selectedNewProvince || !selectedNewWard
      ? newMappingOptions
      : [
          {
            value: String(selectedNewWard.code),
            label: `${selectedNewWard.name}, ${selectedNewProvince.name}`,
            provinceCode: String(selectedNewProvince.code),
            wardCode: String(selectedNewWard.code),
          },
        ]

  return (
    <FieldGroup className="grid gap-5 md:grid-cols-2">
      <FieldSet className="md:col-span-2">
        <FieldLegend>Bạn muốn khai báo theo địa giới nào?</FieldLegend>
        <FieldDescription>
          Chọn hệ quen thuộc; Roovea sẽ tự đối chiếu hệ còn lại.
        </FieldDescription>
        <ToggleGroup
          type="single"
          value={common.addressSystem}
          onValueChange={(value) => {
            if (value !== "new" && value !== "legacy") return
            onChange({ addressSystem: value })
            onClearError(
              "province",
              "district",
              "legacyWard",
              "newProvince",
              "newWard"
            )
          }}
          variant="outline"
          className="grid w-full gap-3 sm:grid-cols-2"
          aria-label="Chọn hệ địa giới"
        >
          <ToggleGroupItem
            value="new"
            className={`h-auto whitespace-normal ${selectedOptionClass}`}
          >
            Địa giới mới · Tỉnh/Thành phố → Phường/Xã
          </ToggleGroupItem>
          <ToggleGroupItem
            value="legacy"
            className={`h-auto whitespace-normal ${selectedOptionClass}`}
          >
            Địa giới cũ · Tỉnh/Thành phố → Quận/Huyện → Phường/Xã
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldSet>

      {common.addressSystem === "new" ? (
        <>
          <Field data-invalid={Boolean(errors.newProvince)}>
            <FieldLabel>Tỉnh/Thành phố mới</FieldLabel>
            <SearchCombobox
              value={common.newProvinceCode}
              options={newProvinceOptions}
              placeholder={
                loading ? "Đang tải địa chỉ..." : "Nhập để tìm Tỉnh/Thành phố"
              }
              searchPlaceholder="Gõ tên Tỉnh/Thành phố..."
              emptyText="Không tìm thấy Tỉnh/Thành phố."
              disabled={loading}
              invalid={Boolean(errors.newProvince)}
              onChange={onNewProvinceChange}
            />
            <FieldError>{errors.newProvince}</FieldError>
          </Field>

          <Field
            data-invalid={Boolean(errors.newWard)}
            data-disabled={!selectedNewProvince}
          >
            <FieldLabel>Phường/Xã mới</FieldLabel>
            <SearchCombobox
              value={common.newWardCode}
              options={newWardOptions}
              placeholder="Nhập để tìm Phường/Xã"
              searchPlaceholder="Gõ tên Phường/Xã..."
              emptyText="Không tìm thấy Phường/Xã."
              disabled={!selectedNewProvince}
              invalid={Boolean(errors.newWard)}
              onChange={onNewWardChange}
            />
            <FieldError>{errors.newWard}</FieldError>
          </Field>

          {selectedNewWard ? (
            <Field
              className="md:col-span-2"
              data-invalid={Boolean(errors.legacyWard)}
            >
              <FieldLabel>Địa chỉ cũ tương ứng</FieldLabel>
              {mappingLoading ? (
                <Button type="button" variant="outline" disabled>
                  Đang đối chiếu địa giới...
                </Button>
              ) : (
                <SearchCombobox
                  value={
                    common.provinceCode &&
                    common.districtCode &&
                    common.legacyWardCode
                      ? `${common.provinceCode}-${common.districtCode}-${common.legacyWardCode}`
                      : ""
                  }
                  options={effectiveLegacyMappingOptions}
                  placeholder="Chọn địa chỉ cũ được gợi ý"
                  searchPlaceholder="Tìm Phường/Xã hoặc Quận/Huyện cũ..."
                  emptyText="Chưa có kết quả ánh xạ."
                  invalid={Boolean(errors.legacyWard)}
                  onChange={onLegacyMappingChange}
                />
              )}
              <FieldDescription>
                {effectiveLegacyMappingOptions.length > 1
                  ? "Phường/Xã mới này liên quan nhiều địa chỉ cũ; hãy xác nhận lựa chọn phù hợp."
                  : "Hệ thống tự điền từ dữ liệu mapping của Province Open API."}
              </FieldDescription>
              <FieldError>{errors.legacyWard}</FieldError>
            </Field>
          ) : null}
        </>
      ) : (
        <>
          <Field data-invalid={Boolean(errors.province)}>
            <FieldLabel>Tỉnh/Thành phố cũ</FieldLabel>
            <SearchCombobox
              value={common.provinceCode}
              options={legacyProvinceOptions}
              placeholder={
                loading ? "Đang tải địa chỉ..." : "Nhập để tìm Tỉnh/Thành phố"
              }
              searchPlaceholder="Gõ tên Tỉnh/Thành phố cũ..."
              emptyText="Không tìm thấy Tỉnh/Thành phố."
              disabled={loading}
              invalid={Boolean(errors.province)}
              onChange={onLegacyProvinceChange}
            />
            <FieldError>{errors.province}</FieldError>
          </Field>

          <Field
            data-invalid={Boolean(errors.district)}
            data-disabled={!selectedProvince}
          >
            <FieldLabel>Quận/Huyện cũ</FieldLabel>
            <SearchCombobox
              value={common.districtCode}
              options={legacyDistrictOptions}
              placeholder="Nhập để tìm Quận/Huyện"
              searchPlaceholder="Gõ tên Quận/Huyện cũ..."
              emptyText="Không tìm thấy Quận/Huyện."
              disabled={!selectedProvince}
              invalid={Boolean(errors.district)}
              onChange={onLegacyDistrictChange}
            />
            <FieldError>{errors.district}</FieldError>
          </Field>

          <Field
            className="md:col-span-2"
            data-invalid={Boolean(errors.legacyWard)}
            data-disabled={!selectedDistrict}
          >
            <FieldLabel>Phường/Xã cũ</FieldLabel>
            <SearchCombobox
              value={common.legacyWardCode}
              options={effectiveLegacyWardOptions}
              placeholder={
                legacyWardsLoading
                  ? "Đang tải Phường/Xã cũ..."
                  : "Nhập để tìm Phường/Xã cũ"
              }
              searchPlaceholder="Gõ tên Phường/Xã cũ..."
              emptyText="Không tìm thấy Phường/Xã."
              disabled={!selectedDistrict || legacyWardsLoading}
              invalid={Boolean(errors.legacyWard)}
              onChange={onLegacyWardChange}
            />
            <FieldDescription>
              Danh sách được tải trực tiếp theo Quận/Huyện đã chọn.
            </FieldDescription>
            <FieldError>{errors.legacyWard}</FieldError>
          </Field>

          {selectedLegacyWardName ? (
            <Field
              className="md:col-span-2"
              data-invalid={Boolean(errors.newWard)}
            >
              <FieldLabel>Phường/Xã mới tương ứng</FieldLabel>
              {mappingLoading ? (
                <Button type="button" variant="outline" disabled>
                  Đang tìm các Phường/Xã mới phù hợp...
                </Button>
              ) : (
                <SearchCombobox
                  value={common.newWardCode}
                  options={effectiveNewMappingOptions}
                  placeholder="Nhập để tìm trong các kết quả mapping"
                  searchPlaceholder="Tìm Phường/Xã mới..."
                  emptyText="Chưa có kết quả ánh xạ."
                  invalid={Boolean(errors.newWard)}
                  onChange={onNewMappingChange}
                />
              )}
              <FieldDescription>
                Mapping dựa trên đúng mã Phường/Xã cũ đã chọn, không suy đoán từ
                Quận/Huyện.
              </FieldDescription>
              <FieldError>{errors.newWard}</FieldError>
            </Field>
          ) : null}
        </>
      )}

      <Field
        className="md:col-span-2"
        data-invalid={Boolean(errors.addressDetail)}
      >
        <FieldLabel htmlFor="address-detail">Địa chỉ chi tiết</FieldLabel>
        <Input
          id="address-detail"
          value={common.addressDetail}
          placeholder="Ví dụ: 192 đường Lê Hồng Phong"
          onChange={(event) => {
            onChange({ addressDetail: event.target.value })
            onClearError("addressDetail")
          }}
          aria-invalid={Boolean(errors.addressDetail)}
        />
        <FieldDescription>
          Nhập số nhà, tên đường hoặc tên khu dân cư.
        </FieldDescription>
        <FieldError>{errors.addressDetail}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.googleMapsUrl)}>
        <FieldLabel htmlFor="google-maps-url">Link Google Maps</FieldLabel>
        <Input
          id="google-maps-url"
          type="url"
          value={common.googleMapsUrl}
          placeholder="https://maps.google.com/..."
          onChange={(event) => {
            onChange({ googleMapsUrl: event.target.value })
            onClearError("googleMapsUrl")
          }}
          aria-invalid={Boolean(errors.googleMapsUrl)}
        />
        <FieldDescription>
          Không bắt buộc, nhưng giúp khách xác định vị trí chính xác.
        </FieldDescription>
        <FieldError>{errors.googleMapsUrl}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="nearby-places">Gần địa điểm</FieldLabel>
        <Input
          id="nearby-places"
          value={common.nearbyText}
          placeholder="Ví dụ: VLU, IUH, UEH"
          onChange={(event) => onChange({ nearbyText: event.target.value })}
        />
        <FieldDescription>
          Nhập các địa điểm, phân tách bằng dấu phẩy.
        </FieldDescription>
      </Field>

      {selectedProvince &&
      selectedDistrict &&
      selectedLegacyWardName &&
      selectedNewProvince &&
      selectedNewWard ? (
        <Card size="sm" className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="text-primary" />
              Đã đối chiếu hai hệ địa giới
            </CardTitle>
            <CardDescription>
              Mới: {selectedNewWard.name}, {selectedNewProvince.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm">
              Cũ: {selectedLegacyWardName}, {selectedDistrict.name},{" "}
              {selectedProvince.name}
            </span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Mã mới: {selectedNewProvince.code} · {selectedNewWard.code}
              </Badge>
              <Badge variant="secondary">
                Mã cũ: {selectedProvince.code} · {selectedDistrict.code} ·{" "}
                {common.legacyWardCode}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </FieldGroup>
  )
}

function LongStayStep({
  draft,
  additionalCosts,
  errors,
  onChange,
  onAdditionalCostsChange,
  onClearError,
}: {
  draft: LongStayDraft
  additionalCosts: string
  errors: Record<string, string>
  onChange: (patch: Partial<LongStayDraft>) => void
  onAdditionalCostsChange: (value: string) => void
  onClearError: (...keys: string[]) => void
}) {
  return (
    <FieldGroup className="grid gap-5 md:grid-cols-2">
      <Field
        className="md:col-span-2"
        data-invalid={Boolean(errors.ownerLivesOnSite)}
      >
        <FieldLabel>Chung chủ?</FieldLabel>
        <ToggleGroup
          type="single"
          value={draft.ownerLivesOnSite}
          onValueChange={(value) => {
            if (!value) return
            onChange({ ownerLivesOnSite: value })
            onClearError("ownerLivesOnSite")
          }}
          variant="outline"
          className="grid w-full gap-3 sm:grid-cols-2"
          aria-label="Chủ nhà có sống chung không"
        >
          <ToggleGroupItem
            value="yes"
            className={`h-auto whitespace-normal ${selectedOptionClass}`}
          >
            Có, chủ nhà sống chung
          </ToggleGroupItem>
          <ToggleGroupItem
            value="no"
            className={`h-auto whitespace-normal ${selectedOptionClass}`}
          >
            Không, không gian riêng
          </ToggleGroupItem>
        </ToggleGroup>
        <FieldDescription>
          Cho biết chủ nhà có cùng sinh hoạt trong một không gian chung hay
          không.
        </FieldDescription>
        <FieldError>{errors.ownerLivesOnSite}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.price)}>
        <FieldLabel htmlFor="monthly-price">Giá thuê mỗi tháng</FieldLabel>
        <Input
          id="monthly-price"
          type="number"
          min={0}
          value={draft.monthlyPrice}
          placeholder="3500000"
          onChange={(event) => {
            onChange({ monthlyPrice: event.target.value })
            onClearError("price")
          }}
          aria-invalid={Boolean(errors.price)}
        />
        <FieldDescription>
          Đang hiển thị: {moneyLabel(draft.monthlyPrice)}/tháng
        </FieldDescription>
        <FieldError>{errors.price}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="area-m2">
          Diện tích sử dụng (m²){" "}
          <span className="font-normal text-muted-foreground">
            · Không bắt buộc
          </span>
        </FieldLabel>
        <Input
          id="area-m2"
          type="number"
          min={0}
          value={draft.areaM2}
          placeholder="24"
          onChange={(event) => onChange({ areaM2: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="max-occupants">Số người ở tối đa</FieldLabel>
        <Input
          id="max-occupants"
          type="number"
          min={1}
          value={draft.maxOccupants}
          onChange={(event) => onChange({ maxOccupants: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="minimum-lease">
          Thời hạn thuê tối thiểu (tháng)
        </FieldLabel>
        <Input
          id="minimum-lease"
          type="number"
          min={1}
          value={draft.minimumLease}
          onChange={(event) => onChange({ minimumLease: event.target.value })}
        />
      </Field>

      <Separator className="md:col-span-2" />

      <Field className="md:col-span-2">
        <FieldLabel htmlFor="additional-costs">Chi phí khác</FieldLabel>
        <Input
          id="additional-costs"
          value={additionalCosts}
          placeholder="Ví dụ: Phí dịch vụ, rác, điện nước"
          onChange={(event) => onAdditionalCostsChange(event.target.value)}
        />
        <FieldDescription>
          Không bắt buộc. Mô tả ngắn gọn mọi khoản ngoài giá thuê.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}

function ShortStayStep({
  draft,
  additionalCosts,
  errors,
  onChange,
  onAdditionalCostsChange,
  onClearError,
}: {
  draft: ShortStayDraft
  additionalCosts: string
  errors: Record<string, string>
  onChange: (patch: Partial<ShortStayDraft>) => void
  onAdditionalCostsChange: (value: string) => void
  onClearError: (...keys: string[]) => void
}) {
  return (
    <FieldGroup className="grid gap-5 md:grid-cols-2">
      <Field data-invalid={Boolean(errors.price)}>
        <FieldLabel htmlFor="nightly-price">Giá bán mỗi đêm</FieldLabel>
        <Input
          id="nightly-price"
          type="number"
          min={0}
          value={draft.nightlyPrice}
          placeholder="850000"
          onChange={(event) => {
            onChange({ nightlyPrice: event.target.value })
            onClearError("price")
          }}
          aria-invalid={Boolean(errors.price)}
        />
        <FieldDescription>
          Đang hiển thị: {moneyLabel(draft.nightlyPrice)}/đêm
        </FieldDescription>
        <FieldError>{errors.price}</FieldError>
      </Field>

      <Field data-invalid={Boolean(errors.space)}>
        <FieldLabel htmlFor="max-adults">Người lớn tối đa</FieldLabel>
        <Input
          id="max-adults"
          type="number"
          min={1}
          value={draft.maxAdults}
          onChange={(event) => {
            onChange({ maxAdults: event.target.value })
            onClearError("space")
          }}
          aria-invalid={Boolean(errors.space)}
        />
        <FieldError>{errors.space}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="max-children">Trẻ em tối đa</FieldLabel>
        <Input
          id="max-children"
          type="number"
          min={0}
          value={draft.maxChildren}
          onChange={(event) => onChange({ maxChildren: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="bedrooms">Số phòng ngủ</FieldLabel>
        <Input
          id="bedrooms"
          type="number"
          min={0}
          value={draft.bedrooms}
          onChange={(event) => onChange({ bedrooms: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="bathrooms">Số phòng tắm</FieldLabel>
        <Input
          id="bathrooms"
          type="number"
          min={0}
          step="0.5"
          value={draft.bathrooms}
          onChange={(event) => onChange({ bathrooms: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="check-in">Giờ nhận phòng</FieldLabel>
        <Input
          id="check-in"
          type="time"
          value={draft.checkIn}
          onChange={(event) => onChange({ checkIn: event.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="check-out">Giờ trả phòng</FieldLabel>
        <Input
          id="check-out"
          type="time"
          value={draft.checkOut}
          onChange={(event) => onChange({ checkOut: event.target.value })}
        />
      </Field>

      <Separator className="md:col-span-2" />

      <Field className="md:col-span-2">
        <FieldLabel htmlFor="additional-costs">Chi phí khác</FieldLabel>
        <Input
          id="additional-costs"
          value={additionalCosts}
          placeholder="Ví dụ: Phí dịch vụ, dọn phòng, phụ thu"
          onChange={(event) => onAdditionalCostsChange(event.target.value)}
        />
        <FieldDescription>
          Không bắt buộc. Mô tả ngắn gọn mọi khoản ngoài giá theo đêm.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}

function ContentStep({
  mode,
  common,
  amenityOptions,
  amenityDraft,
  descriptionWords,
  errors,
  onCommonChange,
  onAmenityChange,
  onClearError,
}: {
  mode: ListingMode
  common: CommonDraft
  amenityOptions: string[]
  amenityDraft: AmenityDraft
  descriptionWords: number
  errors: Record<string, string>
  onCommonChange: (patch: Partial<CommonDraft>) => void
  onAmenityChange: (patch: Partial<AmenityDraft>) => void
  onClearError: (...keys: string[]) => void
}) {
  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Tiện ích nổi bật</FieldLegend>
        <FieldDescription>
          Chọn đúng tiện ích đang có để khách lọc và so sánh chính xác.
        </FieldDescription>
        <ToggleGroup
          type="multiple"
          value={amenityDraft.selected}
          onValueChange={(value) => {
            onAmenityChange({ selected: value })
            onClearError("amenities", "customAmenities")
          }}
          variant="outline"
          className="flex w-full flex-wrap justify-start"
          aria-label="Chọn tiện ích"
        >
          {amenityOptions.map((amenity) => (
            <ToggleGroupItem
              key={amenity}
              value={amenity}
              className={selectedOptionClass}
            >
              {amenity}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value="other" className={selectedOptionClass}>
            Khác
          </ToggleGroupItem>
        </ToggleGroup>
        <FieldError>{errors.amenities}</FieldError>
      </FieldSet>

      {amenityDraft.selected.includes("other") ? (
        <Field data-invalid={Boolean(errors.customAmenities)}>
          <FieldLabel htmlFor="custom-amenities">Tiện ích khác</FieldLabel>
          <Input
            id="custom-amenities"
            value={amenityDraft.customText}
            placeholder="Ví dụ: Máy lọc nước, sân phơi, bàn bi-a"
            onChange={(event) => {
              onAmenityChange({ customText: event.target.value })
              onClearError("customAmenities")
            }}
            aria-invalid={Boolean(errors.customAmenities)}
          />
          <FieldDescription>
            Nhập các tiện ích, phân tách bằng dấu phẩy.
          </FieldDescription>
          <FieldError>{errors.customAmenities}</FieldError>
        </Field>
      ) : null}

      <Field data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor="listing-description">Mô tả chỗ ở</FieldLabel>
        <Textarea
          id="listing-description"
          value={common.description}
          placeholder={
            mode === "long_stay"
              ? "Mô tả không gian, đối tượng phù hợp, lối đi, giờ giấc và điểm nổi bật..."
              : "Mô tả trải nghiệm lưu trú, không gian riêng, vị trí và điều khách sẽ yêu thích..."
          }
          className="min-h-44"
          onChange={(event) => {
            onCommonChange({ description: event.target.value })
            onClearError("description")
          }}
          aria-invalid={Boolean(errors.description)}
        />
        <FieldDescription>
          {descriptionWords}/500 từ · Không cần lặp lại giá và địa chỉ.
        </FieldDescription>
        <FieldError>{errors.description}</FieldError>
      </Field>
    </FieldGroup>
  )
}

function MediaPolicyStep({
  common,
  images,
  thumbnailImageId,
  videoInput,
  videoLinks,
  optimizingImages,
  errors,
  onCommonChange,
  onImagesChange,
  onRemoveImage,
  onThumbnailChange,
  onVideoInputChange,
  onAddVideo,
  onRemoveVideo,
}: {
  common: CommonDraft
  images: MockImage[]
  thumbnailImageId: string
  videoInput: string
  videoLinks: string[]
  optimizingImages: boolean
  errors: Record<string, string>
  onCommonChange: (patch: Partial<CommonDraft>) => void
  onImagesChange: (files: FileList | null) => void
  onRemoveImage: (id: string) => void
  onThumbnailChange: (id: string) => void
  onVideoInputChange: (value: string) => void
  onAddVideo: () => void
  onRemoveVideo: (link: string) => void
}) {
  return (
    <FieldGroup>
      <Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="listing-images">Hình ảnh chỗ ở</FieldLabel>
            <FieldDescription>
              Tối đa 12 ảnh. Bạn có thể chọn bất kỳ ảnh nào làm ảnh đại diện.
            </FieldDescription>
          </div>
          <Badge variant="secondary">{images.length}/12 ảnh</Badge>
        </div>
        <Input
          id="listing-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={optimizingImages || images.length >= 12}
          onChange={(event) => {
            void onImagesChange(event.target.files)
            event.target.value = ""
          }}
        />
        <Button
          asChild
          type="button"
          variant="outline"
          className="w-fit"
          aria-disabled={optimizingImages || images.length >= 12}
        >
          <label htmlFor="listing-images">
            <UploadSimpleIcon data-icon="inline-start" />
            {optimizingImages ? "Đang xử lý ảnh..." : "Chọn ảnh phòng"}
          </label>
        </Button>

        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="flex min-w-0 flex-col overflow-hidden border bg-muted/30"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  {image.id === thumbnailImageId ? (
                    <Badge className="absolute top-2 left-2">
                      <StarIcon data-icon="inline-start" />
                      Ảnh đại diện
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 p-2">
                  <span className="truncate text-xs">{image.name}</span>
                  <div className="flex items-center justify-between gap-2">
                    {image.id === thumbnailImageId ? (
                      <Badge variant="secondary">Đang đại diện</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onThumbnailChange(image.id)}
                      >
                        <StarIcon data-icon="inline-start" />
                        Chọn đại diện
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Xóa ${image.name}`}
                      onClick={() => onRemoveImage(image.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 border bg-muted/30 p-4 text-center">
            <CameraIcon className="size-6 text-muted-foreground" />
            <span className="text-sm">Chưa có ảnh phòng</span>
            <span className="text-xs text-muted-foreground">
              Ưu tiên ảnh sáng, rõ và chụp đủ các khu vực chính.
            </span>
          </div>
        )}
      </Field>

      <Field data-invalid={Boolean(errors.video)}>
        <FieldLabel htmlFor="video-links">Link video</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="video-links"
            type="url"
            value={videoInput}
            placeholder="https://youtube.com/... hoặc https://tiktok.com/..."
            onChange={(event) => onVideoInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return
              event.preventDefault()
              onAddVideo()
            }}
            aria-invalid={Boolean(errors.video)}
          />
          <Button type="button" variant="outline" onClick={onAddVideo}>
            <PlusIcon data-icon="inline-start" />
            Thêm link
          </Button>
        </div>
        {videoLinks.length ? (
          <div className="flex flex-wrap gap-2">
            {videoLinks.map((link) => (
              <Badge key={link} variant="outline" className="max-w-full">
                <span className="max-w-56 truncate">{link}</span>
                <button
                  type="button"
                  aria-label={`Xóa link ${link}`}
                  onClick={() => onRemoveVideo(link)}
                >
                  <XIcon />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
        <FieldDescription>
          Dán link rồi nhấn Enter hoặc “Thêm link”. Mỗi link sẽ hiện thành một
          thẻ để dễ kiểm soát.
        </FieldDescription>
        <FieldError>{errors.video}</FieldError>
      </Field>

      <Separator />

      <FieldSet>
        <FieldLegend>Chính sách</FieldLegend>
        <FieldDescription>
          Viết ngắn gọn để khách hiểu trước khi liên hệ hoặc đặt phòng.
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="policy-description">Mô tả chung</FieldLabel>
            <Textarea
              id="policy-description"
              value={common.policyDescription}
              placeholder="Ví dụ: Hỗ trợ hoàn cọc trước, cần liên hệ trước"
              onChange={(event) =>
                onCommonChange({ policyDescription: event.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="allowed-policy">Được phép</FieldLabel>
            <Input
              id="allowed-policy"
              value={common.allowedText}
              placeholder="Ví dụ: Thú cưng, Nấu ăn"
              onChange={(event) =>
                onCommonChange({ allowedText: event.target.value })
              }
            />
            <FieldDescription>
              Phân tách từng chính sách bằng dấu phẩy.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="disallowed-policy">Không được phép</FieldLabel>
            <Input
              id="disallowed-policy"
              value={common.disallowedText}
              placeholder="Ví dụ: Hút thuốc, Hủy phòng"
              onChange={(event) =>
                onCommonChange({ disallowedText: event.target.value })
              }
            />
            <FieldDescription>
              Phân tách từng chính sách bằng dấu phẩy.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  )
}

function ReviewStep({
  mode,
  common,
  longStay,
  shortStay,
  province,
  district,
  legacyWardName,
  newProvince,
  newWard,
  amenities,
  images,
  thumbnailImageId,
  videoCount,
  submitted,
}: {
  mode: ListingMode
  common: CommonDraft
  longStay: LongStayDraft
  shortStay: ShortStayDraft
  province?: LegacyProvince
  district?: LegacyDistrict
  legacyWardName?: string
  newProvince?: NewProvince
  newWard?: NewWard
  amenities: AmenityDraft
  images: MockImage[]
  thumbnailImageId: string
  videoCount: number
  submitted: boolean
}) {
  const customAmenities = parseCommaList(amenities.customText)
  const nearbyPlaces = parseCommaList(common.nearbyText)
  const allowedItems = parseCommaList(common.allowedText)
  const disallowedItems = parseCommaList(common.disallowedText)
  const typeOptions = mode === "long_stay" ? longStayTypes : shortStayTypes
  const selectedTypes = mode === "long_stay" ? longStay.types : shortStay.types
  const otherType =
    mode === "long_stay" ? longStay.otherType : shortStay.otherType
  const thumbnail =
    images.find((image) => image.id === thumbnailImageId) ?? images[0]

  return (
    <div className="flex flex-col gap-5">
      {submitted ? (
        <Alert>
          <CheckCircleIcon />
          <AlertTitle>Tin đăng đã sẵn sàng</AlertTitle>
          <AlertDescription>
            Bạn có thể quay lại từng bước để chỉnh sửa trước khi đăng.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card size="sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{mode === "long_stay" ? "Dài hạn" : "Ngắn hạn"}</Badge>
            {selectedTypes.map((type, index) => (
              <Badge key={type} variant={index === 0 ? "default" : "outline"}>
                {index === 0 ? <StarIcon data-icon="inline-start" /> : null}
                {type === "other"
                  ? otherType
                  : (typeOptions.find((item) => item.value === type)?.label ??
                    type)}
              </Badge>
            ))}
          </div>
          <CardTitle>{common.title}</CardTitle>
          <CardDescription>
            {common.addressDetail}, {newWard?.name}, {newProvince?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {mode === "long_stay" ? (
            <>
              <ReviewFact
                icon={HouseLineIcon}
                label="Giá thuê"
                value={`${moneyLabel(longStay.monthlyPrice)}/tháng`}
              />
              <ReviewFact
                icon={BuildingsIcon}
                label="Diện tích"
                value={
                  longStay.areaM2 ? `${longStay.areaM2} m²` : "Không khai báo"
                }
              />
              <ReviewFact
                icon={UsersThreeIcon}
                label="Số người"
                value={`${longStay.maxOccupants} người`}
              />
              <ReviewFact
                icon={HouseLineIcon}
                label="Chung chủ"
                value={
                  longStay.ownerLivesOnSite === "yes"
                    ? "Có chung chủ"
                    : "Không chung chủ"
                }
              />
            </>
          ) : (
            <>
              <ReviewFact
                icon={HouseLineIcon}
                label="Giá bán"
                value={`${moneyLabel(shortStay.nightlyPrice)}/đêm`}
              />
              <ReviewFact
                icon={UsersThreeIcon}
                label="Sức chứa"
                value={`${shortStay.maxAdults} người lớn`}
              />
              <ReviewFact
                icon={BedIcon}
                label="Phòng ngủ"
                value={`${shortStay.bedrooms} phòng`}
              />
              <ReviewFact
                icon={ClockIcon}
                label="Nhận / trả"
                value={`${shortStay.checkIn} · ${shortStay.checkOut}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Vị trí</CardTitle>
            <CardDescription>
              Mã mới: {newProvince?.code ?? "—"} · {newWard?.code ?? "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AddressValue
              label="Địa giới mới"
              value={`${common.addressDetail || "—"}, ${newWard?.name ?? "—"}, ${newProvince?.name ?? "—"}`}
            />
            <AddressValue
              label="Địa giới cũ"
              value={`${legacyWardName ?? "—"}, ${district?.name ?? "—"}, ${province?.name ?? "—"}`}
            />
            {nearbyPlaces.length ? (
              <div className="flex flex-wrap gap-2">
                {nearbyPlaces.map((place) => (
                  <Badge key={place} variant="outline">
                    Gần {place}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Hình ảnh và video</CardTitle>
            <CardDescription>
              {images.length} ảnh · {videoCount} video
            </CardDescription>
          </CardHeader>
          <CardContent>
            {thumbnail ? (
              <div className="relative aspect-video overflow-hidden bg-muted">
                <Image
                  src={thumbnail.url}
                  alt={thumbnail.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex min-h-32 items-center justify-center border bg-muted/30 text-sm text-muted-foreground">
                Chưa có ảnh
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Tiện ích và chính sách</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {amenities.selected
              .filter((item) => item !== "other")
              .concat(customAmenities)
              .map((amenity) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
          </div>
          {common.policyDescription ? (
            <p className="text-sm text-muted-foreground">
              {common.policyDescription}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <PolicyList title="Được phép" items={allowedItems} />
            <PolicyList title="Không được phép" items={disallowedItems} />
          </div>
        </CardContent>
      </Card>

      {common.additionalCosts ? (
        <AddressValue label="Chi phí khác" value={common.additionalCosts} />
      ) : null}

      <Field>
        <FieldLabel>Mô tả</FieldLabel>
        <p className="text-sm leading-7 text-muted-foreground">
          {common.description}
        </p>
      </Field>
    </div>
  )
}

function AddressValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border bg-muted/30 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function ReviewFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HouseLineIcon
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border bg-muted/30 p-3">
      <Icon className="size-4 text-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <strong className="text-sm">{value}</strong>
    </div>
  )
}

function PolicyList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2 border bg-muted/30 p-3">
      <strong className="text-sm">{title}</strong>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Chưa khai báo</span>
      )}
    </div>
  )
}

function getStepTitle(step: number, mode: ListingMode) {
  if (step === 0) return "Giới thiệu chỗ ở"
  if (step === 1) return "Vị trí chỗ ở"
  if (step === 2) {
    return mode === "long_stay"
      ? "Giá thuê và thông tin phòng"
      : "Giá bán và sức chứa"
  }
  if (step === 3) return "Điểm nổi bật của chỗ ở"
  if (step === 4) return "Hình ảnh, video và chính sách"
  return "Tin đăng của bạn"
}

function getStepDescription(step: number, mode: ListingMode) {
  if (step === 0) {
    return "Chọn một hoặc nhiều loại hình; lựa chọn đầu tiên sẽ được ưu tiên hiển thị."
  }
  if (step === 1) {
    return "Khai báo theo địa giới mới hoặc cũ; hệ thống sẽ tự đối chiếu chiều còn lại."
  }
  if (step === 2 && mode === "long_stay") {
    return "Các thông tin khách thuê dài hạn thường quan tâm và dùng để lọc."
  }
  if (step === 2) {
    return "Các thông tin khách cần để quyết định đặt phòng ngắn hạn."
  }
  if (step === 3) {
    return "Khai báo tiện ích và mô tả đủ rõ để khách dễ tìm kiếm."
  }
  if (step === 4) {
    return "Bổ sung hình ảnh thực tế, video và các quy định cần biết."
  }
  return "Kiểm tra toàn bộ thông tin trước khi hoàn tất."
}

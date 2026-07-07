"use client"

import type {
  ComponentType,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
  TouchEvent,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRightIcon,
  BathtubIcon,
  BedIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  CheckIcon,
  CopyIcon,
  HouseLineIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SlidersHorizontalIcon,
  StarIcon,
  UsersThreeIcon,
  VideoCameraIcon,
  XIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ContactActions, ContactDrawer } from "@/components/contact-actions"
import { CopyableAddress } from "@/components/copyable-address"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/format"
import { getPrimaryRoomMedia, getVideoEmbedUrl } from "@/lib/media"
import {
  getAccommodationType,
  getAccommodationTypeLabels,
  getBathroomCount,
  getRoomDiscount,
  type PublicRoom,
} from "@/lib/rooms"
import { cn } from "@/lib/utils"

type RoomExplorerProps = {
  rooms: PublicRoom[]
}

type SortOption = "popular" | "price-asc" | "price-desc" | "newest"

type FilterUrlState = {
  query: string
  guests: string
  sort: SortOption
  priceRange: [number, number]
  selectedTypes: string[]
  selectedProvinces: string[]
  selectedFeaturedAreas: string[]
}

const initialVisibleRoomCount = 10
const loadMoreRoomCount = 6
const fallbackMaxGuests = 10
const fallbackPriceRangeBounds: [number, number] = [0, 8000000]
const priceRangeStep = 100000
const sortOptions: SortOption[] = [
  "popular",
  "price-asc",
  "price-desc",
  "newest",
]
const filterParamNames = [
  "q",
  "guests",
  "sort",
  "minPrice",
  "maxPrice",
  "type",
  "province",
  "area",
] as const

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

function runTouchAction<T extends HTMLElement>(
  event: TouchEvent<T>,
  action: () => void
) {
  event.preventDefault()
  event.stopPropagation()
  action()
}

const typeOptions = [
  { label: "Homestay", value: "Homestay" },
  { label: "Nhà nguyên căn", value: "Nhà nguyên căn" },
  { label: "Chung cư", value: "Chung cư" },
  { label: "Nhà nghỉ", value: "Nhà nghỉ" },
  { label: "Khách sạn", value: "Khách sạn" },
  { label: "Biệt thự/Villa", value: "Biệt thự/Villa" },
  { label: "Du thuyền", value: "Du thuyền" },
  { label: "Resort", value: "Resort" },
  { label: "Khác", value: "Khác" },
]

const provinceOptions = [
  { label: "TP.HCM", value: "TP. Hồ Chí Minh" },
  { label: "Hà Nội", value: "Hà Nội" },
  { label: "Đà Nẵng", value: "Đà Nẵng" },
  { label: "Quảng Nam", value: "Quảng Nam" },
  { label: "Lâm Đồng", value: "Lâm Đồng" },
  { label: "Kiên Giang", value: "Kiên Giang" },
  { label: "Quảng Ninh", value: "Quảng Ninh" },
  { label: "Bà Rịa - Vũng Tàu", value: "Bà Rịa - Vũng Tàu" },
  { label: "Thừa Thiên Huế", value: "Thừa Thiên Huế" },
]

const featuredAreaOptions = [
  { label: "Hạ Long", value: "Hạ Long" },
  { label: "Vũng Tàu", value: "Vũng Tàu" },
  { label: "Hội An", value: "Hội An" },
  { label: "Huế", value: "Huế" },
  { label: "Sơn Trà", value: "Sơn Trà" },
  { label: "Đà Lạt", value: "Đà Lạt" },
  { label: "Phú Quốc", value: "Phú Quốc" },
  { label: "Quận 1", value: "Quận 1" },
]

const typeValues = new Set(typeOptions.map((option) => option.value))
const provinceValues = new Set(provinceOptions.map((option) => option.value))
const featuredAreaValues = new Set(
  featuredAreaOptions.map((option) => option.value)
)

function getRoomScore(room: PublicRoom) {
  return room.featured ? "4.9" : "4.7"
}

function getGuestOptions(rooms: PublicRoom[]) {
  const maxGuests = Math.max(
    fallbackMaxGuests,
    ...rooms.map((room) => Math.max(0, Math.ceil(room.guests)))
  )

  return Array.from({ length: maxGuests }, (_, index) => String(index + 1))
}

function getPriceRangeBounds(rooms: PublicRoom[]): [number, number] {
  const prices = rooms
    .map((room) => room.referencePrice)
    .filter((price) => Number.isFinite(price) && price > 0)

  if (!prices.length) {
    return fallbackPriceRangeBounds
  }

  const roundedMin = Math.max(
    0,
    Math.floor(Math.min(...prices) / priceRangeStep) * priceRangeStep
  )
  const roundedMax =
    Math.ceil(Math.max(...prices) / priceRangeStep) * priceRangeStep

  return roundedMin === roundedMax
    ? [Math.max(0, roundedMin - priceRangeStep), roundedMax + priceRangeStep]
    : [roundedMin, roundedMax]
}

function getUniqueKnownValues(
  values: string[],
  allowedValues: ReadonlySet<string>
) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  ).filter((value) => allowedValues.has(value))
}

function getMultiParamValues(params: URLSearchParams, name: string) {
  return params
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
}

function getBoundedNumber(
  value: string | null,
  fallback: number,
  priceRangeBounds: [number, number]
) {
  if (!value?.trim()) {
    return fallback
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return fallback
  }

  return Math.min(
    priceRangeBounds[1],
    Math.max(priceRangeBounds[0], numberValue)
  )
}

function getFiltersFromSearchParams(
  params: URLSearchParams,
  priceRangeBounds: [number, number],
  guestOptions: string[]
): FilterUrlState {
  const minPrice = getBoundedNumber(
    params.get("minPrice"),
    priceRangeBounds[0],
    priceRangeBounds
  )
  const maxPrice = getBoundedNumber(
    params.get("maxPrice"),
    priceRangeBounds[1],
    priceRangeBounds
  )
  const priceRange: [number, number] =
    minPrice === priceRangeBounds[0] && maxPrice === priceRangeBounds[0]
      ? priceRangeBounds
      : [Math.min(minPrice, maxPrice), Math.max(minPrice, maxPrice)]
  const guestsParam = params.get("guests") ?? "1"
  const sortParam = params.get("sort")

  return {
    query: params.get("q")?.trim() ?? "",
    guests: guestOptions.includes(guestsParam) ? guestsParam : "1",
    sort: sortOptions.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : "popular",
    priceRange,
    selectedTypes: getUniqueKnownValues(
      getMultiParamValues(params, "type"),
      typeValues
    ),
    selectedProvinces: getUniqueKnownValues(
      getMultiParamValues(params, "province"),
      provinceValues
    ),
    selectedFeaturedAreas: getUniqueKnownValues(
      getMultiParamValues(params, "area"),
      featuredAreaValues
    ),
  }
}

function appendMultiParam(
  params: URLSearchParams,
  name: string,
  values: string[]
) {
  values.forEach((value) => {
    params.append(name, value)
  })
}

function writeFiltersToSearchParams(
  params: URLSearchParams,
  filters: FilterUrlState,
  priceRangeBounds: [number, number]
) {
  filterParamNames.forEach((name) => {
    params.delete(name)
  })

  if (filters.query.trim()) {
    params.set("q", filters.query.trim())
  }

  if (filters.guests !== "1") {
    params.set("guests", filters.guests)
  }

  if (filters.sort !== "popular") {
    params.set("sort", filters.sort)
  }

  if (
    filters.priceRange[0] !== priceRangeBounds[0] ||
    filters.priceRange[1] !== priceRangeBounds[1]
  ) {
    params.set("minPrice", String(filters.priceRange[0]))
    params.set("maxPrice", String(filters.priceRange[1]))
  }

  appendMultiParam(params, "type", filters.selectedTypes)
  appendMultiParam(params, "province", filters.selectedProvinces)
  appendMultiParam(params, "area", filters.selectedFeaturedAreas)

  return params
}

function getFilterQueryString(
  filters: FilterUrlState,
  priceRangeBounds: [number, number]
) {
  return writeFiltersToSearchParams(
    new URLSearchParams(),
    filters,
    priceRangeBounds
  ).toString()
}

function getFilterHref(
  pathname: string,
  currentSearchParams: URLSearchParams,
  filters: FilterUrlState,
  priceRangeBounds: [number, number]
) {
  const params = writeFiltersToSearchParams(
    new URLSearchParams(currentSearchParams.toString()),
    filters,
    priceRangeBounds
  )
  const queryString = params.toString()
  const filterQueryString = getFilterQueryString(filters, priceRangeBounds)

  return `${pathname}${queryString ? `?${queryString}` : ""}${
    filterQueryString ? "#tim-phong" : ""
  }`
}

function areFilterStatesEqual(
  first: FilterUrlState,
  second: FilterUrlState,
  priceRangeBounds: [number, number]
) {
  return (
    getFilterQueryString(first, priceRangeBounds) ===
    getFilterQueryString(second, priceRangeBounds)
  )
}

export function RoomExplorer({ rooms }: RoomExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const guestOptions = useMemo(() => getGuestOptions(rooms), [rooms])
  const priceRangeBounds = useMemo(() => getPriceRangeBounds(rooms), [rooms])
  const initialFilters = getFiltersFromSearchParams(
    new URLSearchParams(searchParams.toString()),
    priceRangeBounds,
    guestOptions
  )
  const [query, setQuery] = useState(initialFilters.query)
  const [heroDestination, setHeroDestination] = useState(initialFilters.query)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters.selectedTypes
  )
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(
    initialFilters.selectedProvinces
  )
  const [selectedFeaturedAreas, setSelectedFeaturedAreas] = useState<string[]>(
    initialFilters.selectedFeaturedAreas
  )
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters.priceRange
  )
  const [guests, setGuests] = useState(initialFilters.guests)
  const [sort, setSort] = useState<SortOption>(initialFilters.sort)
  const [visibleRoomState, setVisibleRoomState] = useState({
    count: initialVisibleRoomCount,
    key: "",
  })
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<PublicRoom | null>(null)
  const [featuredCanScrollPrev, setFeaturedCanScrollPrev] = useState(false)
  const [featuredCanScrollNext, setFeaturedCanScrollNext] = useState(false)
  const featuredScrollRef = useRef<HTMLDivElement>(null)
  const filterState = useMemo<FilterUrlState>(
    () => ({
      query,
      guests,
      sort,
      priceRange,
      selectedTypes,
      selectedProvinces,
      selectedFeaturedAreas,
    }),
    [
      guests,
      priceRange,
      query,
      selectedFeaturedAreas,
      selectedProvinces,
      selectedTypes,
      sort,
    ]
  )
  const filterStateRef = useRef(filterState)
  const syncingFiltersFromUrlRef = useRef(false)
  const serializedSearchParams = searchParams.toString()

  useEffect(() => {
    filterStateRef.current = filterState
  }, [filterState])

  useEffect(() => {
    const nextFilters = getFiltersFromSearchParams(
      new URLSearchParams(serializedSearchParams),
      priceRangeBounds,
      guestOptions
    )

    if (
      areFilterStatesEqual(
        filterStateRef.current,
        nextFilters,
        priceRangeBounds
      )
    ) {
      return
    }

    syncingFiltersFromUrlRef.current = true
    setQuery(nextFilters.query)
    setHeroDestination(nextFilters.query)
    setSelectedTypes(nextFilters.selectedTypes)
    setSelectedProvinces(nextFilters.selectedProvinces)
    setSelectedFeaturedAreas(nextFilters.selectedFeaturedAreas)
    setPriceRange(nextFilters.priceRange)
    setGuests(nextFilters.guests)
    setSort(nextFilters.sort)
  }, [guestOptions, priceRangeBounds, serializedSearchParams])

  useEffect(() => {
    if (syncingFiltersFromUrlRef.current) {
      syncingFiltersFromUrlRef.current = false
      return
    }

    const currentUrlFilters = getFiltersFromSearchParams(
      new URLSearchParams(serializedSearchParams),
      priceRangeBounds,
      guestOptions
    )

    if (
      areFilterStatesEqual(filterState, currentUrlFilters, priceRangeBounds)
    ) {
      return
    }

    router.replace(
      getFilterHref(
        pathname,
        new URLSearchParams(serializedSearchParams),
        filterState,
        priceRangeBounds
      ),
      { scroll: false }
    )
  }, [
    filterState,
    guestOptions,
    pathname,
    priceRangeBounds,
    router,
    serializedSearchParams,
  ])

  const heroImage = {
    src: "/brand/roovea-hero.png",
    alt: "Villa nghỉ dưỡng ven biển với hồ bơi và không gian lưu trú hiện đại",
  }
  const featuredRooms = useMemo(
    () => rooms.filter((room) => room.featured).slice(0, 6),
    [rooms]
  )
  const filteredRooms = useMemo(() => {
    const queryTokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)

    return rooms
      .filter((room) => {
        const searchable = [
          room.code,
          room.name,
          room.locationLevel1,
          room.locationLevel2,
          room.address,
          room.description,
          ...room.highlights,
          getAccommodationType(room),
        ]
          .join(" ")
          .toLowerCase()

        const queryMatched =
          queryTokens.length === 0 ||
          queryTokens.every((token) => searchable.includes(token))
        const typeMatched =
          selectedTypes.length === 0 ||
          selectedTypes.some((type) =>
            getAccommodationTypeLabels(room).includes(type)
          )
        const provinceMatched =
          selectedProvinces.length === 0 ||
          selectedProvinces.includes(room.locationLevel1)
        const featuredAreaMatched =
          selectedFeaturedAreas.length === 0 ||
          selectedFeaturedAreas.includes(room.locationLevel2)
        const priceMatched =
          room.referencePrice >= priceRange[0] &&
          room.referencePrice <= priceRange[1]
        const guestMatched = room.guests >= Number(guests || 1)

        return (
          queryMatched &&
          typeMatched &&
          provinceMatched &&
          featuredAreaMatched &&
          priceMatched &&
          guestMatched
        )
      })
      .sort((first, second) => {
        if (sort === "price-asc") {
          return first.referencePrice - second.referencePrice
        }

        if (sort === "price-desc") {
          return second.referencePrice - first.referencePrice
        }

        if (sort === "newest") {
          return (
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime()
          )
        }

        return Number(second.featured) - Number(first.featured)
      })
  }, [
    guests,
    priceRange,
    query,
    rooms,
    selectedFeaturedAreas,
    selectedProvinces,
    selectedTypes,
    sort,
  ])

  const filterKey = useMemo(
    () =>
      [
        query,
        guests,
        sort,
        priceRange.join("-"),
        selectedTypes.join(","),
        selectedProvinces.join(","),
        selectedFeaturedAreas.join(","),
      ].join("|"),
    [
      guests,
      priceRange,
      query,
      selectedFeaturedAreas,
      selectedProvinces,
      selectedTypes,
      sort,
    ]
  )
  const visibleRoomCount =
    visibleRoomState.key === filterKey
      ? visibleRoomState.count
      : initialVisibleRoomCount

  const activeFilters = [
    query ? { key: "query", label: query } : null,
    ...selectedTypes.map((value) => ({
      key: `type:${value}`,
      label: value,
    })),
    ...selectedProvinces.map((value) => ({
      key: `province:${value}`,
      label:
        provinceOptions.find((option) => option.value === value)?.label ??
        value,
    })),
    ...selectedFeaturedAreas.map((value) => ({
      key: `area:${value}`,
      label: value,
    })),
    priceRange[0] !== priceRangeBounds[0] ||
    priceRange[1] !== priceRangeBounds[1]
      ? {
          key: "price",
          label: `${formatCurrency(priceRange[0])} - ${formatCurrency(
            priceRange[1]
          )}`,
        }
      : null,
    Number(guests) > 1 ? { key: "guests", label: `${guests} khách` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>

  const visibleRooms = filteredRooms.slice(0, visibleRoomCount)
  const remainingRoomCount = Math.max(
    0,
    filteredRooms.length - visibleRooms.length
  )

  function clearAllFilters() {
    setQuery("")
    setHeroDestination("")
    setSelectedTypes([])
    setSelectedProvinces([])
    setSelectedFeaturedAreas([])
    setPriceRange(priceRangeBounds)
    setGuests("1")
    setSort("popular")
  }

  function removeFilter(key: string) {
    if (key === "query") {
      setQuery("")
      setHeroDestination("")
    }

    if (key.startsWith("type:")) {
      setSelectedTypes((current) =>
        current.filter((value) => value !== key.replace("type:", ""))
      )
    }

    if (key.startsWith("province:")) {
      setSelectedProvinces((current) =>
        current.filter((value) => value !== key.replace("province:", ""))
      )
    }

    if (key.startsWith("area:")) {
      setSelectedFeaturedAreas((current) =>
        current.filter((value) => value !== key.replace("area:", ""))
      )
    }

    if (key === "price") {
      setPriceRange(priceRangeBounds)
    }

    if (key === "guests") {
      setGuests("1")
    }
  }

  function toggleFilterValue(
    value: string,
    setter: Dispatch<SetStateAction<string[]>>
  ) {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  function submitHeroSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(heroDestination.trim())
    document
      .getElementById("tim-phong")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const updateFeaturedControls = useCallback(() => {
    const element = featuredScrollRef.current

    if (!element) {
      setFeaturedCanScrollPrev(false)
      setFeaturedCanScrollNext(false)
      return
    }

    setFeaturedCanScrollPrev(element.scrollLeft > 0)
    setFeaturedCanScrollNext(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 1
    )
  }, [])

  function scrollFeatured(offset: number) {
    featuredScrollRef.current?.scrollBy({ left: offset, behavior: "smooth" })
    window.setTimeout(updateFeaturedControls, 240)
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateFeaturedControls)
    window.addEventListener("resize", updateFeaturedControls)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("resize", updateFeaturedControls)
    }
  }, [featuredRooms, updateFeaturedControls])

  return (
    <>
      <section className="relative border-b bg-muted">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          className="pointer-events-none object-cover"
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#062514]/85 via-[#062514]/46 to-[#062514]/8" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062514]/35 via-transparent to-transparent" />
        <div className="relative mx-auto flex min-h-[640px] w-full max-w-7xl flex-col justify-center gap-8 px-4 pt-24 pb-10 sm:px-6 lg:min-h-[680px] lg:px-8">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/roovea-logo.png"
                alt=""
                width={56}
                height={56}
                className="size-14 border border-background/60 object-cover shadow-md"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-heading text-lg font-semibold text-white">
                  ROOVEA
                </p>
                <p className="text-sm font-semibold text-emerald-100">
                  | Better Places, Better Stays.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl font-heading text-4xl leading-tight font-semibold text-white sm:text-5xl lg:text-6xl">
                Khám phá nơi lưu trú phù hợp cho mọi chuyến đi
              </h1>
              <p className="max-w-xl text-base leading-7 font-medium text-white/88 sm:text-lg">
                Tìm kiếm, so sánh và đặt khách sạn, homestay cùng nhiều lựa chọn
                lưu trú chất lượng trên một nền tảng, giúp chuyến đi của bạn trở
                nên đơn giản và thuận tiện hơn.
              </p>
            </div>
          </div>

          <form
            className="w-full border bg-card/92 p-3 shadow-xl"
            onSubmit={submitHeroSearch}
          >
            <FieldGroup className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(150px,0.65fr)_minmax(150px,0.65fr)_auto] md:items-end">
              <Field>
                <FieldLabel htmlFor="hero-destination">Điểm đến</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="hero-destination"
                    value={heroDestination}
                    onChange={(event) => setHeroDestination(event.target.value)}
                    placeholder="Bạn muốn đi đâu?"
                  />
                  <InputGroupAddon>
                    <MapPinIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="hero-guests">Số khách</FieldLabel>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger id="hero-guests" className="w-full">
                    <SelectValue placeholder="Số khách" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    <SelectGroup>
                      {guestOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value} khách
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="hero-check-in">Ngày đi</FieldLabel>
                <Input id="hero-check-in" type="date" />
              </Field>
              <Button type="submit" className="h-10 md:h-full">
                <MagnifyingGlassIcon data-icon="inline-start" />
                Tìm phòng
              </Button>
            </FieldGroup>
          </form>
        </div>
      </section>

      <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <Badge variant="secondary" className="w-fit">
                Gợi ý nổi bật
              </Badge>
              <h2 className="font-heading text-2xl font-semibold md:text-3xl">
                Chỗ ở được quan tâm nhiều
              </h2>
              <p className="text-sm text-muted-foreground">
                Dạng slider ngang giống Roovia để lướt nhanh các lựa chọn đáng
                chú ý.
              </p>
            </div>
          </div>
          <div
            ref={featuredScrollRef}
            onScroll={updateFeaturedControls}
            className="grid snap-x [scrollbar-width:none] auto-cols-[minmax(280px,380px)] grid-flow-col gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
          >
            {featuredRooms.map((room) => (
              <RoomCard
                key={room.slug}
                room={room}
                onQuickView={() => setSelectedRoom(room)}
                showTypePrefix={false}
              />
            ))}
          </div>
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Xem phòng trước"
              disabled={!featuredCanScrollPrev}
              onClick={() => scrollFeatured(-360)}
            >
              <CaretLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Xem phòng tiếp theo"
              disabled={!featuredCanScrollNext}
              onClick={() => scrollFeatured(360)}
            >
              <CaretRightIcon />
            </Button>
          </div>
        </div>
      </section>

      <section
        id="tim-phong"
        className="border-t bg-muted/30 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-3xl flex-col gap-2">
              <Badge variant="secondary" className="w-fit">
                Tìm theo nhu cầu
              </Badge>
              <h2 className="font-heading text-2xl font-semibold md:text-3xl">
                Chọn phòng phù hợp với khách
              </h2>
              <p className="text-sm text-muted-foreground">
                Bố cục listing lấy nhịp từ Roovia: filter sidebar, danh sách
                chính và panel hỗ trợ bên phải.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_230px]">
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <FilterPanel
                  guestOptions={guestOptions}
                  guests={guests}
                  onClear={clearAllFilters}
                  onGuestsChange={setGuests}
                  onPriceRangeChange={setPriceRange}
                  onShowMore={() => setFilterDrawerOpen(true)}
                  onFeaturedAreaToggle={(value) =>
                    toggleFilterValue(value, setSelectedFeaturedAreas)
                  }
                  onProvinceToggle={(value) =>
                    toggleFilterValue(value, setSelectedProvinces)
                  }
                  onTypeToggle={(value) =>
                    toggleFilterValue(value, setSelectedTypes)
                  }
                  priceRange={priceRange}
                  priceRangeBounds={priceRangeBounds}
                  selectedFeaturedAreas={selectedFeaturedAreas}
                  selectedProvinces={selectedProvinces}
                  selectedTypes={selectedTypes}
                />
              </div>
            </aside>

            <div className="min-w-0">
              <Card className="sticky top-28 z-20 mb-4 bg-card/95 shadow-sm backdrop-blur lg:top-16">
                <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <InputGroup>
                    <InputGroupInput
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Tìm theo tên phòng, mã phòng hoặc địa điểm"
                    />
                    <InputGroupAddon>
                      <MagnifyingGlassIcon />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <MutedSurface>
                        {filteredRooms.length} kết quả
                      </MutedSurface>
                    </InputGroupAddon>
                  </InputGroup>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onTouchEnd={(event) =>
                        runTouchAction(event, () => setFilterDrawerOpen(true))
                      }
                      onClick={() => setFilterDrawerOpen(true)}
                    >
                      <SlidersHorizontalIcon data-icon="inline-start" />
                      Mở bộ lọc
                    </Button>
                    <Select
                      value={sort}
                      onValueChange={(value) => setSort(value as SortOption)}
                    >
                      <SelectTrigger className="w-[170px]">
                        <SelectValue placeholder="Sắp xếp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="popular">Phổ biến nhất</SelectItem>
                          <SelectItem value="newest">Mới cập nhật</SelectItem>
                          <SelectItem value="price-asc">
                            Giá thấp đến cao
                          </SelectItem>
                          <SelectItem value="price-desc">
                            Giá cao đến thấp
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                {activeFilters.length > 0 ? (
                  <CardFooter className="flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                      <Button
                        key={filter.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFilter(filter.key)}
                      >
                        {filter.label}
                        <XIcon data-icon="inline-end" />
                      </Button>
                    ))}
                  </CardFooter>
                ) : null}
              </Card>

              {filteredRooms.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {visibleRooms.map((room) => (
                      <RoomCard
                        key={room.slug}
                        room={room}
                        onQuickView={() => setSelectedRoom(room)}
                      />
                    ))}
                  </div>
                  {remainingRoomCount > 0 ? (
                    <div className="mt-6 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setVisibleRoomState({
                            count: visibleRoomCount + loadMoreRoomCount,
                            key: filterKey,
                          })
                        }
                      >
                        Xem thêm | Còn {remainingRoomCount} kết quả
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                      Đã hiển thị toàn bộ kết quả phù hợp.
                    </p>
                  )}
                </>
              ) : (
                <Empty className="border bg-card">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MagnifyingGlassIcon />
                    </EmptyMedia>
                    <EmptyTitle>Chưa có phòng phù hợp</EmptyTitle>
                    <EmptyDescription>Hãy thử bỏ bớt bộ lọc.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent className="max-w-md">
                    <p className="text-muted-foreground">
                      Hoặc liên hệ trực tiếp với Roovea để được tư vấn lựa chọn
                      phù hợp.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAllFilters}
                    >
                      Xóa bộ lọc
                    </Button>
                    <ContactDrawer label="Liên hệ với Roovea">
                      <Button type="button">Liên hệ với Roovea</Button>
                    </ContactDrawer>
                  </EmptyContent>
                </Empty>
              )}
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-20 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Vị trí quảng cáo</CardTitle>
                    <CardDescription>
                      Banner sẽ được đặt tại đây.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex min-h-64 items-center justify-center border border-dashed bg-muted/30 text-sm text-muted-foreground">
                      Banner quảng cáo
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] w-full max-w-5xl overflow-hidden sm:h-[min(92svh,720px)]"
        >
          <SheetHeader className="border-b">
            <SheetTitle>Bộ lọc phòng</SheetTitle>
            <SheetDescription>
              Lọc nhanh theo khu vực, số khách và khoảng giá.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
            <FilterPanel
              className="h-full max-h-none min-h-0"
              contentViewportClassName="max-h-none min-h-0 flex-1"
              guestOptions={guestOptions}
              guests={guests}
              showClearFooter={false}
              showAllOptions
              onClear={clearAllFilters}
              onGuestsChange={setGuests}
              onPriceRangeChange={setPriceRange}
              onFeaturedAreaToggle={(value) =>
                toggleFilterValue(value, setSelectedFeaturedAreas)
              }
              onProvinceToggle={(value) =>
                toggleFilterValue(value, setSelectedProvinces)
              }
              onTypeToggle={(value) =>
                toggleFilterValue(value, setSelectedTypes)
              }
              priceRange={priceRange}
              priceRangeBounds={priceRangeBounds}
              selectedFeaturedAreas={selectedFeaturedAreas}
              selectedProvinces={selectedProvinces}
              selectedTypes={selectedTypes}
            />
          </div>
          <SheetFooter className="border-t bg-popover p-3 sm:p-4">
            <Button type="button" variant="outline" onClick={clearAllFilters}>
              Xóa bộ lọc
            </Button>
            <SheetClose asChild>
              <Button className="w-full">Áp dụng</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <RoomQuickView
        room={selectedRoom}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRoom(null)
          }
        }}
      />
    </>
  )
}

function FilterPanel({
  className,
  contentViewportClassName,
  guestOptions,
  guests,
  onClear,
  onGuestsChange,
  onFeaturedAreaToggle,
  onPriceRangeChange,
  onProvinceToggle,
  onShowMore,
  onTypeToggle,
  priceRange,
  priceRangeBounds,
  selectedFeaturedAreas,
  selectedProvinces,
  selectedTypes,
  showAllOptions = false,
  showClearFooter = true,
}: {
  className?: string
  contentViewportClassName?: string
  guestOptions: string[]
  guests: string
  onClear: () => void
  onGuestsChange: (value: string) => void
  onFeaturedAreaToggle: (value: string) => void
  onPriceRangeChange: (value: [number, number]) => void
  onProvinceToggle: (value: string) => void
  onShowMore?: () => void
  onTypeToggle: (value: string) => void
  priceRange: [number, number]
  priceRangeBounds: [number, number]
  selectedFeaturedAreas: string[]
  selectedProvinces: string[]
  selectedTypes: string[]
  showAllOptions?: boolean
  showClearFooter?: boolean
}) {
  const [expandedGroups, setExpandedGroups] = useState({
    areas: false,
    provinces: false,
    types: false,
  })

  return (
    <Card
      className={cn(
        "flex max-h-[calc(100svh-6rem)] flex-col overflow-hidden",
        className
      )}
    >
      <CardHeader className="shrink-0">
        <CardTitle>Bộ lọc</CardTitle>
        <CardDescription>Tùy chọn tìm phòng nhanh</CardDescription>
        {onShowMore ? (
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onTouchEnd={(event) => runTouchAction(event, () => onShowMore())}
              onClick={onShowMore}
            >
              <SlidersHorizontalIcon data-icon="inline-start" />
              Mở bộ lọc
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <ScrollArea
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          contentViewportClassName
        )}
      >
        <CardContent className="flex flex-col gap-5 pb-4">
          <FilterOptionGroup
            defaultVisible={5}
            expanded={showAllOptions || expandedGroups.types}
            hideExpandedToggle={showAllOptions}
            id="type-filter"
            onExpandedChange={() =>
              onShowMore
                ? onShowMore()
                : setExpandedGroups((current) => ({
                    ...current,
                    types: !current.types,
                  }))
            }
            onToggle={onTypeToggle}
            options={typeOptions}
            selectedValues={selectedTypes}
            title="Loại hình"
          />
          <FilterOptionGroup
            defaultVisible={3}
            expanded={showAllOptions || expandedGroups.provinces}
            hideExpandedToggle={showAllOptions}
            id="province-filter"
            onExpandedChange={() =>
              onShowMore
                ? onShowMore()
                : setExpandedGroups((current) => ({
                    ...current,
                    provinces: !current.provinces,
                  }))
            }
            onToggle={onProvinceToggle}
            options={provinceOptions}
            selectedValues={selectedProvinces}
            title="Khu vực theo tỉnh"
          />
          <FilterOptionGroup
            defaultVisible={4}
            expanded={showAllOptions || expandedGroups.areas}
            hideExpandedToggle={showAllOptions}
            id="featured-area-filter"
            onExpandedChange={() =>
              onShowMore
                ? onShowMore()
                : setExpandedGroups((current) => ({
                    ...current,
                    areas: !current.areas,
                  }))
            }
            onToggle={onFeaturedAreaToggle}
            options={featuredAreaOptions}
            selectedValues={selectedFeaturedAreas}
            title="Khu vực nổi bật"
          />
          <FieldSet>
            <FieldLegend>Mức giá</FieldLegend>
            <FieldDescription>
              {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
            </FieldDescription>
            <div className="flex flex-col gap-3 pt-2">
              <Slider
                min={priceRangeBounds[0]}
                max={priceRangeBounds[1]}
                step={priceRangeStep}
                value={priceRange}
                onValueChange={(value) =>
                  onPriceRangeChange(value as [number, number])
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(priceRangeBounds[0])}</span>
                <span>{formatCurrency(priceRangeBounds[1])}</span>
              </div>
            </div>
          </FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="guest-filter">Số khách tối thiểu</FieldLabel>
              <Select value={guests} onValueChange={onGuestsChange}>
                <SelectTrigger id="guest-filter" className="w-full">
                  <SelectValue placeholder="Số khách" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  <SelectGroup>
                    {guestOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} khách
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </ScrollArea>
      {showClearFooter ? (
        <CardFooter className="shrink-0 bg-card">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClear}
          >
            Xóa bộ lọc
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

function FilterOptionGroup({
  defaultVisible,
  expanded,
  hideExpandedToggle = false,
  id,
  onExpandedChange,
  onToggle,
  options,
  selectedValues,
  title,
}: {
  defaultVisible: number
  expanded: boolean
  hideExpandedToggle?: boolean
  id: string
  onExpandedChange: () => void
  onToggle: (value: string) => void
  options: Array<{ label: string; value: string }>
  selectedValues: string[]
  title: string
}) {
  const visibleOptions = expanded ? options : options.slice(0, defaultVisible)

  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      <FieldGroup className="gap-2 pt-2">
        {visibleOptions.map((option) => {
          const optionId = `${id}-${option.value
            .toLowerCase()
            .replace(/\s+/g, "-")}`

          return (
            <Field key={option.value} orientation="horizontal">
              <Checkbox
                id={optionId}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <FieldLabel htmlFor={optionId} className="font-normal">
                {option.label}
              </FieldLabel>
            </Field>
          )
        })}
        {!hideExpandedToggle && options.length > defaultVisible ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0"
            onClick={onExpandedChange}
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
            {expanded ? (
              <CaretUpIcon data-icon="inline-end" />
            ) : (
              <CaretDownIcon data-icon="inline-end" />
            )}
          </Button>
        ) : null}
      </FieldGroup>
    </FieldSet>
  )
}

export function RoomCard({
  room,
  onQuickView,
  showTypePrefix = true,
}: {
  room: PublicRoom
  onQuickView?: () => void
  showTypePrefix?: boolean
}) {
  const image = getPrimaryRoomMedia(room.media)
  const accommodationType = getAccommodationType(room)
  const title =
    showTypePrefix && accommodationType
      ? `${accommodationType} | ${room.name}`
      : room.name
  const discount = getRoomDiscount(room)
  const [copiedCode, setCopiedCode] = useState(false)
  const [localQuickViewOpen, setLocalQuickViewOpen] = useState(false)
  const handleQuickView = onQuickView ?? (() => setLocalQuickViewOpen(true))

  async function copyRoomCode() {
    try {
      const copied = await writeClipboardText(room.code)

      if (!copied) {
        throw new Error("Clipboard copy failed")
      }

      setCopiedCode(true)
      toast.success(`Đã sao chép mã phòng #${room.code}`)
      window.setTimeout(() => setCopiedCode(false), 1600)
    } catch {
      toast.info("Bạn có thể chọn và sao chép mã phòng thủ công.")
    }
  }

  return (
    <>
      <Card size="sm" className="pt-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Link href={`/phong/${room.slug}`} aria-label={`Xem ${room.name}`}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.03]"
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw"
            />
          </Link>
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
            {room.featured ? <Badge>Nổi bật</Badge> : null}
            {discount ? (
              <>
                <Badge variant="secondary">Giảm {discount.percent}%</Badge>
                <Badge variant="secondary">
                  Tiết kiệm {formatCurrency(discount.saving)}
                </Badge>
              </>
            ) : null}
          </div>
          <button
            type="button"
            className="absolute right-3 bottom-3 inline-flex h-7 max-w-[calc(100%-1.5rem)] items-center gap-1.5 border bg-background/95 px-2.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            aria-label={`Sao chép mã phòng #${room.code}`}
            title="Sao chép mã phòng"
            onClick={copyRoomCode}
          >
            <span className="truncate">#{room.code}</span>
            {copiedCode ? (
              <CheckIcon data-icon="inline-end" />
            ) : (
              <CopyIcon data-icon="inline-end" />
            )}
          </button>
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-2">
            <Link href={`/phong/${room.slug}`}>{title}</Link>
          </CardTitle>
          <CardDescription>
            {room.locationLevel2}, {room.locationLevel1}
          </CardDescription>
          <CardAction>
            <Badge variant="outline">
              <StarIcon data-icon="inline-start" />
              {getRoomScore(room)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {room.address}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <InlineFact icon={UsersThreeIcon} label={`${room.guests} khách`} />
            <InlineFact icon={BedIcon} label={`${room.bedrooms} phòng ngủ`} />
            <InlineFact
              icon={BathtubIcon}
              label={`${getBathroomCount(room)} phòng tắm`}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Giá tham khảo</span>
            <span className="text-base font-semibold">
              {formatCurrency(room.referencePrice)}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(room.strikePrice)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 max-sm:w-full">
            <Button
              type="button"
              variant="outline"
              className="max-sm:h-10 max-sm:flex-1"
              onTouchEnd={(event) => runTouchAction(event, handleQuickView)}
              onClick={handleQuickView}
            >
              Xem nhanh
            </Button>
            <Button asChild className="max-sm:h-10 max-sm:flex-1">
              <Link
                href={`/phong/${room.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Chi tiết
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
      {onQuickView ? null : (
        <RoomQuickView
          room={localQuickViewOpen ? room : null}
          onOpenChange={setLocalQuickViewOpen}
        />
      )}
    </>
  )
}

function RoomQuickView({
  room,
  onOpenChange,
}: {
  room: PublicRoom | null
  onOpenChange: (open: boolean) => void
}) {
  const image = getPrimaryRoomMedia(room?.media ?? [])
  const imageOptions = room?.media.filter((item) => item.type === "image") ?? []
  const videoOptions = room?.media.filter((item) => item.type === "video") ?? []
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null)
  const activeImage =
    imageOptions.find((item) => item.src === activeImageSrc) ?? image

  return (
    <Sheet open={Boolean(room)} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] w-full max-w-5xl overflow-hidden sm:h-[min(92svh,760px)] lg:!h-[760px] lg:!max-h-[calc(100svh-2rem)]"
      >
        {room ? (
          <>
            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 z-10"
              >
                Đóng
              </Button>
            </SheetClose>
            <SheetHeader>
              <SheetTitle>{room.name}</SheetTitle>
              <SheetDescription>
                Mã phòng {room.code} · {room.locationLevel2},{" "}
                {room.locationLevel1}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1 overflow-hidden">
              <div className="grid gap-5 px-4 pb-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="relative aspect-[4/3] min-h-64 overflow-hidden bg-muted">
                    <Image
                      src={activeImage.src}
                      alt={activeImage.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </div>
                  {imageOptions.length > 1 ? (
                    <div className="max-w-full overflow-x-auto overflow-y-hidden pb-1">
                      <div className="flex min-w-full gap-1">
                        {imageOptions.map((item) => (
                          <button
                            key={item.src}
                            type="button"
                            aria-label={`Xem ảnh ${item.alt}`}
                            className={cn(
                              "relative h-20 w-28 shrink-0 overflow-hidden bg-muted ring-1 ring-border",
                              activeImage.src === item.src && "ring-primary"
                            )}
                            onClick={() => setActiveImageSrc(item.src)}
                          >
                            <Image
                              src={item.src}
                              alt={item.alt}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {videoOptions.length > 0 ? (
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <VideoCameraIcon className="size-4 text-primary" />
                        Video
                      </div>
                      <div className="max-w-full overflow-x-auto overflow-y-hidden pb-1">
                        <div className="flex min-w-full gap-2">
                          {videoOptions.map((item) => {
                            const embedUrl = getVideoEmbedUrl(item.src)

                            return (
                              <div
                                key={item.src}
                                className="aspect-video w-72 shrink-0 overflow-hidden bg-muted"
                              >
                                {embedUrl ? (
                                  <iframe
                                    src={embedUrl}
                                    title={item.alt}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center">
                                    <Button asChild variant="secondary">
                                      <a
                                        href={item.src}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Mở video
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    {room.highlights.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold">
                        {formatCurrency(room.referencePrice)}
                      </p>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(room.strikePrice)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {room.description}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <RoomFact icon={BedIcon} label={`${room.bedrooms} PN`} />
                    <RoomFact
                      icon={UsersThreeIcon}
                      label={`${room.guests} khách`}
                    />
                    <RoomFact icon={HouseLineIcon} label={room.area} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <CopyableAddress
                      address={`${room.address}, ${room.locationLevel1}`}
                    />
                    <Button asChild variant="outline" className="w-fit">
                      <a
                        href={room.googleMapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPinIcon data-icon="inline-start" />
                        Mở Google Maps
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="sm:flex-row sm:justify-end">
              <ContactActions roomCode={room.code} />
              <Button asChild>
                <Link href={`/phong/${room.slug}`}>
                  Xem link chi tiết
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function InlineFact({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-4 text-primary" />
      {label}
    </span>
  )
}

function MutedSurface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center bg-muted px-2 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

function RoomFact({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 bg-muted px-2 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  )
}

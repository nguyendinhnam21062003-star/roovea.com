"use client"

import type { FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRightIcon,
  BuildingsIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  HouseLineIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SlidersHorizontalIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { ContactActions, ContactDrawer } from "@/components/contact-actions"
import { CopyableAddress } from "@/components/copyable-address"
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
import { ScrollArea } from "@/components/ui/scroll-area"
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/format"
import { getRentalThumbnail } from "@/lib/rentals/helpers"
import {
  getRentalAmenityLabel,
  getRentalTypeLabel,
  rentalAmenityOptions,
  rentalTypeOptions,
} from "@/lib/rentals/options"
import type { PublicRentalListing } from "@/lib/rentals/types"
import { cn } from "@/lib/utils"

type SortOption = "newest" | "priceasc" | "pricedesc"

type RentalFilterState = {
  query: string
  selectedDistricts: string[]
  legacyWard: string
  selectedTypes: string[]
  priceRange: [number, number]
  sort: SortOption
  newWard: string
  minArea: string
  minOccupants: string
  amenities: string[]
}

const initialVisibleRentalCount = 10
const loadMoreRentalCount = 6
const fallbackPriceRangeBounds: [number, number] = [0, 10_000_000]
const priceRangeStep = 100_000
const sortOptions: SortOption[] = ["newest", "priceasc", "pricedesc"]
const filterParamNames = [
  "q",
  "district",
  "ward",
  "type",
  "minPrice",
  "maxPrice",
  "sort",
  "newWard",
  "minArea",
  "occupants",
  "amenity",
] as const

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) =>
    first.localeCompare(second, "vi")
  )
}

function getKnownParam(
  params: URLSearchParams,
  name: string,
  options: string[]
) {
  const value = params.get(name)?.trim() ?? ""
  return options.includes(value) ? value : "all"
}

function getKnownValues(
  params: URLSearchParams,
  name: string,
  options: readonly string[]
) {
  const knownValues = new Set(options)
  return Array.from(
    new Set(
      params
        .getAll(name)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter((value) => knownValues.has(value))
    )
  )
}

function getPriceRangeBounds(rentals: PublicRentalListing[]): [number, number] {
  const prices = rentals
    .map((rental) => rental.monthlyPrice)
    .filter((price) => Number.isFinite(price) && price > 0)

  if (!prices.length) return fallbackPriceRangeBounds

  const min = Math.max(
    0,
    Math.floor(Math.min(...prices) / priceRangeStep) * priceRangeStep
  )
  const max = Math.ceil(Math.max(...prices) / priceRangeStep) * priceRangeStep

  return min === max
    ? [Math.max(0, min - priceRangeStep), max + priceRangeStep]
    : [min, max]
}

function getBoundedNumber(
  value: string | null,
  fallback: number,
  bounds: [number, number]
) {
  const numberValue = Number(value)
  if (!value?.trim() || !Number.isFinite(numberValue)) return fallback
  return Math.min(bounds[1], Math.max(bounds[0], numberValue))
}

function getRentalFiltersFromSearchParams(
  params: URLSearchParams,
  districts: string[],
  wards: string[],
  newWards: string[],
  priceRangeBounds: [number, number]
): RentalFilterState {
  const sort = params.get("sort") as SortOption | null
  const typeValues = rentalTypeOptions.map((option) => option.value)
  const knownAmenities = new Set(
    rentalAmenityOptions.map((option) => option.value as string)
  )

  return {
    query: params.get("q")?.trim() ?? "",
    selectedDistricts: getKnownValues(params, "district", districts),
    legacyWard: getKnownParam(params, "ward", wards),
    selectedTypes: getKnownValues(params, "type", typeValues),
    priceRange: [
      getBoundedNumber(
        params.get("minPrice"),
        priceRangeBounds[0],
        priceRangeBounds
      ),
      getBoundedNumber(
        params.get("maxPrice"),
        priceRangeBounds[1],
        priceRangeBounds
      ),
    ].sort((first, second) => first - second) as [number, number],
    sort: sort && sortOptions.includes(sort) ? sort : "newest",
    newWard: getKnownParam(params, "newWard", newWards),
    minArea: /^\d+$/.test(params.get("minArea") ?? "")
      ? (params.get("minArea") ?? "")
      : "",
    minOccupants: /^\d+$/.test(params.get("occupants") ?? "")
      ? (params.get("occupants") ?? "1")
      : "1",
    amenities: Array.from(
      new Set(
        params.getAll("amenity").filter((value) => knownAmenities.has(value))
      )
    ),
  }
}

function writeRentalFiltersToSearchParams(
  params: URLSearchParams,
  filters: RentalFilterState,
  priceRangeBounds: [number, number]
) {
  filterParamNames.forEach((name) => params.delete(name))

  if (filters.query.trim()) params.set("q", filters.query.trim())
  filters.selectedDistricts.forEach((district) =>
    params.append("district", district)
  )
  if (filters.legacyWard !== "all") params.set("ward", filters.legacyWard)
  filters.selectedTypes.forEach((type) => params.append("type", type))
  if (
    filters.priceRange[0] !== priceRangeBounds[0] ||
    filters.priceRange[1] !== priceRangeBounds[1]
  ) {
    params.set("minPrice", String(filters.priceRange[0]))
    params.set("maxPrice", String(filters.priceRange[1]))
  }
  if (filters.sort !== "newest") params.set("sort", filters.sort)
  if (filters.newWard !== "all") params.set("newWard", filters.newWard)
  if (filters.minArea) params.set("minArea", filters.minArea)
  if (filters.minOccupants !== "1") {
    params.set("occupants", filters.minOccupants)
  }
  filters.amenities.forEach((amenity) => params.append("amenity", amenity))

  return params
}

function getRentalFilterQuery(
  filters: RentalFilterState,
  priceRangeBounds: [number, number]
) {
  return writeRentalFiltersToSearchParams(
    new URLSearchParams(),
    filters,
    priceRangeBounds
  ).toString()
}

function getRentalFilterHref(
  pathname: string,
  currentSearchParams: URLSearchParams,
  filters: RentalFilterState,
  priceRangeBounds: [number, number]
) {
  const params = writeRentalFiltersToSearchParams(
    new URLSearchParams(currentSearchParams.toString()),
    filters,
    priceRangeBounds
  )
  const query = params.toString()
  const hasFilters = getRentalFilterQuery(filters, priceRangeBounds).length > 0

  return `${pathname}${query ? `?${query}` : ""}${
    hasFilters ? "#timphongtro" : ""
  }`
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  document.body.removeChild(textarea)
}

export function RentalExplorer({
  rentals,
}: {
  rentals: PublicRentalListing[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const serializedSearchParams = searchParams.toString()
  const districts = useMemo(
    () => uniqueSorted(rentals.map((rental) => rental.legacyDistrict)),
    [rentals]
  )
  const allLegacyWards = useMemo(
    () => uniqueSorted(rentals.map((rental) => rental.legacyWard)),
    [rentals]
  )
  const newWards = useMemo(
    () => uniqueSorted(rentals.map((rental) => rental.newWard)),
    [rentals]
  )
  const priceRangeBounds = useMemo(
    () => getPriceRangeBounds(rentals),
    [rentals]
  )
  const initialFilters = getRentalFiltersFromSearchParams(
    new URLSearchParams(serializedSearchParams),
    districts,
    allLegacyWards,
    newWards,
    priceRangeBounds
  )
  const [query, setQuery] = useState(initialFilters.query)
  const [heroDestination, setHeroDestination] = useState(initialFilters.query)
  const [heroDistrict, setHeroDistrict] = useState(
    initialFilters.selectedDistricts[0] ?? "all"
  )
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    initialFilters.selectedDistricts
  )
  const [legacyWard, setLegacyWard] = useState(initialFilters.legacyWard)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters.selectedTypes
  )
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters.priceRange
  )
  const [sort, setSort] = useState<SortOption>(initialFilters.sort)
  const [newWard, setNewWard] = useState(initialFilters.newWard)
  const [minArea, setMinArea] = useState(initialFilters.minArea)
  const [minOccupants, setMinOccupants] = useState(initialFilters.minOccupants)
  const [amenities, setAmenities] = useState<string[]>(initialFilters.amenities)
  const [visibleRentalState, setVisibleRentalState] = useState({
    count: initialVisibleRentalCount,
    key: "",
  })
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [selectedRental, setSelectedRental] =
    useState<PublicRentalListing | null>(null)
  const [featuredCanScrollPrev, setFeaturedCanScrollPrev] = useState(false)
  const [featuredCanScrollNext, setFeaturedCanScrollNext] = useState(false)
  const featuredScrollRef = useRef<HTMLDivElement>(null)
  const filterState = useMemo<RentalFilterState>(
    () => ({
      query,
      selectedDistricts,
      legacyWard,
      selectedTypes,
      priceRange,
      sort,
      newWard,
      minArea,
      minOccupants,
      amenities,
    }),
    [
      amenities,
      legacyWard,
      minArea,
      minOccupants,
      newWard,
      priceRange,
      query,
      selectedDistricts,
      selectedTypes,
      sort,
    ]
  )
  const filterStateRef = useRef(filterState)
  const syncingFromUrlRef = useRef(false)
  const legacyWards = useMemo(
    () =>
      uniqueSorted(
        rentals
          .filter(
            (rental) =>
              selectedDistricts.length === 0 ||
              selectedDistricts.includes(rental.legacyDistrict)
          )
          .map((rental) => rental.legacyWard)
      ),
    [rentals, selectedDistricts]
  )

  useEffect(() => {
    filterStateRef.current = filterState
  }, [filterState])

  useEffect(() => {
    const nextFilters = getRentalFiltersFromSearchParams(
      new URLSearchParams(serializedSearchParams),
      districts,
      allLegacyWards,
      newWards,
      priceRangeBounds
    )

    if (
      getRentalFilterQuery(filterStateRef.current, priceRangeBounds) ===
      getRentalFilterQuery(nextFilters, priceRangeBounds)
    ) {
      return
    }

    syncingFromUrlRef.current = true
    setQuery(nextFilters.query)
    setHeroDestination(nextFilters.query)
    setHeroDistrict(nextFilters.selectedDistricts[0] ?? "all")
    setSelectedDistricts(nextFilters.selectedDistricts)
    setLegacyWard(nextFilters.legacyWard)
    setSelectedTypes(nextFilters.selectedTypes)
    setPriceRange(nextFilters.priceRange)
    setSort(nextFilters.sort)
    setNewWard(nextFilters.newWard)
    setMinArea(nextFilters.minArea)
    setMinOccupants(nextFilters.minOccupants)
    setAmenities(nextFilters.amenities)
  }, [
    allLegacyWards,
    districts,
    newWards,
    priceRangeBounds,
    serializedSearchParams,
  ])

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      syncingFromUrlRef.current = false
      return
    }

    const currentFilters = getRentalFiltersFromSearchParams(
      new URLSearchParams(serializedSearchParams),
      districts,
      allLegacyWards,
      newWards,
      priceRangeBounds
    )

    if (
      getRentalFilterQuery(filterState, priceRangeBounds) ===
      getRentalFilterQuery(currentFilters, priceRangeBounds)
    ) {
      return
    }

    router.replace(
      getRentalFilterHref(
        pathname,
        new URLSearchParams(serializedSearchParams),
        filterState,
        priceRangeBounds
      ),
      { scroll: false }
    )
  }, [
    allLegacyWards,
    districts,
    filterState,
    newWards,
    pathname,
    priceRangeBounds,
    router,
    serializedSearchParams,
  ])

  const featuredRentals = useMemo(
    () =>
      [...rentals]
        .sort((first, second) => {
          const verifiedDifference =
            Number(second.ownerVerified) - Number(first.ownerVerified)
          if (verifiedDifference !== 0) return verifiedDifference
          return (
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime()
          )
        })
        .slice(0, 6),
    [rentals]
  )
  const heroRental = featuredRentals[0] ?? rentals[0]
  const heroThumbnail = heroRental ? getRentalThumbnail(heroRental) : null
  const heroImage = {
    src: heroThumbnail?.url ?? "/brand/roovea-hero.png",
    alt:
      heroThumbnail?.caption ||
      heroRental?.name ||
      "Không gian phòng trọ sáng sủa và tiện nghi",
  }
  const filteredRentals = useMemo(() => {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)

    return rentals
      .filter((rental) => {
        const searchable = [
          rental.code,
          rental.name,
          rental.description,
          rental.newWard,
          rental.legacyWard,
          rental.legacyDistrict,
          rental.addressDetail,
          ...rental.nearbyPlaces,
        ]
          .join(" ")
          .toLowerCase()

        return (
          tokens.every((token) => searchable.includes(token)) &&
          (selectedDistricts.length === 0 ||
            selectedDistricts.includes(rental.legacyDistrict)) &&
          (legacyWard === "all" || rental.legacyWard === legacyWard) &&
          (selectedTypes.length === 0 ||
            selectedTypes.includes(rental.rentalType)) &&
          rental.monthlyPrice >= priceRange[0] &&
          rental.monthlyPrice <= priceRange[1] &&
          (newWard === "all" || rental.newWard === newWard) &&
          (!minArea || rental.areaM2 >= Number(minArea)) &&
          rental.maxOccupants >= Number(minOccupants || 1) &&
          amenities.every((amenity) => rental.amenities.includes(amenity))
        )
      })
      .sort((first, second) => {
        if (sort === "priceasc") return first.monthlyPrice - second.monthlyPrice
        if (sort === "pricedesc")
          return second.monthlyPrice - first.monthlyPrice
        return (
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime()
        )
      })
  }, [
    amenities,
    legacyWard,
    minArea,
    minOccupants,
    newWard,
    priceRange,
    query,
    rentals,
    selectedDistricts,
    selectedTypes,
    sort,
  ])
  const filterKey = getRentalFilterQuery(filterState, priceRangeBounds)
  const visibleRentalCount =
    visibleRentalState.key === filterKey
      ? visibleRentalState.count
      : initialVisibleRentalCount
  const visibleRentals = filteredRentals.slice(0, visibleRentalCount)
  const remainingRentalCount = Math.max(
    0,
    filteredRentals.length - visibleRentals.length
  )
  const activeFilters = [
    query ? { key: "query", label: query } : null,
    ...selectedDistricts.map((district) => ({
      key: `district:${district}`,
      label: district,
    })),
    legacyWard !== "all" ? { key: "ward", label: legacyWard } : null,
    ...selectedTypes.map((type) => ({
      key: `type:${type}`,
      label:
        rentalTypeOptions.find((option) => option.value === type)?.label ??
        type,
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
    newWard !== "all" ? { key: "newWard", label: newWard } : null,
    minArea ? { key: "minArea", label: `Từ ${minArea} m²` } : null,
    minOccupants !== "1"
      ? { key: "occupants", label: `Từ ${minOccupants} người` }
      : null,
    ...amenities.map((amenity) => ({
      key: `amenity:${amenity}`,
      label: getRentalAmenityLabel(amenity),
    })),
  ].filter(Boolean) as Array<{ key: string; label: string }>

  useEffect(() => {
    const element = featuredScrollRef.current
    if (!element) return

    const updateControls = () => {
      setFeaturedCanScrollPrev(element.scrollLeft > 2)
      setFeaturedCanScrollNext(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 2
      )
    }

    updateControls()
    window.addEventListener("resize", updateControls)
    return () => window.removeEventListener("resize", updateControls)
  }, [featuredRentals.length])

  function clearFilters() {
    setQuery("")
    setHeroDestination("")
    setHeroDistrict("all")
    setSelectedDistricts([])
    setLegacyWard("all")
    setSelectedTypes([])
    setPriceRange(priceRangeBounds)
    setSort("newest")
    setNewWard("all")
    setMinArea("")
    setMinOccupants("1")
    setAmenities([])
  }

  function removeFilter(key: string) {
    if (key === "query") {
      setQuery("")
      setHeroDestination("")
    } else if (key.startsWith("district:")) {
      const district = key.replace("district:", "")
      setSelectedDistricts((current) =>
        current.filter((item) => item !== district)
      )
      if (heroDistrict === district) setHeroDistrict("all")
      setLegacyWard("all")
    } else if (key === "ward") {
      setLegacyWard("all")
    } else if (key.startsWith("type:")) {
      const type = key.replace("type:", "")
      setSelectedTypes((current) => current.filter((item) => item !== type))
    } else if (key === "price") {
      setPriceRange(priceRangeBounds)
    } else if (key === "newWard") {
      setNewWard("all")
    } else if (key === "minArea") {
      setMinArea("")
    } else if (key === "occupants") {
      setMinOccupants("1")
    } else if (key.startsWith("amenity:")) {
      const amenity = key.replace("amenity:", "")
      setAmenities((current) => current.filter((item) => item !== amenity))
    }
  }

  function submitHeroSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(heroDestination.trim())
    setSelectedDistricts(heroDistrict === "all" ? [] : [heroDistrict])
    setLegacyWard("all")
    window.requestAnimationFrame(() => {
      document.getElementById("timphongtro")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }

  function updateFeaturedControls() {
    const element = featuredScrollRef.current
    if (!element) return
    setFeaturedCanScrollPrev(element.scrollLeft > 2)
    setFeaturedCanScrollNext(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 2
    )
  }

  function scrollFeatured(offset: number) {
    featuredScrollRef.current?.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <>
      <section className="relative border-b bg-muted">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          preload
          className="pointer-events-none object-cover"
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#062514]/88 via-[#062514]/52 to-[#062514]/12" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062514]/40 via-transparent to-transparent" />
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
                Tìm nơi ở phù hợp để an tâm mỗi ngày
              </h1>
              <p className="max-w-xl text-base leading-7 font-medium text-white/88 sm:text-lg">
                Khám phá phòng trọ, căn hộ mini và chỗ ở dài hạn tại TP.HCM. Tìm
                đúng khu vực, so sánh tiện ích và kết nối với Roovea trên một
                hành trình đơn giản.
              </p>
            </div>
          </div>

          <form
            className="w-full border bg-card/92 p-3 shadow-xl"
            onSubmit={submitHeroSearch}
          >
            <FieldGroup className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.8fr)_minmax(150px,0.6fr)_auto] md:items-end">
              <Field>
                <FieldLabel htmlFor="rental-hero-destination">
                  Khu vực hoặc từ khóa
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="rental-hero-destination"
                    value={heroDestination}
                    onChange={(event) => setHeroDestination(event.target.value)}
                    placeholder="Tên phòng, trường học, đường..."
                  />
                  <InputGroupAddon>
                    <MapPinIcon />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <FilterSelect
                id="rental-hero-district"
                label="Quận/huyện cũ"
                value={heroDistrict}
                options={districts.map((value) => ({ value, label: value }))}
                onChange={setHeroDistrict}
              />
              <Field>
                <FieldLabel htmlFor="rental-hero-occupants">
                  Số người ở
                </FieldLabel>
                <Select value={minOccupants} onValueChange={setMinOccupants}>
                  <SelectTrigger id="rental-hero-occupants" className="w-full">
                    <SelectValue placeholder="Số người" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["1", "2", "3", "4", "5", "6"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value} người
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Button type="submit" className="h-10 md:h-full">
                <MagnifyingGlassIcon data-icon="inline-start" />
                Tìm phòng
              </Button>
            </FieldGroup>
          </form>
        </div>
      </section>

      {featuredRentals.length > 0 ? (
        <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <div className="flex max-w-2xl flex-col gap-2">
              <Badge variant="secondary" className="w-fit">
                Gợi ý nổi bật
              </Badge>
              <h2 className="font-heading text-2xl font-semibold md:text-3xl">
                Phòng trọ đáng chú ý
              </h2>
              <p className="text-sm text-muted-foreground">
                Lướt nhanh các tin mới và những phòng từ chủ nhà đã xác minh.
              </p>
            </div>
            <div
              ref={featuredScrollRef}
              onScroll={updateFeaturedControls}
              className="grid snap-x [scrollbar-width:none] auto-cols-[minmax(280px,380px)] grid-flow-col gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden"
            >
              {featuredRentals.map((rental) => (
                <RentalCard
                  key={rental.id}
                  rental={rental}
                  onQuickView={() => setSelectedRental(rental)}
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
      ) : null}

      <section
        id="timphongtro"
        className="border-t bg-muted/30 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              Tìm theo nhu cầu
            </Badge>
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">
              Chọn phòng phù hợp để ở lâu dài
            </h2>
            <p className="text-sm text-muted-foreground">
              Lọc theo địa giới quen thuộc, ngân sách, diện tích và tiện ích bạn
              cần.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_230px]">
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <RentalFilterPanel
                  amenities={amenities}
                  districts={districts}
                  legacyWard={legacyWard}
                  legacyWards={legacyWards}
                  minArea={minArea}
                  minOccupants={minOccupants}
                  newWard={newWard}
                  newWards={newWards}
                  priceRange={priceRange}
                  priceRangeBounds={priceRangeBounds}
                  selectedDistricts={selectedDistricts}
                  selectedTypes={selectedTypes}
                  onAmenitiesChange={setAmenities}
                  onClear={clearFilters}
                  onLegacyWardChange={setLegacyWard}
                  onMinAreaChange={setMinArea}
                  onMinOccupantsChange={setMinOccupants}
                  onNewWardChange={setNewWard}
                  onPriceRangeChange={setPriceRange}
                  onDistrictToggle={(value) => {
                    setSelectedDistricts((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value]
                    )
                    setLegacyWard("all")
                  }}
                  onTypeToggle={(value) =>
                    setSelectedTypes((current) =>
                      current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value]
                    )
                  }
                  onShowMore={() => setFilterDrawerOpen(true)}
                />
              </div>
            </aside>

            <div className="min-w-0">
              <Card className="sticky top-28 z-20 mb-4 bg-card/95 shadow-sm backdrop-blur lg:top-16">
                <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <InputGroup>
                    <InputGroupInput
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setHeroDestination(event.target.value)
                      }}
                      placeholder="Tìm theo tên phòng, mã phòng hoặc địa điểm"
                    />
                    <InputGroupAddon>
                      <MagnifyingGlassIcon />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <Badge variant="secondary">
                        {filteredRentals.length} kết quả
                      </Badge>
                    </InputGroupAddon>
                  </InputGroup>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button
                      type="button"
                      variant="outline"
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
                          <SelectItem value="newest">Mới cập nhật</SelectItem>
                          <SelectItem value="priceasc">
                            Giá thấp đến cao
                          </SelectItem>
                          <SelectItem value="pricedesc">
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

              {filteredRentals.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {visibleRentals.map((rental) => (
                      <RentalCard
                        key={rental.id}
                        rental={rental}
                        onQuickView={() => setSelectedRental(rental)}
                      />
                    ))}
                  </div>
                  {remainingRentalCount > 0 ? (
                    <div className="mt-6 flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setVisibleRentalState({
                            count: visibleRentalCount + loadMoreRentalCount,
                            key: filterKey,
                          })
                        }
                      >
                        Xem thêm | Còn {remainingRentalCount} kết quả
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
                      <HouseLineIcon />
                    </EmptyMedia>
                    <EmptyTitle>Chưa tìm thấy phòng phù hợp</EmptyTitle>
                    <EmptyDescription>
                      Thử bỏ bớt điều kiện hoặc tìm theo khu vực lân cận.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent className="max-w-md">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Xóa bộ lọc
                    </Button>
                    <ContactDrawer label="Liên hệ với Roovea">
                      <Button type="button">Nhờ Roovea tìm giúp</Button>
                    </ContactDrawer>
                  </EmptyContent>
                </Empty>
              )}
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-20 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Chưa thấy phòng phù hợp?</CardTitle>
                    <CardDescription>
                      Gửi khu vực, ngân sách và nhu cầu. Roovea sẽ hỗ trợ tìm
                      lựa chọn gần nhất.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <p>Ưu tiên phòng còn trống và thông tin rõ ràng.</p>
                    <p>Hỗ trợ kết nối trực tiếp qua kênh bạn chọn.</p>
                  </CardContent>
                  <CardFooter>
                    <ContactDrawer label="Nhờ Roovea tìm giúp">
                      <Button className="w-full">Nhờ Roovea tìm giúp</Button>
                    </ContactDrawer>
                  </CardFooter>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] w-full max-w-5xl overflow-hidden sm:h-[min(92svh,760px)]"
        >
          <SheetHeader className="border-b">
            <SheetTitle>Bộ lọc phòng trọ</SheetTitle>
            <SheetDescription>
              Chọn khu vực, ngân sách, diện tích và tiện ích cần có.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
            <RentalFilterPanel
              className="h-full max-h-none min-h-0"
              contentViewportClassName="max-h-none min-h-0 flex-1"
              idPrefix="drawer-rental-filter"
              amenities={amenities}
              districts={districts}
              legacyWard={legacyWard}
              legacyWards={legacyWards}
              minArea={minArea}
              minOccupants={minOccupants}
              newWard={newWard}
              newWards={newWards}
              priceRange={priceRange}
              priceRangeBounds={priceRangeBounds}
              selectedDistricts={selectedDistricts}
              selectedTypes={selectedTypes}
              showAllOptions
              showClearFooter={false}
              onAmenitiesChange={setAmenities}
              onClear={clearFilters}
              onLegacyWardChange={setLegacyWard}
              onMinAreaChange={setMinArea}
              onMinOccupantsChange={setMinOccupants}
              onNewWardChange={setNewWard}
              onPriceRangeChange={setPriceRange}
              onDistrictToggle={(value) => {
                setSelectedDistricts((current) =>
                  current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value]
                )
                setLegacyWard("all")
              }}
              onTypeToggle={(value) =>
                setSelectedTypes((current) =>
                  current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value]
                )
              }
            />
          </div>
          <SheetFooter className="border-t bg-popover p-3 sm:p-4">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
            <SheetClose asChild>
              <Button className="w-full">
                Xem {filteredRentals.length} phòng
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <RentalQuickView
        rental={selectedRental}
        onOpenChange={(open) => {
          if (!open) setSelectedRental(null)
        }}
      />
    </>
  )
}

function RentalFilterPanel({
  className,
  contentViewportClassName,
  idPrefix = "rental-filter",
  amenities,
  districts,
  legacyWard,
  legacyWards,
  minArea,
  minOccupants,
  newWard,
  newWards,
  priceRange,
  priceRangeBounds,
  selectedDistricts,
  selectedTypes,
  showAllOptions = false,
  showClearFooter = true,
  onAmenitiesChange,
  onClear,
  onLegacyWardChange,
  onMinAreaChange,
  onMinOccupantsChange,
  onNewWardChange,
  onPriceRangeChange,
  onDistrictToggle,
  onTypeToggle,
  onShowMore,
}: {
  className?: string
  contentViewportClassName?: string
  idPrefix?: string
  amenities: string[]
  districts: string[]
  legacyWard: string
  legacyWards: string[]
  minArea: string
  minOccupants: string
  newWard: string
  newWards: string[]
  priceRange: [number, number]
  priceRangeBounds: [number, number]
  selectedDistricts: string[]
  selectedTypes: string[]
  showAllOptions?: boolean
  showClearFooter?: boolean
  onAmenitiesChange: (value: string[]) => void
  onClear: () => void
  onLegacyWardChange: (value: string) => void
  onMinAreaChange: (value: string) => void
  onMinOccupantsChange: (value: string) => void
  onNewWardChange: (value: string) => void
  onPriceRangeChange: (value: [number, number]) => void
  onDistrictToggle: (value: string) => void
  onTypeToggle: (value: string) => void
  onShowMore?: () => void
}) {
  return (
    <Card
      className={cn(
        "flex max-h-[calc(100svh-6rem)] flex-col overflow-hidden",
        className
      )}
    >
      <CardHeader className="shrink-0">
        <CardTitle>Bộ lọc</CardTitle>
        {onShowMore ? (
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
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
          <RentalFilterOptionGroup
            defaultVisible={5}
            expanded={showAllOptions}
            hideExpandedToggle={showAllOptions}
            id={`${idPrefix}-type`}
            onExpandedChange={onShowMore}
            onToggle={onTypeToggle}
            options={rentalTypeOptions}
            selectedValues={selectedTypes}
            title="Loại hình"
          />
          <RentalFilterOptionGroup
            defaultVisible={3}
            expanded={showAllOptions}
            hideExpandedToggle={showAllOptions}
            id={`${idPrefix}-district`}
            onExpandedChange={onShowMore}
            onToggle={onDistrictToggle}
            options={districts.map((value) => ({ value, label: value }))}
            selectedValues={selectedDistricts}
            title="Quận/huyện cũ"
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
              <FieldLabel htmlFor={`${idPrefix}-occupants`}>
                Số người tối thiểu
              </FieldLabel>
              <Select value={minOccupants} onValueChange={onMinOccupantsChange}>
                <SelectTrigger id={`${idPrefix}-occupants`} className="w-full">
                  <SelectValue placeholder="Số người" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["1", "2", "3", "4", "5", "6"].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} người
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          {showAllOptions ? (
            <>
              <FieldGroup>
                <FilterSelect
                  id={`${idPrefix}-legacy-ward`}
                  label="Phường/xã cũ"
                  value={legacyWard}
                  options={legacyWards.map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={onLegacyWardChange}
                />
                <FilterSelect
                  id={`${idPrefix}-new-ward`}
                  label="Phường/xã hiện nay"
                  value={newWard}
                  options={newWards.map((value) => ({ value, label: value }))}
                  onChange={onNewWardChange}
                />
                <Field>
                  <FieldLabel htmlFor={`${idPrefix}-area`}>
                    Diện tích tối thiểu
                  </FieldLabel>
                  <Input
                    id={`${idPrefix}-area`}
                    type="number"
                    min={0}
                    value={minArea}
                    onChange={(event) => onMinAreaChange(event.target.value)}
                    placeholder="m²"
                  />
                </Field>
              </FieldGroup>
              <FieldSet>
                <FieldLegend>Tiện ích cần có</FieldLegend>
                <FieldDescription>
                  Chọn một hoặc nhiều tiện ích.
                </FieldDescription>
                <FieldGroup className="gap-2 pt-2">
                  {rentalAmenityOptions.map((option) => {
                    const optionId = `${idPrefix}-${option.value}`
                    return (
                      <Field key={option.value} orientation="horizontal">
                        <Checkbox
                          id={optionId}
                          checked={amenities.includes(option.value)}
                          onCheckedChange={(checked) =>
                            onAmenitiesChange(
                              checked === true
                                ? [...amenities, option.value]
                                : amenities.filter(
                                    (item) => item !== option.value
                                  )
                            )
                          }
                        />
                        <FieldLabel htmlFor={optionId} className="font-normal">
                          {option.label}
                        </FieldLabel>
                      </Field>
                    )
                  })}
                </FieldGroup>
              </FieldSet>
            </>
          ) : null}
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

function RentalFilterOptionGroup({
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
  onExpandedChange?: () => void
  onToggle: (value: string) => void
  options: ReadonlyArray<{ label: string; value: string }>
  selectedValues: string[]
  title: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const showAll = expanded || isExpanded
  const visibleOptions = showAll ? options : options.slice(0, defaultVisible)

  function toggleExpanded() {
    if (onExpandedChange) {
      onExpandedChange()
      return
    }
    setIsExpanded((current) => !current)
  }

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
            onClick={toggleExpanded}
          >
            {showAll ? "Thu gọn" : "Xem thêm"}
            {showAll ? (
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

function RentalCard({
  rental,
  onQuickView,
}: {
  rental: PublicRentalListing
  onQuickView: () => void
}) {
  const thumbnail = getRentalThumbnail(rental)
  const [copiedCode, setCopiedCode] = useState(false)
  const detailHref = `/phongtro/${rental.code.toLowerCase()}`

  async function copyRentalCode() {
    try {
      await writeClipboardText(rental.code)
      setCopiedCode(true)
      toast.success(`Đã sao chép mã phòng #${rental.code}`)
      window.setTimeout(() => setCopiedCode(false), 1600)
    } catch {
      toast.info("Bạn có thể chọn và sao chép mã phòng thủ công.")
    }
  }

  return (
    <Card size="sm" className="pt-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={detailHref} aria-label={`Xem ${rental.name}`}>
          {thumbnail ? (
            <Image
              src={thumbnail.url}
              alt={thumbnail.caption || rental.name}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.03]"
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <BuildingsIcon aria-hidden />
            </div>
          )}
        </Link>
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge>
            {getRentalTypeLabel(rental.rentalType, rental.otherRentalType)}
          </Badge>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)]"
          aria-label={`Sao chép mã phòng #${rental.code}`}
          title="Sao chép mã phòng"
          onClick={copyRentalCode}
        >
          <span className="truncate">#{rental.code}</span>
          {copiedCode ? (
            <CheckIcon data-icon="inline-end" />
          ) : (
            <CopyIcon data-icon="inline-end" />
          )}
        </Button>
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">
          <Link href={detailHref}>{rental.name}</Link>
        </CardTitle>
        <CardDescription>
          {rental.legacyWard}, {rental.legacyDistrict}
        </CardDescription>
        {rental.ownerVerified ? (
          <CardAction>
            <Badge variant="outline" className="text-primary">
              <CheckCircleIcon data-icon="inline-start" weight="fill" />
              Đã xác minh
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="line-clamp-1 text-xs text-muted-foreground">
          Hiện nay: {rental.newWard}, TP.HCM
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <HouseLineIcon aria-hidden className="size-4 text-primary" />{" "}
            {rental.areaM2} m²
          </span>
          <span className="inline-flex items-center gap-1">
            <UsersThreeIcon aria-hidden className="size-4 text-primary" /> Tối
            đa {rental.maxOccupants} người
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Giá thuê</span>
          <span className="text-base font-semibold">
            {formatCurrency(rental.monthlyPrice)}/tháng
          </span>
        </div>
        <div className="flex flex-wrap gap-2 max-sm:w-full">
          <Button
            type="button"
            variant="outline"
            className="max-sm:h-10 max-sm:flex-1"
            onClick={onQuickView}
          >
            Xem nhanh
          </Button>
          <Button asChild className="max-sm:h-10 max-sm:flex-1">
            <Link href={detailHref}>
              Chi tiết
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function RentalQuickView({
  rental,
  onOpenChange,
}: {
  rental: PublicRentalListing | null
  onOpenChange: (open: boolean) => void
}) {
  const thumbnail = rental ? getRentalThumbnail(rental) : null
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const activeImage =
    rental?.media.images.find((image) => image.url === activeImageUrl) ??
    thumbnail
  const detailHref = rental
    ? `/phongtro/${rental.code.toLowerCase()}`
    : "/timphongtro"

  return (
    <Sheet open={Boolean(rental)} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto h-[calc(100svh-1rem)] max-h-[calc(100svh-1rem)] w-full max-w-5xl overflow-hidden sm:h-[min(92svh,760px)] lg:!h-[760px] lg:!max-h-[calc(100svh-2rem)]"
      >
        {rental ? (
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
              <SheetTitle>{rental.name}</SheetTitle>
              <SheetDescription>
                Mã phòng {rental.code} · {rental.legacyWard},{" "}
                {rental.legacyDistrict}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1 overflow-hidden">
              <div className="grid gap-5 px-4 pb-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="relative aspect-[4/3] min-h-64 overflow-hidden bg-muted">
                    {activeImage ? (
                      <Image
                        src={activeImage.url}
                        alt={activeImage.caption || rental.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <BuildingsIcon aria-hidden />
                      </div>
                    )}
                  </div>
                  {rental.media.images.length > 1 ? (
                    <div className="max-w-full overflow-x-auto overflow-y-hidden pb-1">
                      <div className="flex min-w-full gap-1">
                        {rental.media.images.map((image) => (
                          <button
                            key={image.id || image.url}
                            type="button"
                            aria-label={`Xem ảnh ${image.caption || rental.name}`}
                            className={cn(
                              "relative h-20 w-28 shrink-0 overflow-hidden bg-muted ring-1 ring-border",
                              activeImage?.url === image.url && "ring-primary"
                            )}
                            onClick={() => setActiveImageUrl(image.url)}
                          >
                            <Image
                              src={image.url}
                              alt={image.caption || rental.name}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {getRentalTypeLabel(
                        rental.rentalType,
                        rental.otherRentalType
                      )}
                    </Badge>
                    {rental.ownerVerified ? (
                      <Badge variant="outline">
                        <CheckCircleIcon
                          data-icon="inline-start"
                          weight="fill"
                        />
                        Chủ nhà đã xác minh
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xl font-semibold">
                    {formatCurrency(rental.monthlyPrice)}/tháng
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {rental.description ||
                      "Thông tin mô tả đang được cập nhật."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 border bg-muted/30 p-3">
                      <HouseLineIcon aria-hidden /> {rental.areaM2} m²
                    </div>
                    <div className="flex items-center gap-2 border bg-muted/30 p-3">
                      <UsersThreeIcon aria-hidden /> Tối đa{" "}
                      {rental.maxOccupants} người
                    </div>
                  </div>
                  {rental.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {rental.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline">
                          {getRentalAmenityLabel(amenity)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    <CopyableAddress
                      address={`${rental.addressDetail}, ${rental.legacyWard}, ${rental.legacyDistrict}, TP.HCM`}
                    />
                    {rental.googleMapsUrl ? (
                      <Button asChild variant="outline" className="w-fit">
                        <a
                          href={rental.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPinIcon data-icon="inline-start" />
                          Mở Google Maps
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="sm:flex-row sm:justify-end">
              <ContactActions roomCode={rental.code} />
              <Button asChild>
                <Link href={detailHref}>
                  Xem trang chi tiết
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

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tất cả</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

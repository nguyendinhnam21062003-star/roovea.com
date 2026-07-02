"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  BedIcon,
  CalendarBlankIcon,
  HouseLineIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SlidersHorizontalIcon,
  StarIcon,
  TagIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react"

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
import {
  Drawer,
  DrawerClose,
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
import { formatCurrency, formatDate } from "@/lib/format"
import { getPrimaryRoomMedia } from "@/lib/media"
import { type PublicRoom } from "@/lib/rooms"

type RoomExplorerProps = {
  rooms: PublicRoom[]
}

type BudgetFilter = "all" | "under-1500000" | "1500000-3000000" | "over-3000000"

const budgetLabels: Record<BudgetFilter, string> = {
  all: "Mọi mức giá",
  "under-1500000": "Dưới 1.5 triệu",
  "1500000-3000000": "1.5 - 3 triệu",
  "over-3000000": "Trên 3 triệu",
}

function matchesBudget(room: PublicRoom, budget: BudgetFilter) {
  if (budget === "under-1500000") {
    return room.referencePrice < 1500000
  }

  if (budget === "1500000-3000000") {
    return room.referencePrice >= 1500000 && room.referencePrice <= 3000000
  }

  if (budget === "over-3000000") {
    return room.referencePrice > 3000000
  }

  return true
}

export function RoomExplorer({ rooms }: RoomExplorerProps) {
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("all")
  const [budget, setBudget] = useState<BudgetFilter>("all")
  const [selectedRoom, setSelectedRoom] = useState<PublicRoom | null>(null)

  const featuredRooms = useMemo(
    () => rooms.filter((room) => room.featured).slice(0, 3),
    [rooms]
  )

  const locations = useMemo(
    () => Array.from(new Set(rooms.map((room) => room.locationLevel1))),
    [rooms]
  )

  const filteredRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rooms.filter((room) => {
      const searchable = [
        room.code,
        room.name,
        room.locationLevel1,
        room.locationLevel2,
        room.address,
      ]
        .join(" ")
        .toLowerCase()

      const queryMatched =
        normalizedQuery.length === 0 || searchable.includes(normalizedQuery)
      const locationMatched =
        location === "all" || room.locationLevel1 === location

      return queryMatched && locationMatched && matchesBudget(room, budget)
    })
  }, [budget, location, query, rooms])

  function resetFilters() {
    setQuery("")
    setLocation("all")
    setBudget("all")
  }

  return (
    <>
      <section className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <Badge variant="secondary" className="w-fit">
                Phòng nổi bật
              </Badge>
              <h2 className="font-heading text-2xl font-semibold md:text-3xl">
                Lựa chọn đang được Roovea ưu tiên tư vấn
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="#tim-phong">
                Xem thêm
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredRooms.map((room) => (
              <RoomCard
                key={room.slug}
                room={room}
                onQuickView={() => setSelectedRoom(room)}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="tim-phong"
        className="border-t bg-muted/30 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              Tìm phòng
            </Badge>
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">
              Danh sách phòng phù hợp cho chuyến đi tiếp theo
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bộ lọc phòng</CardTitle>
              <CardDescription>
                Tìm theo tên, mã phòng 5 chữ số, tỉnh thành hoặc khu vực.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] md:items-end">
                <Field>
                  <FieldLabel htmlFor="room-search">Thanh tìm kiếm</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="room-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="VD: 48219, Đà Nẵng, villa..."
                    />
                    <InputGroupAddon>
                      <MagnifyingGlassIcon />
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="location-filter">
                    Tỉnh/thành phố
                  </FieldLabel>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger id="location-filter" className="w-full">
                      <SelectValue placeholder="Tất cả vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Tất cả vị trí</SelectItem>
                        {locations.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="budget-filter">Mức giá</FieldLabel>
                  <Select
                    value={budget}
                    onValueChange={(value) => setBudget(value as BudgetFilter)}
                  >
                    <SelectTrigger id="budget-filter" className="w-full">
                      <SelectValue placeholder="Mọi mức giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(budgetLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  <XIcon data-icon="inline-start" />
                  Xóa lọc
                </Button>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <SlidersHorizontalIcon className="size-4" />
                {filteredRooms.length} phòng phù hợp
              </div>
              <Badge variant="outline">{budgetLabels[budget]}</Badge>
            </CardFooter>
          </Card>

          {filteredRooms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.slug}
                  room={room}
                  onQuickView={() => setSelectedRoom(room)}
                />
              ))}
            </div>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MagnifyingGlassIcon />
                </EmptyMedia>
                <EmptyTitle>Chưa có phòng phù hợp</EmptyTitle>
                <EmptyDescription>
                  Hãy thử bỏ bớt bộ lọc hoặc liên hệ Roovea để được tư vấn trực
                  tiếp.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </section>

      <Drawer
        open={Boolean(selectedRoom)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRoom(null)
          }
        }}
      >
        <DrawerContent className="mx-auto w-full max-w-5xl">
          {selectedRoom ? (
            <>
              <DrawerHeader>
                <DrawerTitle>{selectedRoom.name}</DrawerTitle>
                <DrawerDescription>
                  Mã phòng {selectedRoom.code} · {selectedRoom.locationLevel2},{" "}
                  {selectedRoom.locationLevel1}
                </DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-5 overflow-y-auto px-4 pb-2 md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative aspect-[4/3] min-h-64 overflow-hidden bg-muted">
                  <Image
                    src={getPrimaryRoomMedia(selectedRoom.media).src}
                    alt={getPrimaryRoomMedia(selectedRoom.media).alt}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.highlights.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold">
                        {formatCurrency(selectedRoom.referencePrice)}
                      </p>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(selectedRoom.strikePrice)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cập nhật {formatDate(selectedRoom.updatedAt)}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {selectedRoom.description}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <RoomFact
                      icon={BedIcon}
                      label={`${selectedRoom.bedrooms} PN`}
                    />
                    <RoomFact
                      icon={UsersThreeIcon}
                      label={`${selectedRoom.guests} khách`}
                    />
                    <RoomFact icon={HouseLineIcon} label={selectedRoom.area} />
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {selectedRoom.address}, {selectedRoom.locationLevel1}
                    </span>
                  </div>
                </div>
              </div>
              <DrawerFooter className="sm:flex-row sm:justify-end">
                <DrawerClose asChild>
                  <Button variant="outline">Đóng</Button>
                </DrawerClose>
                <Button asChild variant="outline">
                  <a
                    href={selectedRoom.googleMapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPinIcon data-icon="inline-start" />
                    Mở Google Map
                  </a>
                </Button>
                <Button asChild>
                  <Link href={`/phong/${selectedRoom.slug}`}>
                    Xem link chi tiết
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  )
}

function RoomCard({
  room,
  onQuickView,
}: {
  room: PublicRoom
  onQuickView: () => void
}) {
  const image = getPrimaryRoomMedia(room.media)

  return (
    <Card size="sm" className="pt-0">
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
      </div>
      <CardHeader>
        <CardTitle>{room.name}</CardTitle>
        <CardDescription>
          {room.locationLevel2}, {room.locationLevel1}
        </CardDescription>
        <CardAction>
          <Badge variant="outline">#{room.code}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {room.highlights.slice(0, 3).map((item) => (
            <Badge key={item} variant="secondary">
              <StarIcon data-icon="inline-start" />
              {item}
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <RoomFact icon={BedIcon} label={`${room.bedrooms} PN`} />
          <RoomFact icon={UsersThreeIcon} label={`${room.guests} khách`} />
          <RoomFact icon={HouseLineIcon} label={room.area} />
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">
              {formatCurrency(room.referencePrice)}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(room.strikePrice)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarBlankIcon className="size-4" />
            {formatDate(room.updatedAt)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2">
        <Button type="button" variant="outline" onClick={onQuickView}>
          <TagIcon data-icon="inline-start" />
          Xem nhanh
        </Button>
        <Button asChild>
          <Link href={`/phong/${room.slug}`}>
            Chi tiết
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function RoomFact({
  icon: Icon,
  label,
}: {
  icon: typeof BedIcon
  label: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 bg-muted px-2 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  )
}

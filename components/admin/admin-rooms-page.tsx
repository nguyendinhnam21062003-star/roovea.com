"use client"

/* eslint-disable @next/next/no-img-element */

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  CopyIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  ImageSquareIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SquaresFourIcon,
  TableIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatCurrency, formatDate } from "@/lib/format"
import { getRoomCompletion, getRoomThumbnail } from "@/lib/admin/helpers"
import {
  accommodationTypeLabels,
  accommodationTypeOptions,
  priceUnitLabels,
  roomStatusLabels,
  roomStatusOptions,
  supplierStatusOptions,
} from "@/lib/admin/options"
import { useAdminStore } from "@/lib/admin/store"
import type {
  AccommodationType,
  Room,
  RoomStatus,
  SupplierStatus,
} from "@/lib/admin/types"

type ViewMode = "grid" | "list"

type RoomFilters = {
  status: "all" | RoomStatus
  province: string
  accommodationType: "all" | AccommodationType
  priceRange: "all" | "under_1000000" | "1000000_3000000" | "over_3000000"
  mediaStatus:
    "all" | "enough_images" | "missing_images" | "has_video" | "missing_video"
  supplierStatus: "all" | SupplierStatus | "missing"
  featured: "all" | "featured" | "not_featured"
}

const emptyFilters: RoomFilters = {
  status: "all",
  province: "all",
  accommodationType: "all",
  priceRange: "all",
  mediaStatus: "all",
  supplierStatus: "all",
  featured: "all",
}

const priceRangeLabels: Record<RoomFilters["priceRange"], string> = {
  all: "Tất cả",
  under_1000000: "Dưới 1 triệu",
  "1000000_3000000": "1 - 3 triệu",
  over_3000000: "Trên 3 triệu",
}

const mediaStatusLabels: Record<RoomFilters["mediaStatus"], string> = {
  all: "Tất cả media",
  enough_images: "Đủ ảnh",
  missing_images: "Thiếu ảnh",
  has_video: "Có video",
  missing_video: "Chưa có video",
}

export function AdminRoomsPage() {
  const { rooms, suppliers, deleteRoom, duplicateRoom, setRoomStatus } =
    useAdminStore()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<RoomFilters>(emptyFilters)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null)

  const suppliersById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers]
  )
  const provinces = useMemo(
    () =>
      Array.from(
        new Set(rooms.map((room) => room.location.provinceCity).filter(Boolean))
      ),
    [rooms]
  )

  const filteredRooms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rooms.filter((room) => {
      const supplier = room.supplierId
        ? suppliersById.get(room.supplierId)
        : undefined
      const searchable = [
        room.roomCode,
        room.name,
        supplier?.supplierCode,
        supplier?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const queryMatched =
        !normalizedQuery || searchable.includes(normalizedQuery)
      const statusMatched =
        filters.status === "all" || room.status === filters.status
      const provinceMatched =
        filters.province === "all" ||
        room.location.provinceCity === filters.province
      const typeMatched =
        filters.accommodationType === "all" ||
        room.accommodationTypes.includes(filters.accommodationType)
      const priceMatched = matchesPriceRange(room, filters.priceRange)
      const mediaMatched = matchesMediaStatus(room, filters.mediaStatus)
      const supplierMatched =
        filters.supplierStatus === "all" ||
        (filters.supplierStatus === "missing"
          ? !supplier
          : supplier?.status === filters.supplierStatus)
      const featuredMatched =
        filters.featured === "all" ||
        (filters.featured === "featured" ? room.isFeatured : !room.isFeatured)

      return (
        queryMatched &&
        statusMatched &&
        provinceMatched &&
        typeMatched &&
        priceMatched &&
        mediaMatched &&
        supplierMatched &&
        featuredMatched
      )
    })
  }, [filters, query, rooms, suppliersById])

  const activeFilterCount =
    Object.values(filters).filter((value) => value !== "all").length +
    (query.trim() ? 1 : 0)

  function updateFilters(patch: Partial<RoomFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function clearFilters() {
    setQuery("")
    setFilters(emptyFilters)
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return
    }

    await deleteRoom(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold">Quản lý phòng</h1>
          <p className="text-sm text-muted-foreground">
            {filteredRooms.length} phòng theo dữ liệu đang lọc trên tổng{" "}
            {rooms.length} phòng trong database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/rooms/new">Nhập phòng bằng JSON</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/rooms/new">
              <PlusIcon data-icon="inline-start" />
              Thêm phòng mới
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
          <CardDescription>
            Search và filter cập nhật ngay trên dữ liệu đã tải từ database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_150px_150px_170px_160px_170px_170px_150px_auto] xl:items-end">
            <Field>
              <FieldLabel htmlFor="room-search">Tìm kiếm</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="room-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên phòng, mã phòng, tên/mã nhà cung cấp"
                />
                <InputGroupAddon>
                  <MagnifyingGlassIcon />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <FilterSelect
              id="room-status-filter"
              label="Trạng thái"
              value={filters.status}
              options={[
                { value: "all", label: "Tất cả" },
                ...roomStatusOptions,
              ]}
              onChange={(value) =>
                updateFilters({ status: value as RoomFilters["status"] })
              }
            />
            <FilterSelect
              id="room-province-filter"
              label="Tỉnh/TP"
              value={filters.province}
              options={[
                { value: "all", label: "Tất cả" },
                ...provinces.map((province) => ({
                  value: province,
                  label: province,
                })),
              ]}
              onChange={(value) => updateFilters({ province: value })}
            />
            <FilterSelect
              id="room-type-filter"
              label="Loại hình"
              value={filters.accommodationType}
              options={[
                { value: "all", label: "Tất cả" },
                ...accommodationTypeOptions,
              ]}
              onChange={(value) =>
                updateFilters({
                  accommodationType: value as RoomFilters["accommodationType"],
                })
              }
            />
            <FilterSelect
              id="room-price-filter"
              label="Khoảng giá"
              value={filters.priceRange}
              options={Object.entries(priceRangeLabels).map(
                ([value, label]) => ({
                  value,
                  label,
                })
              )}
              onChange={(value) =>
                updateFilters({
                  priceRange: value as RoomFilters["priceRange"],
                })
              }
            />
            <FilterSelect
              id="room-media-filter"
              label="Media"
              value={filters.mediaStatus}
              options={Object.entries(mediaStatusLabels).map(
                ([value, label]) => ({
                  value,
                  label,
                })
              )}
              onChange={(value) =>
                updateFilters({
                  mediaStatus: value as RoomFilters["mediaStatus"],
                })
              }
            />
            <FilterSelect
              id="room-supplier-filter"
              label="Nhà cung cấp"
              value={filters.supplierStatus}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "missing", label: "Chưa liên kết" },
                ...supplierStatusOptions,
              ]}
              onChange={(value) =>
                updateFilters({
                  supplierStatus: value as RoomFilters["supplierStatus"],
                })
              }
            />
            <FilterSelect
              id="room-featured-filter"
              label="Nổi bật"
              value={filters.featured}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "featured", label: "Có" },
                { value: "not_featured", label: "Không" },
              ]}
              onChange={(value) =>
                updateFilters({ featured: value as RoomFilters["featured"] })
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                ) : null}
              </Button>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => {
                  if (value) {
                    setViewMode(value as ViewMode)
                  }
                }}
                variant="outline"
                spacing={0}
              >
                <ToggleGroupItem value="grid" aria-label="Chế độ grid">
                  <SquaresFourIcon />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Chế độ list">
                  <TableIcon />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {filteredRooms.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon />
            </EmptyMedia>
            <EmptyTitle>Không tìm thấy phòng</EmptyTitle>
            <EmptyDescription>
              Thử đổi từ khóa hoặc xóa bớt bộ lọc đang áp dụng.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </EmptyContent>
        </Empty>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              supplier={
                room.supplierId ? suppliersById.get(room.supplierId) : undefined
              }
              onDelete={() => setDeleteTarget(room)}
              onDuplicate={() => void duplicateRoom(room.id)}
              onPreview={() => setPreviewRoom(room)}
              onToggleStatus={() =>
                void setRoomStatus(
                  room.id,
                  room.status === "published" ? "hidden" : "published"
                )
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Mã phòng</TableHead>
                  <TableHead>Tên phòng</TableHead>
                  <TableHead>Loại hình</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Giá tham khảo</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => {
                  const supplier = room.supplierId
                    ? suppliersById.get(room.supplierId)
                    : undefined

                  return (
                    <RoomTableRow
                      key={room.id}
                      room={room}
                      supplier={supplier}
                      onDelete={() => setDeleteTarget(room)}
                      onDuplicate={() => void duplicateRoom(room.id)}
                      onPreview={() => setPreviewRoom(room)}
                      onToggleStatus={() =>
                        void setRoomStatus(
                          room.id,
                          room.status === "published" ? "hidden" : "published"
                        )
                      }
                    />
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ ẩn record khỏi danh sách và lưu vào database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmDelete()}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(previewRoom)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewRoom(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {previewRoom ? <RoomPreviewDialog room={previewRoom} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RoomCard({
  room,
  supplier,
  onDelete,
  onDuplicate,
  onPreview,
  onToggleStatus,
}: {
  room: Room
  supplier?: { supplierCode: string; fullName: string; status: SupplierStatus }
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
  onToggleStatus: () => void
}) {
  const thumbnail = getRoomThumbnail(room)
  const completion = getRoomCompletion(room)

  return (
    <Card size="sm" className="pt-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail.url}
            alt={thumbnail.caption || room.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageSquareIcon aria-hidden />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge>{roomStatusLabels[room.status]}</Badge>
          {room.isFeatured ? <Badge variant="secondary">Nổi bật</Badge> : null}
        </div>
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">{room.name}</CardTitle>
        <CardDescription>
          {room.roomCode} · {room.location.districtCity},{" "}
          {room.location.provinceCity}
        </CardDescription>
        <CardAction>
          <RoomActions
            room={room}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPreview={onPreview}
            onToggleStatus={onToggleStatus}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {room.accommodationTypes.slice(0, 2).map((type) => (
            <Badge key={type} variant="outline">
              {accommodationTypeLabels[type]}
            </Badge>
          ))}
          <Badge variant="outline">{room.capacity.maxGuests} khách</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Giá tham khảo</span>
          <strong>
            {formatCurrency(room.pricing.referencePrice)} /{" "}
            {priceUnitLabels[room.pricing.priceUnit]}
          </strong>
        </div>
        <div className="text-sm text-muted-foreground">
          {supplier
            ? `${supplier.supplierCode} · ${supplier.fullName}`
            : "Chưa liên kết nhà cung cấp"}
        </div>
        <div className="flex flex-wrap gap-2">
          {room.media.images.length === 0 ? (
            <Badge variant="destructive">
              <WarningCircleIcon data-icon="inline-start" />
              Thiếu ảnh
            </Badge>
          ) : null}
          {room.media.videoUrls.length === 0 ? (
            <Badge variant="outline">Chưa có video</Badge>
          ) : null}
          {completion.missing.length > 0 ? (
            <Badge variant="outline">{completion.percent}% hoàn thiện</Badge>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Cập nhật {formatDate(room.updatedAt)}
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/rooms/${room.id}/edit`}>Chỉnh sửa</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function RoomTableRow({
  room,
  supplier,
  onDelete,
  onDuplicate,
  onPreview,
  onToggleStatus,
}: {
  room: Room
  supplier?: { supplierCode: string; fullName: string; status: SupplierStatus }
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
  onToggleStatus: () => void
}) {
  const thumbnail = getRoomThumbnail(room)

  return (
    <TableRow>
      <TableCell>
        <div className="size-14 overflow-hidden bg-muted">
          {thumbnail ? (
            <img
              src={thumbnail.url}
              alt={thumbnail.caption || room.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageSquareIcon aria-hidden />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">{room.roomCode}</TableCell>
      <TableCell>
        <div className="flex min-w-56 flex-col gap-1">
          <span className="font-medium">{room.name}</span>
          {room.isFeatured ? (
            <Badge variant="secondary" className="w-fit">
              Nổi bật
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {room.accommodationTypes
          .map((type) => accommodationTypeLabels[type])
          .join(", ")}
      </TableCell>
      <TableCell>
        {[room.location.districtCity, room.location.provinceCity]
          .filter(Boolean)
          .join(", ")}
      </TableCell>
      <TableCell>{formatCurrency(room.pricing.referencePrice)}</TableCell>
      <TableCell>
        {supplier
          ? `${supplier.supplierCode} · ${supplier.fullName}`
          : "Chưa có"}
      </TableCell>
      <TableCell>
        <Badge variant={room.status === "published" ? "default" : "secondary"}>
          {roomStatusLabels[room.status]}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(room.updatedAt)}</TableCell>
      <TableCell>
        <div className="flex justify-end">
          <RoomActions
            room={room}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPreview={onPreview}
            onToggleStatus={onToggleStatus}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}

function RoomActions({
  room,
  onDelete,
  onDuplicate,
  onPreview,
  onToggleStatus,
}: {
  room: Room
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
  onToggleStatus: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Thao tác ${room.name}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onPreview}>
            <EyeIcon data-icon="inline-start" />
            Xem trước
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/rooms/${room.id}/edit`}>Chỉnh sửa</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <CopyIcon data-icon="inline-start" />
            Nhân bản
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleStatus}>
            {room.status === "published" ? "Tạm ẩn" : "Đăng lại"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Xóa
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RoomPreviewDialog({ room }: { room: Room }) {
  const thumbnail = getRoomThumbnail(room)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Preview phòng</DialogTitle>
        <DialogDescription>
          Dữ liệu preview không hiển thị thông tin nội bộ nhà cung cấp.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {thumbnail ? (
            <img
              src={thumbnail.url}
              alt={thumbnail.caption || room.name}
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
            <Badge>{room.roomCode}</Badge>
            <Badge variant="secondary">{roomStatusLabels[room.status]}</Badge>
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">{room.name}</h2>
            <p className="text-sm text-muted-foreground">
              {[room.location.districtCity, room.location.provinceCity]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {room.description || "Chưa có mô tả hiển thị."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{room.capacity.maxGuests} khách</Badge>
            {room.accommodationTypes.map((type) => (
              <Badge key={type} variant="outline">
                {accommodationTypeLabels[type]}
              </Badge>
            ))}
          </div>
          <strong>{formatCurrency(room.pricing.referencePrice)}</strong>
        </div>
      </div>
      <DialogFooter>
        <Button asChild>
          <Link href={`/admin/rooms/${room.id}/edit`}>Mở trang chỉnh sửa</Link>
        </Button>
      </DialogFooter>
    </>
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

function matchesPriceRange(room: Room, range: RoomFilters["priceRange"]) {
  if (range === "under_1000000") {
    return room.pricing.referencePrice < 1000000
  }

  if (range === "1000000_3000000") {
    return (
      room.pricing.referencePrice >= 1000000 &&
      room.pricing.referencePrice <= 3000000
    )
  }

  if (range === "over_3000000") {
    return room.pricing.referencePrice > 3000000
  }

  return true
}

function matchesMediaStatus(room: Room, status: RoomFilters["mediaStatus"]) {
  if (status === "enough_images") {
    return room.media.images.length > 0
  }

  if (status === "missing_images") {
    return room.media.images.length === 0
  }

  if (status === "has_video") {
    return Boolean(room.media.videoUrls.length)
  }

  if (status === "missing_video") {
    return !room.media.videoUrls.length
  }

  return true
}

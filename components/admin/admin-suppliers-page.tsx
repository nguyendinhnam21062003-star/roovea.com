"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  DotsThreeVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { formatDate } from "@/lib/format"
import { maskCitizenId } from "@/lib/admin/helpers"
import {
  accommodationTypeLabels,
  genderOptions,
  serviceTypeLabels,
  serviceTypeOptions,
  supplierStatusLabels,
  supplierStatusOptions,
} from "@/lib/admin/options"
import { useAdminStore } from "@/lib/admin/store"
import type { Supplier, SupplierStatus } from "@/lib/admin/types"

type SupplierFilters = {
  status: "all" | SupplierStatus
  serviceType: "all" | string
  location: string
  gender: "all" | string
}

const emptyFilters: SupplierFilters = {
  status: "all",
  serviceType: "all",
  location: "all",
  gender: "all",
}

export function AdminSuppliersPage() {
  const { suppliers, rooms, deleteSupplier, setSupplierStatus } =
    useAdminStore()
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SupplierFilters>(emptyFilters)
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState("")

  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          suppliers.flatMap((supplier) =>
            supplier.serviceAreas
              .map((area) => area.provinceCity || area.country)
              .filter(Boolean)
          )
        )
      ),
    [suppliers]
  )

  const linkedRoomCountBySupplier = useMemo(() => {
    const counts = new Map<string, number>()

    for (const room of rooms) {
      if (room.supplierId) {
        counts.set(room.supplierId, (counts.get(room.supplierId) ?? 0) + 1)
      }
    }

    return counts
  }, [rooms])

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return suppliers.filter((supplier) => {
      const searchable = [
        supplier.supplierCode,
        supplier.fullName,
        supplier.phone,
        supplier.email,
        supplier.serviceAreas
          .map(
            (area) =>
              `${area.country} ${area.provinceCity} ${area.districtCity}`
          )
          .join(" "),
        supplier.serviceTypes.map((type) => serviceTypeLabels[type]).join(" "),
      ]
        .join(" ")
        .toLowerCase()

      const queryMatched =
        !normalizedQuery || searchable.includes(normalizedQuery)
      const statusMatched =
        filters.status === "all" || supplier.status === filters.status
      const serviceMatched =
        filters.serviceType === "all" ||
        supplier.serviceTypes.includes(filters.serviceType as never)
      const locationMatched =
        filters.location === "all" ||
        supplier.serviceAreas.some(
          (area) =>
            area.provinceCity === filters.location ||
            area.country === filters.location
        )
      const genderMatched =
        filters.gender === "all" || supplier.gender === filters.gender

      return (
        queryMatched &&
        statusMatched &&
        serviceMatched &&
        locationMatched &&
        genderMatched
      )
    })
  }, [filters, query, suppliers])

  const activeFilterCount =
    Object.values(filters).filter((value) => value !== "all").length +
    (query.trim() ? 1 : 0)

  function updateFilters(patch: Partial<SupplierFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function clearFilters() {
    setQuery("")
    setFilters(emptyFilters)
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) {
      return
    }

    setDeleting(true)

    try {
      const result = await deleteSupplier(deleteTarget.id)
      setDeleteTarget(null)

      if (!result.ok) {
        const message = result.reason ?? "Không thể xóa nhà cung cấp."
        setNotice(message)
        toast.warning(message)
        return
      }

      const message = "Đã xóa nhà cung cấp khỏi database."
      setNotice(message)
      toast.success(message)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Backend chưa phản hồi, vui lòng thử lại."

      setNotice(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold">
            Nhà cung cấp/Đối tác
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredSuppliers.length} nhà cung cấp theo dữ liệu đang lọc.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/suppliers/new">
            <PlusIcon data-icon="inline-start" />
            Thêm nhà cung cấp
          </Link>
        </Button>
      </div>

      {notice ? (
        <Alert>
          <AlertTitle>Thông báo</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_190px_180px_170px_auto] lg:items-end">
            <Field>
              <FieldLabel htmlFor="supplier-search">Tìm kiếm</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="supplier-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Mã, họ tên, điện thoại, email, phạm vi"
                />
                <InputGroupAddon>
                  <MagnifyingGlassIcon />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-status-filter">
                Trạng thái
              </FieldLabel>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  updateFilters({ status: value as SupplierFilters["status"] })
                }
              >
                <SelectTrigger id="supplier-status-filter" className="w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {supplierStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-service-filter">
                Loại dịch vụ
              </FieldLabel>
              <Select
                value={filters.serviceType}
                onValueChange={(value) => updateFilters({ serviceType: value })}
              >
                <SelectTrigger id="supplier-service-filter" className="w-full">
                  <SelectValue placeholder="Tất cả dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả dịch vụ</SelectItem>
                    {serviceTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-location-filter">
                Khu vực
              </FieldLabel>
              <Select
                value={filters.location}
                onValueChange={(value) => updateFilters({ location: value })}
              >
                <SelectTrigger id="supplier-location-filter" className="w-full">
                  <SelectValue placeholder="Tất cả khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả khu vực</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="supplier-gender-filter">
                Giới tính
              </FieldLabel>
              <Select
                value={filters.gender}
                onValueChange={(value) => updateFilters({ gender: value })}
              >
                <SelectTrigger id="supplier-gender-filter" className="w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
              {activeFilterCount > 0 ? (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              ) : null}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {filteredSuppliers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>CCCD</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Dịch vụ chính</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => {
                  const linkedCount =
                    linkedRoomCountBySupplier.get(supplier.id) ?? 0

                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.supplierCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-44 flex-col gap-1">
                          <span className="font-medium">
                            {supplier.fullName}
                          </span>
                          <span className="text-muted-foreground">
                            {supplier.email || "Chưa khai báo email"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.citizenIdMasked ||
                          maskCitizenId(supplier.citizenId)}
                      </TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>
                        <div className="flex min-w-40 flex-col gap-1">
                          {supplier.serviceAreas.slice(0, 2).map((area) => (
                            <span key={area.id}>
                              {[
                                area.districtCity,
                                area.provinceCity || area.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-52 flex-wrap gap-1">
                          {supplier.serviceTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="secondary">
                              {serviceTypeLabels[type]}
                            </Badge>
                          ))}
                          {supplier.accommodationTypes
                            .slice(0, 2)
                            .map((type) => (
                              <Badge key={type} variant="outline">
                                {accommodationTypeLabels[type]}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            supplier.status === "active"
                              ? "default"
                              : supplier.status === "paused"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {supplierStatusLabels[supplier.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(supplier.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Thao tác ${supplier.fullName}`}
                              >
                                <DotsThreeVerticalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>
                                {linkedCount} phòng liên kết
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/suppliers/${supplier.id}/edit`}
                                  >
                                    Xem/chỉnh sửa
                                  </Link>
                                </DropdownMenuItem>
                                {supplier.status === "active" ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void setSupplierStatus(
                                        supplier.id,
                                        "paused"
                                      )
                                    }
                                  >
                                    Tạm ngưng hợp tác
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void setSupplierStatus(
                                        supplier.id,
                                        "active"
                                      )
                                    }
                                  >
                                    Kích hoạt lại
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    if (linkedCount > 0) {
                                      const message = `Không thể xóa ${supplier.supplierCode} vì còn ${linkedCount} phòng đang liên kết.`

                                      setNotice(message)
                                      toast.warning(message)
                                      return
                                    }

                                    setDeleteTarget(supplier)
                                  }}
                                >
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon />
            </EmptyMedia>
            <EmptyTitle>Không tìm thấy nhà cung cấp</EmptyTitle>
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
            <AlertDialogTitle>Xóa nhà cung cấp?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ ẩn record khỏi danh sách và lưu vào database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

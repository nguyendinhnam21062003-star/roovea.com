"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  rentalAvailabilityStatusLabels,
  rentalPublicationStatusLabels,
} from "@/lib/rentals/options"
import type {
  AdminRentalListing,
  RentalOwnerProfile,
} from "@/lib/rentals/types"

type AdminRentalsPageProps = {
  initialRentals: AdminRentalListing[]
  initialOwners: RentalOwnerProfile[]
}

export function AdminRentalsPage({
  initialRentals,
  initialOwners,
}: AdminRentalsPageProps) {
  const [rentals, setRentals] = useState(initialRentals)
  const [owners, setOwners] = useState(initialOwners)
  const [query, setQuery] = useState("")
  const [deleteTarget, setDeleteTarget] =
    useState<AdminRentalListing | null>(null)
  const [busyId, setBusyId] = useState("")
  const normalizedQuery = query.trim().toLocaleLowerCase("vi")
  const filteredRentals = useMemo(
    () =>
      rentals.filter((rental) =>
        [
          rental.code,
          rental.name,
          rental.legacyDistrict,
          rental.legacyWard,
          rental.ownerName,
          rental.ownerEmail,
          rental.ownerPhone,
        ]
          .join(" ")
          .toLocaleLowerCase("vi")
          .includes(normalizedQuery)
      ),
    [normalizedQuery, rentals]
  )
  const filteredOwners = useMemo(
    () =>
      owners.filter((owner) =>
        [owner.displayName, owner.email, owner.phone, owner.zalo]
          .join(" ")
          .toLocaleLowerCase("vi")
          .includes(normalizedQuery)
      ),
    [normalizedQuery, owners]
  )

  async function hideRental(rental: AdminRentalListing) {
    setBusyId(rental.id)

    try {
      const response = await fetch(`/api/admin/phongtro/${rental.id}`, {
        body: JSON.stringify({
          ...rental,
          hiddenReason:
            rental.hiddenReason || "Tin đã được ẩn bởi quản trị viên Roovea.",
          publicationStatus: "hidden",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error ?? "Không thể ẩn tin đăng.")
      }

      setRentals((current) =>
        current.map((item) => (item.id === rental.id ? result.rental : item))
      )
      toast.success("Đã ẩn tin đăng.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ẩn tin.")
    } finally {
      setBusyId("")
    }
  }

  async function removeRental() {
    if (!deleteTarget) return
    const target = deleteTarget
    setBusyId(target.id)

    try {
      const response = await fetch(`/api/admin/phongtro/${target.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error ?? "Không thể xóa tin đăng.")
      }

      setRentals((current) => current.filter((item) => item.id !== target.id))
      setDeleteTarget(null)
      toast.success("Đã xóa tin đăng khỏi hệ thống.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tin.")
    } finally {
      setBusyId("")
    }
  }

  async function toggleVerification(owner: RentalOwnerProfile) {
    setBusyId(owner.id)

    try {
      const response = await fetch(
        `/api/admin/chunha/${owner.id}/xacminh`,
        {
          body: JSON.stringify({ isVerified: !owner.isVerified }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }
      )
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error ?? "Không thể cập nhật xác minh.")
      }

      setOwners((current) =>
        current.map((item) =>
          item.id === owner.id
            ? { ...item, isVerified: !owner.isVerified }
            : item
        )
      )
      setRentals((current) =>
        current.map((item) =>
          item.ownerUserId === owner.id
            ? { ...item, ownerVerified: !owner.isVerified }
            : item
        )
      )
      toast.success(
        owner.isVerified ? "Đã gỡ xác minh chủ nhà." : "Đã xác minh chủ nhà."
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật xác minh."
      )
    } finally {
      setBusyId("")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Phòng trọ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tin do chủ nhà tự đăng và tin do Roovea khai báo từ đối tác.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/phongtro/moi">
            <PlusIcon data-icon="inline-start" />
            Tạo tin từ đối tác
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Tổng tin phòng trọ</CardDescription>
            <CardTitle className="text-2xl">{rentals.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Đang hiển thị</CardDescription>
            <CardTitle className="text-2xl">
              {
                rentals.filter(
                  (item) => item.publicationStatus === "published"
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Tài khoản chủ nhà</CardDescription>
            <CardTitle className="text-2xl">{owners.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <InputGroup className="max-w-xl">
        <InputGroupAddon>
          <MagnifyingGlassIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm mã tin, tên phòng, khu vực, chủ nhà..."
        />
      </InputGroup>

      <Tabs defaultValue="rentals">
        <TabsList variant="line">
          <TabsTrigger value="rentals">
            Tin phòng <Badge variant="secondary">{rentals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="owners">
            Chủ nhà <Badge variant="secondary">{owners.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rentals">
          <Card>
            <CardContent className="p-0">
              {filteredRentals.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tin đăng</TableHead>
                      <TableHead>Chủ nhà nội bộ</TableHead>
                      <TableHead>Khu vực</TableHead>
                      <TableHead>Giá thuê</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Cập nhật</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Thao tác</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="max-w-72 whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{rental.code}</Badge>
                              <Badge variant="secondary">
                                {rental.source === "self_service"
                                  ? "Chủ nhà tự đăng"
                                  : "Roovea đăng"}
                              </Badge>
                            </div>
                            <span className="font-medium">{rental.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              {rental.ownerName || "Chưa có thông tin"}
                              {rental.ownerVerified ? (
                                <CheckCircleIcon
                                  className="text-blue-600"
                                  weight="fill"
                                />
                              ) : null}
                            </span>
                            <span className="text-muted-foreground">
                              {rental.ownerPhone || "Chưa có số điện thoại"}
                              {rental.ownerZalo
                                ? ` · Zalo ${rental.ownerZalo}`
                                : ""}
                            </span>
                            <span className="text-muted-foreground">
                              {rental.ownerEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rental.legacyWard}, {rental.legacyDistrict}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(rental.monthlyPrice)}/tháng
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={
                                rental.publicationStatus === "published"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {
                                rentalPublicationStatusLabels[
                                  rental.publicationStatus
                                ]
                              }
                            </Badge>
                            <span className="text-muted-foreground">
                              {
                                rentalAvailabilityStatusLabels[
                                  rental.availabilityStatus
                                ]
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(rental.updatedAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={busyId === rental.id}
                                aria-label={`Thao tác với ${rental.code}`}
                              >
                                <DotsThreeVerticalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {rental.publicationStatus === "published" ? (
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/phongtro/${rental.code.toLocaleLowerCase()}`}
                                    target="_blank"
                                  >
                                    <EyeIcon />
                                    Xem trang công khai
                                  </Link>
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/phongtro/${rental.id}/chinhsua`}
                                >
                                  <NotePencilIcon />
                                  Chỉnh sửa
                                </Link>
                              </DropdownMenuItem>
                              {rental.publicationStatus === "published" ? (
                                <DropdownMenuItem
                                  onSelect={() => void hideRental(rental)}
                                >
                                  Ẩn tin
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteTarget(rental)}
                              >
                                <TrashIcon />
                                Xóa tin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="min-h-64">
                  <EmptyHeader>
                    <EmptyTitle>Không có tin phù hợp</EmptyTitle>
                    <EmptyDescription>
                      Thử đổi từ khóa hoặc tạo một tin phòng trọ mới.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners">
          <Card>
            <CardContent className="p-0">
              {filteredOwners.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chủ nhà</TableHead>
                      <TableHead>Liên hệ nội bộ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Xác minh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOwners.map((owner) => (
                      <TableRow key={owner.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              {owner.displayName}
                              {owner.isVerified ? (
                                <CheckCircleIcon
                                  className="text-blue-600"
                                  weight="fill"
                                />
                              ) : null}
                            </span>
                            <span className="text-muted-foreground">
                              {owner.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span>{owner.phone || "Chưa khai báo điện thoại"}</span>
                            <span className="text-muted-foreground">
                              {owner.zalo ? `Zalo ${owner.zalo}` : "Chưa có Zalo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {owner.status === "active"
                              ? "Đang hoạt động"
                              : "Đã tạm khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant={owner.isVerified ? "outline" : "default"}
                            disabled={busyId === owner.id}
                            onClick={() => void toggleVerification(owner)}
                          >
                            {owner.isVerified ? "Gỡ tích xanh" : "Cấp tích xanh"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="min-h-64">
                  <EmptyHeader>
                    <EmptyTitle>Chưa có chủ nhà phù hợp</EmptyTitle>
                    <EmptyDescription>
                      Tài khoản sẽ xuất hiện sau lần đăng nhập Google đầu tiên.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tin phòng trọ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tin {deleteTarget?.code} sẽ bị xóa khỏi danh sách quản trị và không
              còn hiển thị công khai. Hành động này không thể hoàn tác từ giao
              diện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void removeRental()}
            >
              Xóa tin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

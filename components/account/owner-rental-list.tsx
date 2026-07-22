"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  ArchiveIcon,
  EyeIcon,
  PencilSimpleIcon,
  PlusIcon,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  rentalAvailabilityStatusLabels,
  rentalPublicationStatusLabels,
  getRentalTypeLabel,
} from "@/lib/rentals/options"
import type { RentalListing } from "@/lib/rentals/types"

export function OwnerRentalList({ rentals }: { rentals: RentalListing[] }) {
  const router = useRouter()
  const [archivingId, setArchivingId] = useState("")

  async function archiveRental(id: string) {
    setArchivingId(id)
    try {
      const response = await fetch(`/api/taikhoan/tindang/${id}`, {
        method: "DELETE",
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể lưu trữ tin.")
      }

      toast.success("Đã lưu trữ tin đăng.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu trữ tin."
      )
    } finally {
      setArchivingId("")
    }
  }

  if (!rentals.length) {
    return (
      <Empty className="border bg-background">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PlusIcon />
          </EmptyMedia>
          <EmptyTitle>Chưa có tin phòng trọ</EmptyTitle>
          <EmptyDescription>
            Tạo tin đầu tiên và tự quản lý trạng thái phòng của bạn.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/taikhoan/tindang/moi">Đăng tin mới</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rentals.map((rental) => (
        <Card key={rental.id}>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{rental.code}</Badge>
              <Badge
                variant={
                  rental.publicationStatus === "published"
                    ? "default"
                    : "secondary"
                }
              >
                {rentalPublicationStatusLabels[rental.publicationStatus]}
              </Badge>
            </div>
            <CardTitle>{rental.name || "Tin chưa đặt tên"}</CardTitle>
            <CardDescription>
              {getRentalTypeLabel(rental.rentalType, rental.otherRentalType)} ·{" "}
              {rentalAvailabilityStatusLabels[rental.availabilityStatus]}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              {rental.legacyWard || "Chưa có phường cũ"},{" "}
              {rental.legacyDistrict || "chưa có quận cũ"}
            </p>
            {rental.hiddenReason ? (
              <p>Lý do ẩn: {rental.hiddenReason}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/taikhoan/tindang/${rental.id}/chinhsua`}>
                <PencilSimpleIcon data-icon="inline-start" />
                Chỉnh sửa
              </Link>
            </Button>
            {rental.publicationStatus === "published" ? (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/phongtro/${rental.code.toLowerCase()}`}>
                  <EyeIcon data-icon="inline-start" />
                  Xem tin
                </Link>
              </Button>
            ) : null}
            {rental.publicationStatus !== "archived" ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={archivingId === rental.id}
                  >
                    <ArchiveIcon data-icon="inline-start" />
                    Lưu trữ
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lưu trữ tin đăng?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tin sẽ không còn xuất hiện công khai nhưng dữ liệu vẫn được
                      giữ lại trong tài khoản.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void archiveRental(rental.id)}
                    >
                      Lưu trữ
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

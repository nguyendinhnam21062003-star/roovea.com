"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { SupplierForm } from "@/components/admin/supplier-form"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { buildEmptySupplier, useAdminStore } from "@/lib/admin/store"
import type { Supplier } from "@/lib/admin/types"

export function AdminSupplierCreatePage() {
  const router = useRouter()
  const { createSupplier, nextSupplierCode } = useAdminStore()

  async function saveSupplier(supplier: Supplier) {
    const created = await createSupplier(supplier)
    router.push(`/admin/suppliers/${created.id}/edit`)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <PageHeading
        title="Thêm nhà cung cấp"
        description="Tạo nhà cung cấp/đối tác độc lập trong database."
      />
      <SupplierForm
        mode="create"
        supplier={buildEmptySupplier(nextSupplierCode)}
        submitLabel="Tạo nhà cung cấp"
        onSubmit={saveSupplier}
      />
    </div>
  )
}

export function AdminSupplierEditPage({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  const { suppliers, updateSupplier } = useAdminStore()
  const supplier = suppliers.find((item) => item.id === supplierId)

  if (!supplier) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon />
            </EmptyMedia>
            <EmptyTitle>Không tìm thấy nhà cung cấp</EmptyTitle>
            <EmptyDescription>
              Record có thể đã bị xóa hoặc không còn trong database.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/admin/suppliers">Về danh sách nhà cung cấp</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  async function saveSupplier(nextSupplier: Supplier) {
    await updateSupplier(supplierId, nextSupplier)
    router.push("/admin/suppliers")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 sm:p-6">
      <PageHeading
        title="Chỉnh sửa nhà cung cấp"
        description={`${supplier.supplierCode} · ${supplier.fullName}`}
      />
      <SupplierForm
        mode="edit"
        supplier={supplier}
        submitLabel="Lưu thay đổi"
        onSubmit={saveSupplier}
      />
    </div>
  )
}

function PageHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href="/admin/suppliers">Quay lại danh sách</Link>
      </Button>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

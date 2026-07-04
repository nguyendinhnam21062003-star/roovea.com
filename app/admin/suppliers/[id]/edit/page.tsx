import { AdminSupplierEditPage } from "@/components/admin/admin-supplier-editor-page"

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AdminSupplierEditPage supplierId={id} />
}

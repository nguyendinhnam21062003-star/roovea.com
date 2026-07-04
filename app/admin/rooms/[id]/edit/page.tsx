import { AdminRoomEditPage } from "@/components/admin/admin-room-editor-page"

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AdminRoomEditPage roomId={id} />
}

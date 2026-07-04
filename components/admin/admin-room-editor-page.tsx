"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { JsonRoomImport } from "@/components/admin/json-room-import"
import { RoomForm } from "@/components/admin/room-form"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildEmptyRoom, useAdminStore } from "@/lib/admin/store"
import type { Room } from "@/lib/admin/types"

export function AdminRoomCreatePage() {
  const router = useRouter()
  const { createRoom, nextRoomCode } = useAdminStore()

  async function saveRoom(room: Room) {
    const created = await createRoom(room)
    router.push(`/admin/rooms/${created.id}/edit`)
    return created
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <PageHeading
        title="Thêm phòng mới"
        description="Tạo phòng thủ công hoặc import JSON theo schema đã định."
      />
      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
          <TabsTrigger value="json">Nhập bằng JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <RoomForm
            mode="create"
            room={buildEmptyRoom(nextRoomCode)}
            onSave={saveRoom}
          />
        </TabsContent>
        <TabsContent value="json">
          <JsonRoomImport nextRoomCode={nextRoomCode} onImport={saveRoom} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function AdminRoomEditPage({ roomId }: { roomId: string }) {
  const { rooms, updateRoom } = useAdminStore()
  const room = rooms.find((item) => item.id === roomId)

  if (!room) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon />
            </EmptyMedia>
            <EmptyTitle>Không tìm thấy phòng</EmptyTitle>
            <EmptyDescription>
              Record có thể đã bị xóa hoặc không còn trong database.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/admin/rooms">Về danh sách phòng</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  async function saveRoom(nextRoom: Room) {
    return updateRoom(roomId, nextRoom)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <PageHeading
        title="Chỉnh sửa phòng"
        description={`${room.roomCode} · ${room.name}`}
      />
      <RoomForm mode="edit" room={room} onSave={saveRoom} />
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
        <Link href="/admin/rooms">Quay lại danh sách</Link>
      </Button>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

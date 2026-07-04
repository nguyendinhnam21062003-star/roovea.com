import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { makeId } from "@/lib/admin/helpers"

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])

export type StoredMedia = {
  id: string
  provider: "local"
  url: string
}

export async function saveRoomImage(file: File): Promise<StoredMedia> {
  const extension = allowedImageTypes.get(file.type)

  if (!extension) {
    throw new Error("Chỉ nhận JPG, PNG hoặc WEBP.")
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Ảnh tối đa 8MB.")
  }

  const id = makeId("room-image")
  const fileName = `${id}.${extension}`
  const relativeDir = "/uploads/rooms"
  const outputDir = path.join(process.cwd(), "public", "uploads", "rooms")

  await mkdir(outputDir, { recursive: true })
  await writeFile(
    path.join(outputDir, fileName),
    Buffer.from(await file.arrayBuffer())
  )

  return {
    id,
    provider: "local",
    url: `${relativeDir}/${fileName}`,
  }
}

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { makeId } from "@/lib/admin/helpers"

const roomUploadUrlPrefix = "/uploads/rooms"
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
])
const contentTypesByExtension = new Map([
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
])
const roomImageFileNamePattern =
  /^room-image-[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/i

export type StoredMedia = {
  id: string
  provider: "local"
  url: string
}

export type StoredRoomImage = {
  bytes: Buffer
  contentType: string
}

function getConfiguredUploadDir() {
  const configuredDir = process.env.ROOM_UPLOAD_DIR?.trim()

  return configuredDir ? path.resolve(configuredDir) : null
}

export function getRoomUploadDir() {
  return (
    getConfiguredUploadDir() ??
    path.join(process.cwd(), ".data", "uploads", "rooms")
  )
}

function getLegacyPublicRoomUploadDir() {
  return path.join(process.cwd(), "public", "uploads", "rooms")
}

function isSafeRoomImageFileName(fileName: string) {
  return roomImageFileNamePattern.test(fileName)
}

function getRoomImageContentType(fileName: string) {
  const extension = path.extname(fileName).slice(1).toLowerCase()

  return contentTypesByExtension.get(extension) ?? null
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
  const outputDir = getRoomUploadDir()

  await mkdir(outputDir, { recursive: true })
  await writeFile(
    path.join(outputDir, fileName),
    Buffer.from(await file.arrayBuffer())
  )

  return {
    id,
    provider: "local",
    url: `${roomUploadUrlPrefix}/${fileName}`,
  }
}

export async function readRoomImage(
  fileName: string
): Promise<StoredRoomImage | null> {
  if (!isSafeRoomImageFileName(fileName)) {
    return null
  }

  const contentType = getRoomImageContentType(fileName)

  if (!contentType) {
    return null
  }

  const candidates = [
    path.join(getRoomUploadDir(), fileName),
    path.join(getLegacyPublicRoomUploadDir(), fileName),
  ]

  for (const filePath of candidates) {
    try {
      const bytes = await readFile(filePath)

      return { bytes, contentType }
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        )
      ) {
        throw error
      }
    }
  }

  return null
}

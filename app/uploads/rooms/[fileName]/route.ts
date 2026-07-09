import { readRoomImage } from "@/lib/storage/adapter"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params
  const image = await readRoomImage(fileName)

  if (!image) {
    return new Response("Not found", { status: 404 })
  }

  return new Response(Uint8Array.from(image.bytes), {
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
      "content-type": image.contentType,
    },
  })
}

"use client"

import Image from "next/image"
import { ImageIcon, VideoCameraIcon } from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getVideoEmbedUrl } from "@/lib/media"
import { type RoomMedia } from "@/lib/rooms"

type RoomGalleryProps = {
  media: RoomMedia[]
  roomCode: string
  roomName: string
}

type EmbeddableVideo = RoomMedia & {
  embedUrl: string
}

function getEmbeddableVideos(media: RoomMedia[]): EmbeddableVideo[] {
  return media.flatMap((item) => {
    if (item.type !== "video") {
      return []
    }

    const embedUrl = getVideoEmbedUrl(item.src)

    return embedUrl ? [{ ...item, embedUrl }] : []
  })
}

export function RoomGallery({ media, roomCode, roomName }: RoomGalleryProps) {
  const images = media.filter((item) => item.type === "image")
  const videos = getEmbeddableVideos(media)
  const primaryImage = images[0]
  const previewImages = images.slice(1, 4)
  const remainingImageCount = Math.max(
    images.length - 1 - previewImages.length,
    0
  )

  return (
    <Dialog>
      <div className="grid min-h-[420px] gap-2 md:grid-cols-[minmax(0,2fr)_minmax(180px,0.7fr)]">
        <div className="relative min-h-[360px] overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.src}
              alt={primaryImage.alt}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          ) : (
            <div className="flex h-full min-h-[360px] items-center justify-center text-muted-foreground">
              Chưa có ảnh
            </div>
          )}
          <Badge className="absolute top-4 left-4">#{roomCode}</Badge>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="absolute right-4 bottom-4"
            >
              <ImageIcon data-icon="inline-start" />
              Xem tất cả
              {remainingImageCount > 0
                ? ` | ${remainingImageCount} ảnh còn lại`
                : ""}
            </Button>
          </DialogTrigger>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {previewImages.map((item, index) => (
            <GalleryPreview
              key={item.src}
              media={item}
              roomName={roomName}
              remainingImageCount={
                index === previewImages.length - 1 ? remainingImageCount : 0
              }
            />
          ))}
          {videos.slice(0, 1).map((item) => (
            <GalleryPreview
              key={item.src}
              media={item}
              roomName={roomName}
              embedUrl={item.embedUrl}
            />
          ))}
        </div>
      </div>

      <DialogContent className="grid max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Tất cả ảnh phòng</DialogTitle>
          <DialogDescription>
            {roomName} · {images.length} ảnh
            {videos.length > 0 ? ` · ${videos.length} video` : ""}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 overflow-hidden">
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((item) => (
              <div
                key={item.src}
                className="relative aspect-[4/3] overflow-hidden bg-muted"
              >
                <Image
                  src={item.src}
                  alt={`${roomName} - ${item.alt}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 45vw, 100vw"
                />
              </div>
            ))}
            {videos.map((item) => (
              <div
                key={item.src}
                className="aspect-video overflow-hidden bg-muted"
              >
                <iframe
                  src={item.embedUrl}
                  title={item.alt}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function GalleryPreview({
  media,
  roomName,
  embedUrl,
  remainingImageCount = 0,
}: {
  media: RoomMedia
  roomName: string
  embedUrl?: string
  remainingImageCount?: number
}) {
  if (media.type === "video") {
    if (!embedUrl) {
      return null
    }

    return (
      <div className="relative min-h-28 overflow-hidden bg-muted">
        <iframe
          src={embedUrl}
          title={media.alt}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1 bg-background/90 px-2 py-1 text-xs font-medium shadow-sm">
          <VideoCameraIcon className="size-3" />
          Video
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-28 overflow-hidden bg-muted">
      <Image
        src={media.src}
        alt={`${roomName} - ${media.alt}`}
        fill
        className="object-cover"
        sizes="(min-width: 768px) 18vw, 33vw"
      />
      {remainingImageCount > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/45 px-3 text-center text-sm font-semibold text-background">
          +{remainingImageCount} ảnh còn lại
        </div>
      ) : null}
    </div>
  )
}

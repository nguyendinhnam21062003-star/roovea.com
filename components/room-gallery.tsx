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
import { type RoomMedia } from "@/lib/rooms"

type RoomGalleryProps = {
  media: RoomMedia[]
  roomCode: string
  roomName: string
}

export function RoomGallery({ media, roomCode, roomName }: RoomGalleryProps) {
  const images = media.filter((item) => item.type === "image")
  const videos = media.filter((item) => item.type === "video")
  const primaryImage = images[0]

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
            </Button>
          </DialogTrigger>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
          {images.slice(1, 4).map((item) => (
            <GalleryPreview key={item.src} media={item} roomName={roomName} />
          ))}
          {videos.slice(0, 1).map((item) => (
            <GalleryPreview key={item.src} media={item} roomName={roomName} />
          ))}
        </div>
      </div>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Tất cả ảnh phòng</DialogTitle>
          <DialogDescription>
            {roomName} · {images.length} ảnh
            {videos.length > 0 ? ` · ${videos.length} video` : ""}
          </DialogDescription>
        </DialogHeader>
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
                src={item.src}
                title={item.alt}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GalleryPreview({
  media,
  roomName,
}: {
  media: RoomMedia
  roomName: string
}) {
  if (media.type === "video") {
    return (
      <div className="flex min-h-28 items-center justify-center bg-muted text-sm text-muted-foreground">
        <VideoCameraIcon className="mr-2 size-4" />
        Video
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
    </div>
  )
}

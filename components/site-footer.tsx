import Image from "next/image"
import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { contactConfig } from "@/lib/contact"

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex w-fit items-center gap-2 font-heading text-base font-semibold"
            >
              <Image
                src="/brand/roovea-logo.png"
                alt="Roovea"
                width={32}
                height={32}
                className="size-8 border object-cover"
              />
              <span>Roovea</span>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground">
              Roovea kết nối khách hàng với nơi lưu trú phù hợp, ưu tiên tốc độ
              tư vấn và thông tin phòng rõ ràng.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">Dịch vụ</p>
            <Link href="/#tim-phong" className="text-muted-foreground">
              Tìm phòng
            </Link>
            <Link href="/#lien-he" className="text-muted-foreground">
              Tour du lịch
            </Link>
            <Link href="/#lien-he" className="text-muted-foreground">
              Vé máy bay
            </Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">Liên hệ</p>
            <a href={contactConfig.phoneHref} className="text-muted-foreground">
              {contactConfig.phone}
            </a>
            <a
              href={`mailto:${contactConfig.email}`}
              className="text-muted-foreground"
            >
              {contactConfig.email}
            </a>
          </div>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          © 2026 Roovea.com. MVP giao diện lưu trú.
        </p>
      </div>
    </footer>
  )
}

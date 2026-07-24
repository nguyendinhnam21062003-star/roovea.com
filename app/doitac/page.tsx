import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  HouseLineIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Đối tác | Roovea",
  description:
    "Đăng phòng trọ hoặc hợp tác cung cấp nơi lưu trú cùng Roovea.",
}

const benefits = [
  {
    icon: HouseLineIcon,
    title: "Đăng từng phòng cụ thể",
    description:
      "Mỗi tin đại diện cho một phòng, giúp thông tin giá, tiện ích và tình trạng rõ ràng.",
  },
  {
    icon: UsersThreeIcon,
    title: "Roovea tiếp nhận khách thuê",
    description:
      "Thông tin liên hệ riêng của chủ nhà chỉ dành cho quản trị viên; khách thuê liên hệ Roovea.",
  },
  {
    icon: CheckCircleIcon,
    title: "Xác minh chủ nhà",
    description:
      "Roovea có thể cấp dấu xác minh cho từng tài khoản chủ nhà sau khi kiểm tra.",
  },
]

export default function PartnerPage() {
  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <section className="border-b px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <Badge variant="secondary">Đồng hành cùng Roovea</Badge>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Đưa chỗ ở của bạn đến đúng người đang tìm kiếm
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Hiện tại Roovea hỗ trợ và đứng giữa quá trình kết nối để ưu tiên chất
            lượng dữ liệu. Chủ phòng trọ tại TP.HCM có thể tự đăng tin miễn phí;
            đối tác lưu trú du lịch liên hệ trực tiếp với Roovea.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dangnhap?next=/taikhoan/tindang/moi">
                Đăng phòng trọ
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <ContactActions label="Trao đổi hợp tác" variant="outline" />
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon

            return (
              <Card key={benefit.title}>
                <CardHeader>
                  <Icon className="size-8" aria-hidden />
                  <CardTitle>{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 text-center">
          <h2 className="font-heading text-2xl font-semibold">
            Bạn đang vận hành homestay hoặc cơ sở lưu trú?
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Hãy gửi thông tin về cơ sở lưu trú để đội ngũ Roovea trao đổi quy
            trình hợp tác phù hợp.
          </p>
          <ContactActions label="Liên hệ Roovea" />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

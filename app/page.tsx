import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon,
  BuildingsIcon,
  CheckCircleIcon,
  HouseLineIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const steps = [
  {
    icon: MagnifyingGlassIcon,
    title: "Khám phá lựa chọn",
    description:
      "Tìm phòng trọ tại TP.HCM hoặc homestay phù hợp với chuyến đi.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Roovea hỗ trợ kiểm soát",
    description:
      "Thông tin được chuẩn hóa; chủ nhà uy tín có thể được Roovea xác minh.",
  },
  {
    icon: CheckCircleIcon,
    title: "Liên hệ qua Roovea",
    description:
      "Gửi mã tin cho Roovea để được tư vấn và kết nối bước tiếp theo.",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />

      <section className="border-b">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="secondary">Nền tảng tìm chỗ ở cùng Roovea</Badge>
            <div className="flex max-w-2xl flex-col gap-4">
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Một nơi để tìm chỗ ở phù hợp với hành trình của bạn
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Roovea hỗ trợ tìm phòng trọ tại TP.HCM và nơi lưu trú du lịch,
                đồng thời đứng giữa để tư vấn, kiểm soát chất lượng thông tin và
                kết nối nhu cầu phù hợp.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/timphongtro">
                  Tìm phòng trọ
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/timhomestay">Tìm homestay</Link>
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border bg-muted">
            <Image
              src="/brand/roovea-hero.png"
              alt="Không gian lưu trú được Roovea tuyển chọn"
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="max-w-2xl space-y-3">
            <Badge variant="outline">Bạn đang cần gì?</Badge>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
              Chọn đúng hành trình tìm kiếm
            </h2>
            <p className="text-muted-foreground">
              Phòng trọ dành cho nhu cầu ở dài hạn; homestay dành cho chuyến đi
              ngắn ngày và du lịch.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <HouseLineIcon className="size-8" aria-hidden />
                <CardTitle>Phòng trọ tại TP.HCM</CardTitle>
                <CardDescription>
                  Xem giá thuê, diện tích, tiện ích, quy định và địa chỉ đầy đủ
                  của từng phòng cụ thể.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Bộ lọc ưu tiên quận, huyện và phường, xã theo địa giới cũ quen
                thuộc; địa giới mới nằm trong phần mở rộng.
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/timphongtro">
                    Khám phá phòng trọ
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <BuildingsIcon className="size-8" aria-hidden />
                <CardTitle>Homestay và lưu trú du lịch</CardTitle>
                <CardDescription>
                  Tiếp tục trải nghiệm tìm nơi lưu trú hiện có của Roovea với
                  thông tin phòng và mức giá rõ ràng.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Phù hợp cho kỳ nghỉ, chuyến công tác hoặc hành trình cần tư vấn
                nhanh từ đội ngũ Roovea.
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link href="/timhomestay">
                    Tìm homestay
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <div className="max-w-2xl space-y-3">
            <Badge variant="secondary">Roovea đồng hành</Badge>
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
              Tìm hiểu, đối chiếu và liên hệ trong một luồng rõ ràng
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <Card key={step.title} className="bg-background">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="size-7" aria-hidden />
                      <Badge variant="outline">0{index + 1}</Badge>
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 border bg-muted/30 p-6 text-center sm:p-10">
          <Badge variant="outline">Chủ nhà và đối tác</Badge>
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
            Có phòng cho thuê hoặc muốn hợp tác cùng Roovea?
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Chủ phòng trọ có thể đăng nhập Google và tự đăng tin miễn phí. Đối
            tác lưu trú du lịch có thể trao đổi trực tiếp với Roovea để được hỗ
            trợ.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/dangnhap">Đăng phòng trọ</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/doitac">Tìm hiểu dành cho đối tác</Link>
            </Button>
            <ContactActions label="Tư vấn nhanh" variant="outline" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

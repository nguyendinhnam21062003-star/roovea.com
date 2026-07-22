import { ProfileForm } from "@/components/account/profile-form"
import { requireUserSession } from "@/lib/auth/user-session"

export default async function AccountProfilePage() {
  const session = await requireUserSession("/taikhoan/hoso")

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Tài khoản</p>
        <h1 className="font-heading text-3xl font-semibold">Hồ sơ và contact</h1>
      </div>
      <ProfileForm profile={session.user} />
    </div>
  )
}

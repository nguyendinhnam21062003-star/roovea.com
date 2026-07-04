import { AdminShell } from "@/components/admin/admin-shell"
import { AdminStoreProvider } from "@/lib/admin/store"
import { getAdminSession } from "@/lib/auth/session"
import {
  getAdminBootstrapData,
  getDemoAdminBootstrapData,
} from "@/lib/services/admin-data"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  if (!session) {
    return children
  }

  const initialState = await getAdminBootstrapData().catch(() =>
    getDemoAdminBootstrapData()
  )

  return (
    <AdminStoreProvider initialState={initialState}>
      <AdminShell>{children}</AdminShell>
    </AdminStoreProvider>
  )
}

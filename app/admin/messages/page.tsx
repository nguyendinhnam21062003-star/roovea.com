import { AdminMessagesPage } from "@/components/admin/admin-messages-page"
import { listAdminInquiries } from "@/lib/services/inquiries"

export default async function MessagesPage() {
  const inquiries = await listAdminInquiries().catch(() => {
    return []
  })

  return <AdminMessagesPage initialInquiries={inquiries} />
}

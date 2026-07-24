"use client"

import { useState, type FormEvent } from "react"
import { CheckCircleIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { RentalOwnerProfile } from "@/lib/rentals/types"

export function ProfileForm({ profile }: { profile: RentalOwnerProfile }) {
  const [draft, setDraft] = useState(profile)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const response = await fetch("/api/taikhoan/hoso", {
        body: JSON.stringify({
          displayName: draft.displayName,
          phone: draft.phone,
          zalo: draft.zalo,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        const fieldErrors = Object.fromEntries(
          Object.entries(result.fieldErrors ?? {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(" ") : String(value ?? ""),
          ])
        )
        setErrors(fieldErrors)
        throw new Error(result.error ?? "Không thể lưu hồ sơ.")
      }

      setDraft(result.profile)
      toast.success("Đã cập nhật hồ sơ.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu hồ sơ."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!draft.phone ? (
        <Alert>
          <AlertTitle>Hoàn thành thông tin liên hệ</AlertTitle>
          <AlertDescription>
            Số điện thoại chỉ hiển thị với bạn và đội ngũ hỗ trợ. Người thuê
            luôn liên hệ Roovea.
          </AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Hồ sơ chủ nhà</CardTitle>
              <CardDescription>
                Thông tin này chỉ được Roovea sử dụng để hỗ trợ tài khoản của
                bạn.
              </CardDescription>
            </div>
            {draft.isVerified ? <Badge>Đã xác minh</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-email">Email Google</FieldLabel>
              <Input id="profile-email" value={draft.email} disabled />
            </Field>
            <Field data-invalid={Boolean(errors.displayName)}>
              <FieldLabel htmlFor="profile-name">Tên hiển thị</FieldLabel>
              <Input
                id="profile-name"
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                aria-invalid={Boolean(errors.displayName)}
              />
              <FieldError>{errors.displayName}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor="profile-phone">Số điện thoại</FieldLabel>
              <Input
                id="profile-phone"
                type="tel"
                value={draft.phone}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="0901234567"
                aria-invalid={Boolean(errors.phone)}
              />
              <FieldDescription>Bắt buộc trước khi xuất bản tin.</FieldDescription>
              <FieldError>{errors.phone}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.zalo)}>
              <FieldLabel htmlFor="profile-zalo">Zalo</FieldLabel>
              <Input
                id="profile-zalo"
                value={draft.zalo}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    zalo: event.target.value,
                  }))
                }
                placeholder="Nếu để trống sẽ dùng số điện thoại"
                aria-invalid={Boolean(errors.zalo)}
              />
              <FieldError>{errors.zalo}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={saving}>
            <CheckCircleIcon data-icon="inline-start" />
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

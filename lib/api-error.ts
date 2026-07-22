import { ZodError } from "zod"
import { NextResponse } from "next/server"

export function apiErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Dữ liệu chưa hợp lệ.",
        fieldErrors: error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const fieldErrors =
    error instanceof Error &&
    "fieldErrors" in error &&
    typeof error.fieldErrors === "object"
      ? error.fieldErrors
      : undefined

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Không thể lưu dữ liệu.",
      fieldErrors,
    },
    { status: fieldErrors ? 400 : 500 }
  )
}

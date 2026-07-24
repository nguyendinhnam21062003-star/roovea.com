import { NextResponse } from "next/server"

const provinceApiBase = "https://provinces.open-api.vn"
const cacheTtlMs = 24 * 60 * 60 * 1000
const responseCache = new Map<
  string,
  { expiresAt: number; value: unknown }
>()
const pendingRequests = new Map<string, Promise<unknown>>()

async function getCachedProvinceData(url: string) {
  const cached = responseCache.get(url)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const pending = pendingRequests.get(url)
  if (pending) return pending

  const request = fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 86400 },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Province API trả về ${response.status}.`)
      }
      const value = (await response.json()) as unknown
      responseCache.set(url, {
        expiresAt: Date.now() + cacheTtlMs,
        value,
      })
      return value
    })
    .finally(() => pendingRequests.delete(url))

  pendingRequests.set(url, request)
  return request
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get("resource")
  const code = searchParams.get("code") ?? ""

  if (code && !/^\d{1,10}$/.test(code)) {
    return NextResponse.json({ error: "Mã địa chỉ không hợp lệ." }, { status: 400 })
  }

  const upstreamUrl =
    resource === "legacy-provinces"
      ? `${provinceApiBase}/api/v1/?depth=2`
      : resource === "new-provinces"
        ? `${provinceApiBase}/api/v2/?depth=2`
        : resource === "legacy-district" && code
          ? `${provinceApiBase}/api/v1/d/${code}?depth=2`
          : resource === "to-legacies" && code
            ? `${provinceApiBase}/api/v2/w/${code}/to-legacies/`
            : resource === "from-legacy" && code
              ? `${provinceApiBase}/api/v2/w/from-legacy/?legacy_code=${code}`
              : null

  if (!upstreamUrl) {
    return NextResponse.json(
      { error: "Yêu cầu dữ liệu địa chỉ không hợp lệ." },
      { status: 400 }
    )
  }

  try {
    return NextResponse.json(await getCachedProvinceData(upstreamUrl), {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Chưa thể tải dữ liệu địa chỉ hành chính." },
      { status: 502 }
    )
  }
}

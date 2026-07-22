"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  copyRoomForDuplicate,
  formatSequenceCode,
  getNextSupplierSequence,
  makeId,
  resolveRoomStatus,
  todayIso,
} from "@/lib/admin/helpers"
import type {
  Room,
  RoomStatus,
  Supplier,
  SupplierStatus,
} from "@/lib/admin/types"
import { defaultContactChannels, type ContactChannel } from "@/lib/contact"

export type AdminBootstrapData = {
  databaseMessage?: string
  databaseReady: boolean
  rooms: Room[]
  suppliers: Supplier[]
  nextRoomCode: string
  nextSupplierCode: string
  contactChannels: ContactChannel[]
  unreadInquiryCount: number
}

type AdminState = AdminBootstrapData

type AdminStoreContextValue = {
  databaseMessage?: string
  databaseReady: boolean
  rooms: Room[]
  suppliers: Supplier[]
  nextRoomCode: string
  nextSupplierCode: string
  contactChannels: ContactChannel[]
  unreadInquiryCount: number
  setUnreadInquiryCount: (count: number) => void
  updateContactChannels: (
    channels: ContactChannel[]
  ) => Promise<ContactChannel[]>
  createRoom: (room: Room) => Promise<Room>
  updateRoom: (id: string, room: Room) => Promise<Room | null>
  deleteRoom: (id: string) => Promise<void>
  duplicateRoom: (id: string) => Promise<Room | null>
  setRoomStatus: (id: string, status: RoomStatus) => Promise<Room | null>
  createSupplier: (supplier: Supplier) => Promise<Supplier>
  updateSupplier: (id: string, supplier: Supplier) => Promise<Supplier | null>
  deleteSupplier: (id: string) => Promise<{ ok: boolean; reason?: string }>
  setSupplierStatus: (
    id: string,
    status: SupplierStatus
  ) => Promise<Supplier | null>
  linkSupplierToRoom: (
    roomId: string,
    supplierId: string
  ) => Promise<Room | null>
}

const AdminStoreContext = createContext<AdminStoreContextValue | null>(null)

function getEmptyBootstrap(): AdminBootstrapData {
  return {
    databaseMessage:
      "Database chưa sẵn sàng. Giao diện đang ở trạng thái rỗng tạm thời.",
    databaseReady: false,
    rooms: [],
    suppliers: [],
    contactChannels: defaultContactChannels,
    nextRoomCode: "PH-000001",
    nextSupplierCode: "NCC-000001",
    unreadInquiryCount: 0,
  }
}

async function adminRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Không thể lưu dữ liệu admin."
    )
  }

  return payload as T
}

function getRoomCodeSequence(roomCode: string) {
  const match = roomCode.match(/^PH-(\d+)$/)

  return match ? Number(match[1]) : 0
}

function advanceRoomCode(currentRoomCode: string, usedRoomCode: string) {
  return formatSequenceCode(
    "PH",
    Math.max(
      getRoomCodeSequence(currentRoomCode),
      getRoomCodeSequence(usedRoomCode) + 1
    )
  )
}

function nextSupplierCode(suppliers: Supplier[]) {
  return formatSequenceCode("NCC", getNextSupplierSequence(suppliers))
}

export function buildEmptyRoom(roomCode: string): Room {
  const now = todayIso()

  return {
    id: "",
    roomCode,
    name: "",
    status: "draft",
    accommodationTypes: [],
    otherAccommodationType: "",
    description: "",
    areaM2: undefined,
    capacity: {
      maxGuests: 1,
      maxAdults: 1,
      maxChildren: 0,
      childAgeMax: 6,
      bedrooms: 0,
      bathrooms: 0,
      beds: 0,
    },
    supplierId: undefined,
    pricing: {
      supplierPrice: 0,
      commissionType: "percentage",
      commissionValue: 0,
      referencePrice: 0,
      priceUnit: "per_night",
      weekdaySupplierPrice: 0,
      specialSupplierPrice: 0,
      weekdayCustomerPrice: 0,
      specialCustomerPrice: 0,
      weekdayPriceUnit: "per_night",
      specialPriceUnit: "per_night",
      weekdayUnitCount: 1,
      specialUnitCount: 1,
      weekdayDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      priceNote: "",
    },
    location: {
      provinceCity: "",
      districtCity: "",
      addressDetail: "",
      googleMapsUrl: "",
      nearbyTags: [],
      distanceToCenter: "not_declared",
    },
    policies: {
      checkInTime: "14:00",
      checkOutTime: "12:00",
      smoking: "not_allowed",
      pets: "not_allowed",
      cancellationType: "conditional",
      cancellationDetail: "",
      depositRequired: false,
      depositDetail: "",
      minimumNights: 1,
      quietHours: "",
      otherPolicy: "",
    },
    amenities: [],
    customAmenities: [],
    media: {
      images: [],
      videoUrls: [],
    },
    seo: {
      slug: "",
      metaTitle: "",
      metaDescription: "",
    },
    internalNote: "",
    internalPolicyUrl: "",
    isFeatured: false,
    displayPriority: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: "Admin",
    updatedBy: "Admin",
  }
}

export function buildEmptySupplier(supplierCode: string): Supplier {
  const now = todayIso()

  return {
    id: "",
    supplierCode,
    fullName: "",
    citizenId: "",
    age: undefined,
    gender: "prefer_not_to_say",
    address: "",
    phone: "",
    zalo: "",
    facebookUrl: "",
    tiktokUrl: "",
    email: "",
    serviceAreas: [
      {
        id: makeId("area"),
        country: "Việt Nam",
        provinceCity: "",
        districtCity: "",
      },
    ],
    serviceTypes: ["accommodation"],
    accommodationTypes: [],
    status: "active",
    internalNote: "",
    createdAt: now,
    updatedAt: now,
  }
}

export function AdminStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: AdminBootstrapData
}) {
  const [state, setState] = useState<AdminState>(
    () => initialState ?? getEmptyBootstrap()
  )

  const value = useMemo<AdminStoreContextValue>(() => {
    return {
      rooms: state.rooms,
      databaseMessage: state.databaseMessage,
      databaseReady: state.databaseReady,
      suppliers: state.suppliers,
      nextRoomCode: state.nextRoomCode,
      nextSupplierCode: state.nextSupplierCode,
      contactChannels: state.contactChannels,
      unreadInquiryCount: state.unreadInquiryCount,
      setUnreadInquiryCount(count) {
        setState((current) => ({
          ...current,
          unreadInquiryCount: Math.max(0, count),
        }))
      },
      async updateContactChannels(channels) {
        const payload = await adminRequest<{
          contactChannels: ContactChannel[]
        }>("/api/admin/contact-channels", {
          body: JSON.stringify(channels),
          method: "PATCH",
        })

        setState((current) => ({
          ...current,
          contactChannels: payload.contactChannels,
        }))

        return payload.contactChannels
      },
      async createRoom(room) {
        const now = todayIso()
        const roomToSave: Room = {
          ...room,
          id: room.id || makeId("room"),
          roomCode: room.roomCode || state.nextRoomCode,
          status: resolveRoomStatus(room, room.status),
          createdAt: room.createdAt || now,
          updatedAt: now,
          createdBy: room.createdBy || "Admin",
          updatedBy: "Admin",
        }
        const payload = await adminRequest<{ room: Room }>("/api/admin/rooms", {
          body: JSON.stringify(roomToSave),
          method: "POST",
        })

        setState((current) => {
          const rooms = [payload.room, ...current.rooms]

          return {
            ...current,
            rooms,
            nextRoomCode: advanceRoomCode(
              current.nextRoomCode,
              payload.room.roomCode
            ),
          }
        })

        return payload.room
      },
      async updateRoom(id, room) {
        const currentRoom = state.rooms.find((item) => item.id === id)

        if (!currentRoom) {
          return null
        }

        const roomToSave: Room = {
          ...room,
          id,
          status: resolveRoomStatus(room, room.status),
          createdAt: currentRoom.createdAt,
          createdBy: currentRoom.createdBy,
          updatedAt: todayIso(),
          updatedBy: "Admin",
        }
        const payload = await adminRequest<{ room: Room }>(
          `/api/admin/rooms/${id}`,
          {
            body: JSON.stringify(roomToSave),
            method: "PATCH",
          }
        )

        setState((current) => ({
          ...current,
          rooms: current.rooms.map((item) =>
            item.id === id ? payload.room : item
          ),
        }))

        return payload.room
      },
      async deleteRoom(id) {
        await adminRequest<{ ok: boolean }>(`/api/admin/rooms/${id}`, {
          method: "DELETE",
        })
        setState((current) => {
          const rooms = current.rooms.filter((room) => room.id !== id)

          return {
            ...current,
            rooms,
            nextRoomCode: current.nextRoomCode,
          }
        })
      },
      async duplicateRoom(id) {
        const sourceRoom = state.rooms.find((room) => room.id === id)

        if (!sourceRoom) {
          return null
        }

        const optimisticRoom = copyRoomForDuplicate(
          sourceRoom,
          state.nextRoomCode
        )
        const payload = await adminRequest<{ room: Room }>(
          `/api/admin/rooms/${id}/duplicate`,
          { method: "POST" }
        )
        const duplicatedRoom = payload.room ?? optimisticRoom

        setState((current) => {
          const rooms = [duplicatedRoom, ...current.rooms]

          return {
            ...current,
            rooms,
            nextRoomCode: advanceRoomCode(
              current.nextRoomCode,
              duplicatedRoom.roomCode
            ),
          }
        })

        return duplicatedRoom
      },
      async setRoomStatus(id, status) {
        const sourceRoom = state.rooms.find((room) => room.id === id)

        if (!sourceRoom) {
          return null
        }

        const roomToSave: Room = {
          ...sourceRoom,
          status: resolveRoomStatus(sourceRoom, status),
          updatedAt: todayIso(),
          updatedBy: "Admin",
        }
        const payload = await adminRequest<{ room: Room }>(
          `/api/admin/rooms/${id}`,
          {
            body: JSON.stringify(roomToSave),
            method: "PATCH",
          }
        )

        setState((current) => ({
          ...current,
          rooms: current.rooms.map((room) =>
            room.id === id ? payload.room : room
          ),
        }))

        return payload.room
      },
      async createSupplier(supplier) {
        const now = todayIso()
        const supplierToSave: Supplier = {
          ...supplier,
          id: supplier.id || makeId("supplier"),
          createdAt: supplier.createdAt || now,
          updatedAt: now,
        }
        const payload = await adminRequest<{ supplier: Supplier }>(
          "/api/admin/suppliers",
          {
            body: JSON.stringify(supplierToSave),
            method: "POST",
          }
        )

        setState((current) => {
          const suppliers = [payload.supplier, ...current.suppliers]

          return {
            ...current,
            suppliers,
            nextSupplierCode: nextSupplierCode(suppliers),
          }
        })

        return payload.supplier
      },
      async updateSupplier(id, supplier) {
        const currentSupplier = state.suppliers.find((item) => item.id === id)

        if (!currentSupplier) {
          return null
        }

        const supplierToSave: Supplier = {
          ...supplier,
          id,
          supplierCode: currentSupplier.supplierCode,
          createdAt: currentSupplier.createdAt,
          updatedAt: todayIso(),
        }
        const payload = await adminRequest<{ supplier: Supplier }>(
          `/api/admin/suppliers/${id}`,
          {
            body: JSON.stringify(supplierToSave),
            method: "PATCH",
          }
        )

        setState((current) => ({
          ...current,
          suppliers: current.suppliers.map((item) =>
            item.id === id ? payload.supplier : item
          ),
        }))

        return payload.supplier
      },
      async deleteSupplier(id) {
        const payload = await adminRequest<{ ok: boolean; reason?: string }>(
          `/api/admin/suppliers/${id}`,
          { method: "DELETE" }
        )

        if (!payload.ok) {
          return payload
        }

        setState((current) => {
          const suppliers = current.suppliers.filter(
            (supplier) => supplier.id !== id
          )

          return {
            ...current,
            suppliers,
            nextSupplierCode: nextSupplierCode(suppliers),
          }
        })

        return { ok: true }
      },
      async setSupplierStatus(id, status) {
        const payload = await adminRequest<{ supplier: Supplier }>(
          `/api/admin/suppliers/${id}/status`,
          {
            body: JSON.stringify({ status }),
            method: "PATCH",
          }
        )

        setState((current) => ({
          ...current,
          suppliers: current.suppliers.map((supplier) =>
            supplier.id === id ? payload.supplier : supplier
          ),
        }))

        return payload.supplier
      },
      async linkSupplierToRoom(roomId, supplierId) {
        const sourceRoom = state.rooms.find((room) => room.id === roomId)

        if (!sourceRoom) {
          return null
        }

        const roomToSave: Room = {
          ...sourceRoom,
          supplierId,
          updatedAt: todayIso(),
          updatedBy: "Admin",
        }
        const payload = await adminRequest<{ room: Room }>(
          `/api/admin/rooms/${roomId}`,
          {
            body: JSON.stringify(roomToSave),
            method: "PATCH",
          }
        )

        setState((current) => ({
          ...current,
          rooms: current.rooms.map((room) =>
            room.id === roomId ? payload.room : room
          ),
        }))

        return payload.room
      },
    }
  }, [state])

  return (
    <AdminStoreContext.Provider value={value}>
      {children}
    </AdminStoreContext.Provider>
  )
}

export function useAdminStore() {
  const context = useContext(AdminStoreContext)

  if (!context) {
    throw new Error("useAdminStore must be used within AdminStoreProvider")
  }

  return context
}

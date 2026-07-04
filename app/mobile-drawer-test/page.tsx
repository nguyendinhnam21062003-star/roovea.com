"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

type TestButton = "native" | "shadcn" | "quick" | "filter"
type TestPhase = "pointerdown" | "touchstart" | "click"

const buttonLabels: Record<TestButton, string> = {
  native: "Native button",
  shadcn: "Shadcn button",
  quick: "Xem nhanh",
  filter: "Bo loc",
}

const initialClicks: Record<TestButton, number> = {
  native: 0,
  shadcn: 0,
  quick: 0,
  filter: 0,
}

export default function MobileDrawerTestPage() {
  const [clicks, setClicks] = useState(initialClicks)
  const [controlledOpen, setControlledOpen] = useState(false)
  const [lastEvent, setLastEvent] = useState("Chua co su kien")

  function record(target: TestButton, phase: TestPhase) {
    if (phase === "click") {
      setClicks((current) => ({
        ...current,
        [target]: current[target] + 1,
      }))
    }

    setLastEvent(
      `${buttonLabels[target]} / ${phase} / ${new Date().toLocaleTimeString(
        "vi-VN"
      )}`
    )
  }

  function buttonText(target: TestButton) {
    const count = clicks[target]

    return count > 0
      ? `${buttonLabels[target]} OK (${count})`
      : buttonLabels[target]
  }

  return (
    <main className="min-h-svh bg-background p-2 text-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3 py-4">
        <div className="sticky top-2 z-10 border bg-background p-3 text-xs leading-6 shadow-sm">
          <p>
            Native: {clicks.native} | Shadcn: {clicks.shadcn} | Xem nhanh:{" "}
            {clicks.quick} | Bo loc: {clicks.filter}
          </p>
          <p>{lastEvent}</p>
        </div>

        <button
          type="button"
          className={[
            "h-12 border px-4 text-sm font-medium transition-colors",
            clicks.native > 0
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-border bg-background text-foreground",
          ].join(" ")}
          onPointerDown={() => record("native", "pointerdown")}
          onTouchStart={() => record("native", "touchstart")}
          onClick={() => record("native", "click")}
        >
          {buttonText("native")}
        </button>

        <Button
          type="button"
          variant={clicks.shadcn > 0 ? "secondary" : "default"}
          className="h-12"
          onPointerDown={() => record("shadcn", "pointerdown")}
          onTouchStart={() => record("shadcn", "touchstart")}
          onClick={() => record("shadcn", "click")}
        >
          {buttonText("shadcn")}
        </Button>

        <Drawer open={controlledOpen} onOpenChange={setControlledOpen}>
          <Button
            type="button"
            variant="outline"
            className="h-12"
            onPointerDown={() => record("quick", "pointerdown")}
            onTouchStart={() => record("quick", "touchstart")}
            onClick={() => {
              record("quick", "click")
              setControlledOpen(true)
            }}
          >
            {buttonText("quick")}
          </Button>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Xem nhanh</DrawerTitle>
              <DrawerDescription>
                Drawer controlled duoc mo bang onClick.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 text-sm">
              Drawer controlled dang mo.
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Dong
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Drawer>
          <DrawerTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onPointerDown={() => record("filter", "pointerdown")}
              onTouchStart={() => record("filter", "touchstart")}
              onClick={() => record("filter", "click")}
            >
              {buttonText("filter")}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Bo loc</DrawerTitle>
              <DrawerDescription>
                Drawer mo bang DrawerTrigger asChild.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 text-sm">
              Drawer trigger dang mo.
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Dong
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </main>
  )
}

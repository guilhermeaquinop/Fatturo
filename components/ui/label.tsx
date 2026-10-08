"use client"

// Rótulo de campo (13px/600), sempre visível acima do campo. Equivale a um <x-label> do Blade.
import * as React from "react"
import { cn } from "@/lib/utils"
import { Label as LabelPrimitive } from "radix-ui"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("text-label text-ink", className)}
      {...props}
    />
  )
}

export { Label }

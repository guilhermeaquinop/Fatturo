// Caixa de seleção nativa de 18px, marcada em accent-strong, como nos mockups.
// Equivale a um <x-checkbox> do Blade.
import * as React from "react"
import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "mt-px size-[18px] shrink-0 cursor-pointer accent-accent-strong disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }

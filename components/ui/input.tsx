// Campo de texto do design system (componentes.md, "TextField").
// Equivale a um componente Blade <x-input>. Com aria-invalid, a borda vira 2px error-solid.
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-control-lg w-full min-w-0 rounded-md border border-border-control bg-surface px-3.5 text-body text-ink placeholder:text-ink-muted disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-2 aria-invalid:border-error-solid aria-invalid:px-[13px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

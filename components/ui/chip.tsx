// Chip: frase curta de estado em pílula (componentes.md, "Badge" e "Alert").
// Equivale a um componente Blade <x-chip>. Alerta e erro sempre levam ícone, nunca só cor.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ErrorIcon, WarningIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-2 rounded-pill px-4 py-2.5 text-body font-semibold",
  {
    variants: {
      variant: {
        default: "bg-surface-tint text-ink",
        warning: "bg-warning-surface text-warning-ink",
        error: "bg-error-surface text-error-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Chip({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof chipVariants>) {
  return (
    <div data-slot="chip" className={cn(chipVariants({ variant }), className)} {...props}>
      {variant === "warning" ? <WarningIcon className="flex-none" /> : null}
      {variant === "error" ? <ErrorIcon className="flex-none" /> : null}
      <span>{children}</span>
    </div>
  )
}

export { Chip }

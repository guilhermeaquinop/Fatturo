// Mensagem de estado com ícone, título e uma frase (componentes.md, "Alert").
// Equivale a um <x-alert> do Blade. O tipo muda cor e ícone, nunca só a cor.
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CheckIcon, ErrorIcon, InfoIcon, WarningIcon } from "@/components/ui/icons"

const alertVariants = cva(
  "flex items-start gap-3 rounded-md px-4 py-3 text-body [&>svg]:mt-0.5 [&>svg]:flex-none",
  {
    variants: {
      variant: {
        warning: "bg-warning-surface text-warning-ink",
        info: "bg-info-surface text-info-ink",
        error: "bg-error-surface text-error-ink",
        // Sucesso não tem família própria: surface-tint com ícone em accent-strong.
        success: "bg-surface-tint text-ink [&>svg]:text-accent-strong",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const icons = {
  warning: WarningIcon,
  info: InfoIcon,
  error: ErrorIcon,
  success: CheckIcon,
}

function Alert({
  className,
  variant = "info",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const Icon = icons[variant ?? "info"]

  return (
    <div
      data-slot="alert"
      role={variant === "error" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon />
      <div>{children}</div>
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="alert-title"
      className={cn("block font-semibold", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle }

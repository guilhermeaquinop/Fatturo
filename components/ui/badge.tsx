// Etiqueta curta dentro de uma linha de tabela ou lista (componentes.md, "Badge").
// Equivale a um componente Blade <x-badge>. Pílula de 12px/600 em surface-tint-strong.
// A variante "pendente" difere pela forma (contorno tracejado), não só pela cor.
import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "pendente"
}

function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-pill px-2 py-0.5 text-caption font-semibold whitespace-nowrap text-ink",
        variant === "default"
          ? "bg-surface-tint-strong"
          : "border border-dashed border-border-dashed text-ink-muted",
        className
      )}
      {...props}
    />
  )
}

export { Badge }

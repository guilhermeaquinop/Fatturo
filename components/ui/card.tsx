// Contêiner de cada bloco das telas internas (componentes.md, "Card").
// Equivale a um componente Blade <x-card>. Fundo surface, borda border, raio xl, sem sombra.
import * as React from "react"
import { cn } from "@/lib/utils"

type CardProps = React.ComponentProps<"section"> & {
  /** Cartão de destaque (limite): padding maior. */
  hero?: boolean
}

function Card({ hero = false, className, ...props }: CardProps) {
  return (
    <section
      data-slot="card"
      className={cn(
        "flex min-w-0 flex-col gap-6 rounded-xl border border-border bg-surface",
        // No celular o padding encolhe para sobrar largura para o conteúdo.
        hero ? "p-5 sm:p-7" : "p-5 sm:p-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-section-title", className)} {...props} />
}

export { Card, CardTitle }

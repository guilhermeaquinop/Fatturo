// Cartão de opção: escolha entre poucas alternativas com explicação curta (componentes.md, "OptionCard").
// Equivale a um componente Blade de radio estilizado. O selecionado ganha fundo surface-tint
// e borda de 2px accent-strong.
import * as React from "react"
import { cn } from "@/lib/utils"

type OptionCardProps = Omit<React.ComponentProps<"button">, "type" | "title"> & {
  title: string
  description: string
  selected: boolean
}

function OptionCard({ title, description, selected, className, ...props }: OptionCardProps) {
  return (
    <button
      type="button"
      data-slot="option-card"
      aria-pressed={selected}
      className={cn(
        "min-h-[72px] flex-[1_1_200px] cursor-pointer rounded-lg border border-border bg-surface px-4 py-3 text-left text-body text-ink",
        "aria-pressed:border-2 aria-pressed:border-accent-strong aria-pressed:bg-surface-tint",
        className
      )}
      {...props}
    >
      <span className="block font-bold">{title}</span>
      <span className="block text-caption text-ink-muted">{description}</span>
    </button>
  )
}

export { OptionCard }

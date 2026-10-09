// Indicador de passos de um fluxo curto (componentes.md, "Stepper").
// Equivale a um componente Blade <x-stepper>. Concluído: círculo accent-strong;
// atual: círculo ink; futuro: círculo com borda border-dashed.
import * as React from "react"
import { cn } from "@/lib/utils"

type StepperProps = {
  steps: readonly string[]
  /** Índice do passo atual, começando em 0. */
  current: number
  className?: string
}

function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol aria-label="Etapas" className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current

        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-ink-muted",
              active && "font-semibold text-ink"
            )}
          >
            <span
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-pill border border-border-dashed text-label font-bold text-ink-muted",
                done && "border-accent-strong bg-accent-strong text-on-ink",
                active && "border-ink bg-ink text-on-ink"
              )}
            >
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}

export { Stepper }

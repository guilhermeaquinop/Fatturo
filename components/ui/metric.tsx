// Par rótulo e valor de um indicador (componentes.md, "Metric").
// Equivale a um componente Blade <x-metric>. Rótulo em ink-muted, valor em 22px/600.
import * as React from "react"

type MetricProps = {
  label: string
  value: React.ReactNode
  /** Linha de apoio abaixo do valor, opcional. */
  hint?: React.ReactNode
}

function Metric({ label, value, hint }: MetricProps) {
  return (
    <div className="flex-[1_1_180px]">
      <div className="text-ink-muted">{label}</div>
      <div className="text-metric">{value}</div>
      {hint ? <div className="text-caption text-ink-muted">{hint}</div> : null}
    </div>
  )
}

export { Metric }

// Select nativo no estilo do design system, com rótulo e dica ou erro (componentes.md, "TextField").
// Equivale a um <x-form.select> do Blade que já mostra o @error do campo.
import * as React from "react"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/text-field"
import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-control-lg w-full min-w-0 rounded-md border border-border-control bg-surface px-3 text-body text-ink disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-2 aria-invalid:border-error-solid",
        className
      )}
      {...props}
    />
  )
}

type SelectFieldProps = Omit<React.ComponentProps<"select">, "id"> & {
  label: string
  hint?: string
  error?: string
}

function SelectField({ label, hint, error, children, ...props }: SelectFieldProps) {
  const id = React.useId()
  const descriptionId = error ? `${id}-erro` : hint ? `${id}-dica` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        {...props}
      >
        {children}
      </Select>
      {error ? (
        <FieldError id={descriptionId}>{error}</FieldError>
      ) : hint ? (
        <span id={descriptionId} className="text-caption text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export { Select, SelectField }

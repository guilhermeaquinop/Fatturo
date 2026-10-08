// Campo completo: rótulo acima, campo de 48px e dica ou erro abaixo (componentes.md, "TextField").
// Equivale a um <x-form.field> do Blade que já mostra o @error do campo.
import * as React from "react"
import { ErrorIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TextFieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  label: string
  hint?: string
  error?: string
  /** Conteúdo à direita do rótulo, como o link "Esqueci minha senha". */
  labelAside?: React.ReactNode
}

function TextField({ label, hint, error, labelAside, ...props }: TextFieldProps) {
  // useId gera um id único: o Next mantém páginas visitadas ocultas no documento,
  // e ids fixos como "email" se repetiriam entre o login e o cadastro.
  const id = React.useId()
  const descriptionId = error ? `${id}-erro` : hint ? `${id}-dica` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {labelAside ? (
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          {labelAside}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        {...props}
      />
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

function FieldError({ children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className="flex items-center gap-1.5 text-caption font-semibold text-error-ink"
      {...props}
    >
      <ErrorIcon className="flex-none" />
      {children}
    </span>
  )
}

export { TextField, FieldError }

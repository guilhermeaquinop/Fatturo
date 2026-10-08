// Ícones de estado do design system (componentes.md, "Alert"): triângulo, i, x e check.
// Equivale a componentes Blade de ícone. Herdam a cor do texto (currentColor).
import * as React from "react"

type IconProps = Omit<React.ComponentProps<"svg">, "children">

function IconBase({ children, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

function WarningIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 2.5 16.5 15h-15L9 2.5Z" />
      <path d="M9 7.5v3.5M9 13v.2" />
    </IconBase>
  )
}

function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="7" />
      <path d="M9 8.2V12.5M9 5.6v.2" />
    </IconBase>
  )
}

function ErrorIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="7" />
      <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" />
    </IconBase>
  )
}

function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="7" />
      <path d="M5.8 9.2l2.2 2.2 4.2-4.6" />
    </IconBase>
  )
}

export { WarningIcon, InfoIcon, ErrorIcon, CheckIcon }

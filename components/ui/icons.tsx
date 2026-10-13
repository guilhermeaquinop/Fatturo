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

// --- Ícones do menu lateral: mesmo traço dos ícones de estado, um por seção. ---

/** Painel: quadros de um dashboard. */
function PainelIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="2.5" width="5.5" height="6.5" rx="1" />
      <rect x="10.5" y="2.5" width="5" height="3.5" rx="1" />
      <rect x="10.5" y="8.5" width="5" height="7" rx="1" />
      <rect x="2.5" y="11.5" width="5.5" height="4" rx="1" />
    </IconBase>
  )
}

/** Lançamentos: uma seta de entrada e uma de saída. */
function LancamentosIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5.5 14.5v-11M2.5 6.5l3-3 3 3" />
      <path d="M12.5 3.5v11M9.5 11.5l3 3 3-3" />
    </IconBase>
  )
}

/** Notas: uma folha com o canto dobrado. */
function NotasIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 2h6L14 5.5V16H4.5V2Z" />
      <path d="M10.5 2v3.5H14M7 9h4.5M7 12h4.5" />
    </IconBase>
  )
}

/** DAS: um calendário, pelo vencimento mensal. */
function DasIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="4" width="13" height="11.5" rx="1.5" />
      <path d="M2.5 7.5h13M6 2.2v3M12 2.2v3" />
    </IconBase>
  )
}

/** Regras: controles deslizantes. */
function RegrasIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 5.5h6.5M13.5 5.5h2M2.5 12.5h2M9 12.5h6.5" />
      <circle cx="11.25" cy="5.5" r="2" />
      <circle cx="6.75" cy="12.5" r="2" />
    </IconBase>
  )
}

/** Importar: seta para cima saindo de uma bandeja. */
function ImportarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 11.5v-9M5.5 6 9 2.5 12.5 6" />
      <path d="M2.5 11.5V15h13v-3.5" />
    </IconBase>
  )
}

/** Configurações: engrenagem. */
function ConfiguracoesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="2.2" />
      <circle cx="9" cy="9" r="5" />
      <path d="M9 1.8V4M9 14v2.2M1.8 9H4M14 9h2.2M3.9 3.9l1.6 1.6M12.5 12.5l1.6 1.6M3.9 14.1l1.6-1.6M12.5 5.5l1.6-1.6" />
    </IconBase>
  )
}

/** Sair: seta saindo de uma porta. */
function SairIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 2.5H3v13h4" />
      <path d="M11.5 5.5 15 9l-3.5 3.5M15 9H6.5" />
    </IconBase>
  )
}

export {
  WarningIcon,
  InfoIcon,
  ErrorIcon,
  CheckIcon,
  PainelIcon,
  LancamentosIcon,
  NotasIcon,
  DasIcon,
  RegrasIcon,
  ImportarIcon,
  ConfiguracoesIcon,
  SairIcon,
}

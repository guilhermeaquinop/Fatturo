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

// --- Ícones da moldura do celular e do "ocultar valores". ---

/** Olho aberto: os valores estão visíveis. */
function OlhoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M1.9 9S4.5 4.1 9 4.1 16.1 9 16.1 9 13.5 13.9 9 13.9 1.9 9 1.9 9Z" />
      <circle cx="9" cy="9" r="2.25" />
    </IconBase>
  )
}

/** Olho riscado: os valores estão ocultos. */
function OlhoRiscadoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.4 4.4A7.2 7.2 0 0 1 9 4.1c4.5 0 7.1 4.9 7.1 4.9a12.8 12.8 0 0 1-2 2.6M5 5.3A12.5 12.5 0 0 0 1.9 9S4.5 13.9 9 13.9a6.8 6.8 0 0 0 3.5-.9M7.4 7.4a2.25 2.25 0 0 0 3.2 3.2M3 3l12 12" />
    </IconBase>
  )
}

/** Mais: três pontos, para a folha com as outras páginas. */
function MaisIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="4.1" cy="9" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="13.9" cy="9" r="1.05" fill="currentColor" stroke="none" />
    </IconBase>
  )
}

/** Voltar: seta para a esquerda. */
function VoltarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14.6 9H3.4M7.9 4.5 3.4 9l4.5 4.5" />
    </IconBase>
  )
}

/** Fechar: um x. */
function FecharIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
    </IconBase>
  )
}

export {
  OlhoIcon,
  OlhoRiscadoIcon,
  MaisIcon,
  VoltarIcon,
  FecharIcon,
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

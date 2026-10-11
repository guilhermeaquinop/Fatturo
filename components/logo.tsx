// Logo do Fatturo: símbolo e logotipo desenhados em SVG, nas cores dos tokens.
// Equivale a um componente Blade <x-logo />. Os arquivos originais ficam em
// docs/design-system/logo/; aqui o desenho é o mesmo, com as cores vindas das classes.
import { cn } from "@/lib/utils";

type LogoProps = {
  /** "claro": sobre fundo claro (traço ink). "escuro": sobre fundo ink (traço branco). */
  tom?: "claro" | "escuro";
  /** A altura vem da classe (ex.: h-7); a largura acompanha a proporção. */
  className?: string;
};

// O símbolo é feito de formas preenchidas; as letras, de traços sem preenchimento.
const CORES = {
  claro: {
    forma: "fill-ink",
    formaDestaque: "fill-accent-strong",
    traco: "stroke-ink",
    tracoDestaque: "stroke-accent-strong",
  },
  escuro: {
    forma: "fill-on-ink",
    formaDestaque: "fill-accent",
    traco: "stroke-on-ink",
    tracoDestaque: "stroke-accent",
  },
};

/** Símbolo e nome lado a lado. Usado nos cabeçalhos, no menu e nas telas de acesso. */
export function Logo({ tom = "claro", className }: LogoProps) {
  const cor = CORES[tom];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 345 72"
      role="img"
      aria-label="Fatturo"
      className={cn("h-7 w-auto flex-none", className)}
    >
      <g transform="scale(1.5)">
        <rect x="13" y="14" width="7" height="26" rx="3.5" className={cor.forma} />
        <rect x="28" y="8" width="7" height="32" rx="3.5" className={cor.forma} />
        <rect x="7" y="18" width="34" height="6" rx="3" className={cor.formaDestaque} />
      </g>
      <g
        transform="translate(90 10) scale(1.12832)"
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className={cor.traco}>
          <path d="M4 40V6H22" />
          <path d="M4 22H19" />
          <circle cx="46" cy="28" r="12" />
          <path d="M58 16V40" />
          <path d="M78 6V30A10 10 0 0 0 88 40H90" />
          <path d="M104 6V30A10 10 0 0 0 114 40H116" />
          <path d="M132 16V28A12 12 0 0 0 156 28" />
          <path d="M156 16V40" />
          <path d="M172 40V16" />
          <path d="M172 28A12 12 0 0 1 184 16H186" />
          <circle cx="206" cy="28" r="12" />
        </g>
        <path d="M70 16H118" className={cor.tracoDestaque} />
      </g>
    </svg>
  );
}

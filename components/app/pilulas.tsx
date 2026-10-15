// Pílulas de escolha que são links (?ano=2025, ?situacao=cancelada). Equivale a um componente
// Blade <x-pilulas>. No celular dividem a largura por igual, numa linha só; a partir de 1024 px
// voltam ao tamanho do texto. Por serem links, o voltar do navegador funciona.
import Link from "next/link";
import { cn } from "@/lib/utils";

type Opcao = { rotulo: string; href: string; atual: boolean };

type PilulasProps = {
  /** Nome do grupo para leitor de tela, como "Ano" ou "Situação". */
  rotulo: string;
  opcoes: Opcao[];
  className?: string;
};

export function Pilulas({ rotulo, opcoes, className }: PilulasProps) {
  return (
    <nav
      aria-label={rotulo}
      className={cn("grid auto-cols-fr grid-flow-col gap-1 lg:flex lg:flex-wrap lg:gap-2", className)}
    >
      {opcoes.map((opcao) => (
        <Link
          key={opcao.rotulo}
          href={opcao.href}
          aria-current={opcao.atual ? "page" : undefined}
          className={cn(
            "flex min-h-control-sm items-center justify-center rounded-pill px-2 font-medium whitespace-nowrap text-ink-muted lg:px-4",
            "aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink",
          )}
        >
          {opcao.rotulo}
        </Link>
      ))}
    </nav>
  );
}

type SeletorDeAnoProps = {
  anos: number[];
  /** Ano marcado como atual. */
  ano: number;
  /** Endereço de cada opção (o ano corrente costuma ficar sem ?ano=). */
  href: (ano: number) => string;
  className?: string;
};

/** As pílulas de ano do painel e do DAS. */
export function SeletorDeAno({ anos, ano, href, className }: SeletorDeAnoProps) {
  return (
    <Pilulas
      rotulo="Ano"
      opcoes={anos.map((opcao) => ({ rotulo: String(opcao), href: href(opcao), atual: opcao === ano }))}
      className={className}
    />
  );
}

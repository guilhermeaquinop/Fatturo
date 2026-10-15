// Valor em reais que respeita o "ocultar valores". Equivale a um componente Blade <x-valor>.
// O texto real vai no HTML; com <html data-valores="ocultos">, o CSS de app/globals.css troca
// o que aparece por "R$ •••••". Como não depende de JavaScript, serve em páginas do servidor.
import { formatarReais, formatarReaisInteiros } from "@/lib/dinheiro";
import { cn } from "@/lib/utils";

type ValorProps = {
  centavos: number;
  /** "inteiro" tira os centavos (R$ 81.000), como nos números grandes do painel. */
  formato?: "centavos" | "inteiro";
  className?: string;
};

export function Valor({ centavos, formato = "centavos", className }: ValorProps) {
  const texto = formato === "inteiro" ? formatarReaisInteiros(centavos) : formatarReais(centavos);
  return (
    <span data-valor className={cn("whitespace-nowrap", className)}>
      <span data-valor-real>{texto}</span>
    </span>
  );
}

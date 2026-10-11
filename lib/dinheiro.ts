// Formatação de dinheiro. Equivale a um helper de formatação (ou a um cast de Money) no Laravel.
// Valores são sempre inteiros em centavos; só viram texto em reais na hora de exibir.

const REAIS = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const REAIS_SEM_CENTAVOS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const NUMERO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

// O Intl separa "R$" do número com um espaço não separável; troca por espaço comum
// para o texto ficar igual ao digitado nos testes e nas buscas.
function normalizar(texto: string): string {
  return texto.replace(/ /g, " ");
}

/** 8605 vira "R$ 86,05". */
export function formatarReais(centavos: number): string {
  return normalizar(REAIS.format(centavos / 100));
}

/** 8100000 vira "R$ 81.000": para valores grandes do painel, sem centavos. */
export function formatarReaisInteiros(centavos: number): string {
  return normalizar(REAIS_SEM_CENTAVOS.format(Math.round(centavos / 100)));
}

/** 8100000 vira "R$ 81 mil" e 480000000 vira "R$ 4,8 milhões": para textos curtos. */
export function formatarReaisCurto(centavos: number): string {
  const reais = centavos / 100;
  if (reais >= 1_000_000) {
    const milhoes = reais / 1_000_000;
    return `R$ ${NUMERO.format(milhoes)} ${milhoes === 1 ? "milhão" : "milhões"}`;
  }
  if (reais >= 1_000) return `R$ ${NUMERO.format(reais / 1_000)} mil`;
  return formatarReais(centavos);
}

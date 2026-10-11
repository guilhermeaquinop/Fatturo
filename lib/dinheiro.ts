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

/**
 * Converte um decimal em texto ("3200.00", "7500.5", "150") em centavos inteiros.
 * Trabalha só com texto e inteiros, sem passar por float. Devolve null se não for um valor válido.
 */
export function centavosDeDecimal(valor: string): number | null {
  const partes = /^(\d{1,13})(?:\.(\d{1,2}))?$/.exec(valor.trim());
  if (!partes) return null;
  return Number(partes[1]) * 100 + Number((partes[2] ?? "").padEnd(2, "0"));
}

/**
 * Converte um valor escrito como num extrato ou num formulário em centavos inteiros, com sinal.
 * Aceita "1.234,56", "1234.56", "R$ 1.234,56", "-50,00", "50,00-", "(50,00)" e "50,00 D".
 * Trabalha só com texto e inteiros, sem passar por float. Devolve null se não for um valor válido.
 */
export function centavosDeTexto(valor: string): number | null {
  let texto = valor.replace(/[\s\u00a0]/g, "").replace(/R\$/i, "");
  if (texto === "") return null;

  // Sinal: menos na frente ou atrás, parênteses ou "D" de débito. "C" de crédito é positivo.
  let negativo = false;
  if (/^\(.*\)$/.test(texto)) {
    negativo = true;
    texto = texto.slice(1, -1);
  }
  if (/[dD]$/.test(texto)) negativo = true;
  texto = texto.replace(/[cCdD]$/, "");
  if (texto.startsWith("-") || texto.endsWith("-")) negativo = true;
  texto = texto.replace(/^[+-]/, "").replace(/-$/, "");
  if (!/^\d[\d.,]*$/.test(texto)) return null;

  // O separador decimal é o último ponto ou vírgula, se depois dele vierem 1 ou 2 dígitos.
  // "1.234" e "1,234" (3 dígitos depois) são milhares, sem centavos.
  const ultimo = Math.max(texto.lastIndexOf(","), texto.lastIndexOf("."));
  let inteiros = texto;
  let decimais = "";
  if (ultimo !== -1) {
    const depois = texto.slice(ultimo + 1);
    const separador = texto[ultimo];
    const repetido = texto.indexOf(separador) !== ultimo;
    if (depois.length >= 1 && depois.length <= 2 && !repetido) {
      inteiros = texto.slice(0, ultimo);
      decimais = depois;
    } else if (depois.length !== 3) {
      return null;
    }
  }

  // O que sobra na parte inteira são separadores de milhar: grupos de 3 dígitos.
  if (/[.,]/.test(inteiros) && !/^\d{1,3}([.,]\d{3})+$/.test(inteiros)) return null;
  const digitos = inteiros.replace(/[.,]/g, "");
  if (digitos === "" || digitos.length > 13) return null;

  const centavos = Number(digitos) * 100 + Number(decimais.padEnd(2, "0"));
  return negativo ? -centavos : centavos;
}

/** 8605 vira "86,05": para preencher um campo de valor num formulário. */
export function formatarValorParaCampo(centavos: number): string {
  return normalizar(REAIS.format(centavos / 100)).replace(/^R\$\s?/, "");
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

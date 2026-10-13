// Regras do DAS: vencimento padrão, situação de cada guia, valor sugerido e resumo do ano.
// Equivale a uma classe de Service/Domain no Laravel: funções puras, sem banco e sem tela.
// Valores sempre em centavos inteiros; a alíquota chega por parâmetro, vinda da tabela `parametro`.
import { anoDe, mesDe } from "@/lib/datas";
import { enquadramentoEm, type Periodo } from "@/lib/regras/enquadramento";
import { deslocarMes, limitesDoMes } from "@/lib/regras/lancamentos";
import type { Porte } from "@/lib/regras/limite";

/**
 * - paga: tem data de pagamento.
 * - a_vencer: o mês de competência ainda não terminou; a guia nem pode ser gerada.
 * - pendente: o mês terminou, a guia não foi paga e ainda não venceu.
 * - vencida: tem valor informado e passou do vencimento sem pagamento.
 * - sem_valor: passou do vencimento e nada foi informado. Não é tratada como atraso: é o
 *   caso dos meses antigos, anteriores ao uso do Fatturo, que o usuário ainda não registrou.
 */
export type SituacaoDaGuia = "paga" | "a_vencer" | "pendente" | "vencida" | "sem_valor";

/** Guia como está gravada no banco. */
export type GuiaSalva = {
  /** Mês de competência, "aaaa-mm". */
  competencia: string;
  vencimento: string;
  valorCentavos: number | null;
  pagoEm: string | null;
};

/** Um mês do DAS como aparece na tela, com ou sem guia gravada. */
export type MesDoDas = GuiaSalva & {
  /** 1 a 12. */
  mes: number;
  situacao: SituacaoDaGuia;
  /** Faturamento do mês, base do DAS da ME. */
  receitaCentavos: number;
  /** Porte em vigor no mês: o DAS do MEI é fixo, o da ME varia com a receita. */
  porte: Porte;
  /** Valor sugerido para a guia da ME, ou null quando não há sugestão. */
  sugestaoCentavos: number | null;
};

const DOMINGO = 0;
const SABADO = 6;

/**
 * Vencimento padrão do DAS: o dia `dia` do mês seguinte à competência; se cair em sábado ou
 * domingo, a segunda-feira seguinte. Feriados não são considerados (a data é editável).
 */
export function vencimentoPadrao(competencia: string, dia: number): string {
  const [ano, mes] = deslocarMes(competencia, 1).split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCDay() === SABADO) data.setUTCDate(data.getUTCDate() + 2);
  if (data.getUTCDay() === DOMINGO) data.setUTCDate(data.getUTCDate() + 1);
  return data.toISOString().slice(0, 10);
}

/** Situação da guia na data de hoje. */
export function situacaoDaGuia(
  guia: GuiaSalva,
  hoje: string,
): SituacaoDaGuia {
  if (guia.pagoEm) return "paga";
  if (hoje <= limitesDoMes(guia.competencia).ate) return "a_vencer";
  if (hoje <= guia.vencimento) return "pendente";
  return guia.valorCentavos === null ? "sem_valor" : "vencida";
}

/**
 * Valor sugerido do DAS: receita do mês vezes a alíquota, que vem em centésimos de por cento
 * (600 = 6,00%). Só inteiros: R$ 15.575,00 a 6% dá R$ 934,50.
 */
export function valorSugerido(receitaCentavos: number, aliquota: number): number {
  return Math.round((receitaCentavos * aliquota) / 10000);
}

/** Dias inteiros de `de` até `ate` (negativo se `ate` já passou). */
export function diasEntre(de: string, ate: string): number {
  const dia = (iso: string) => Date.UTC(anoDe(iso), mesDe(iso) - 1, Number(iso.slice(8, 10)));
  return Math.round((dia(ate) - dia(de)) / 86_400_000);
}

/**
 * Os meses do DAS de um ano, de janeiro (ou do mês de abertura) a dezembro. Mês com guia
 * gravada usa os dados dela; os outros aparecem com o vencimento padrão e sem valor.
 *
 * A sugestão de valor só existe para mês de ME, já encerrado, com receita e ainda sem valor
 * informado, e enquanto `sugerir` for verdadeiro (a alíquota sugerida vale até um teto de
 * receita em 12 meses, conferido por quem chama).
 */
export function mesesDoDas(entrada: {
  ano: number;
  dataAbertura: string;
  hoje: string;
  guias: GuiaSalva[];
  /** Faturamento de cada mês do ano: 12 posições, janeiro na posição 0. */
  receitaPorMes: number[];
  periodos: Periodo[];
  diaDeVencimento: number;
  aliquotaSugerida: number;
  sugerir: boolean;
}): MesDoDas[] {
  const { ano, dataAbertura, hoje, guias, receitaPorMes, periodos } = entrada;
  const primeiroMes = anoDe(dataAbertura) === ano ? mesDe(dataAbertura) : 1;
  if (anoDe(dataAbertura) > ano) return [];

  const salvas = new Map(guias.map((guia) => [guia.competencia, guia]));
  const meses: MesDoDas[] = [];

  for (let mes = primeiroMes; mes <= 12; mes++) {
    const competencia = `${ano}-${String(mes).padStart(2, "0")}`;
    const guia = salvas.get(competencia) ?? {
      competencia,
      vencimento: vencimentoPadrao(competencia, entrada.diaDeVencimento),
      valorCentavos: null,
      pagoEm: null,
    };
    const situacao = situacaoDaGuia(guia, hoje);
    const receitaCentavos = receitaPorMes[mes - 1] ?? 0;
    // Porte no último dia do mês: quem virou ME em julho paga julho como ME.
    const { porte } = enquadramentoEm(periodos, limitesDoMes(competencia).ate);
    const cabeSugestao =
      entrada.sugerir &&
      porte === "ME" &&
      situacao !== "a_vencer" &&
      guia.valorCentavos === null &&
      receitaCentavos > 0;

    meses.push({
      ...guia,
      mes,
      situacao,
      receitaCentavos,
      porte,
      sugestaoCentavos: cabeSugestao ? valorSugerido(receitaCentavos, entrada.aliquotaSugerida) : null,
    });
  }
  return meses;
}

export type ResumoDoDas = {
  /** Soma das guias pagas no ano. */
  pagoCentavos: number;
  pagas: number;
  /** Guias com valor informado, vencidas sem pagamento. */
  vencidas: MesDoDas[];
  /** Guias de mês encerrado, ainda dentro do prazo. */
  pendentes: MesDoDas[];
  /** A guia em aberto que vence primeiro (vencida ou pendente), ou null. */
  proxima: MesDoDas | null;
};

/** Totais do ano e a próxima guia a pagar. */
export function resumoDoDas(meses: MesDoDas[]): ResumoDoDas {
  const pagas = meses.filter((mes) => mes.situacao === "paga");
  const vencidas = meses.filter((mes) => mes.situacao === "vencida");
  const pendentes = meses.filter((mes) => mes.situacao === "pendente");
  const emAberto = [...vencidas, ...pendentes].sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  return {
    pagoCentavos: pagas.reduce((soma, mes) => soma + (mes.valorCentavos ?? 0), 0),
    pagas: pagas.length,
    vencidas,
    pendentes,
    proxima: emAberto[0] ?? null,
  };
}

/**
 * DAS pago acumulado por mês de competência, para o gráfico: 12 posições, janeiro na
 * posição 0. Fica null depois do mês de `ate` (os meses que ainda não chegaram).
 */
export function dasPagoAcumulado(meses: MesDoDas[], ateMes: number): (number | null)[] {
  const porMes = new Array<number>(12).fill(0);
  for (const mes of meses) {
    if (mes.situacao === "paga") porMes[mes.mes - 1] += mes.valorCentavos ?? 0;
  }
  let total = 0;
  return porMes.map((valor, indice) => {
    total += valor;
    return indice < ateMes ? total : null;
  });
}

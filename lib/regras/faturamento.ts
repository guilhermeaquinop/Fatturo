// Regras de cálculo do painel: faturamento por mês, acumulado, projeção, receita de 12 meses
// e origem do faturamento. Equivale a uma classe de Service/Domain no Laravel: funções puras,
// sem banco e sem tela. Valores sempre em centavos inteiros.
//
// Nesta etapa o faturamento vem das NFS-e emitidas, posicionadas pela data de competência.
// Notas canceladas não contam. Recebimentos sem nota entram na etapa 4.
import { anoDe, mesDe } from "@/lib/datas";

export type NotaDoPainel = {
  /** Competência da nota, "aaaa-mm-dd". */
  dataCompetencia: string;
  valorCentavos: number;
  situacao: "emitida" | "cancelada";
  tomadorNome: string | null;
  tomadorDoc: string | null;
};

const MESES_NO_ANO = 12;

function conta(nota: NotaDoPainel): boolean {
  return nota.situacao === "emitida";
}

/** Faturamento de cada mês do ano: 12 posições, janeiro na posição 0. */
export function faturamentoPorMes(notas: NotaDoPainel[], ano: number): number[] {
  const porMes = new Array<number>(MESES_NO_ANO).fill(0);
  for (const nota of notas) {
    if (!conta(nota) || anoDe(nota.dataCompetencia) !== ano) continue;
    porMes[mesDe(nota.dataCompetencia) - 1] += nota.valorCentavos;
  }
  return porMes;
}

/** Soma corrida: [10, 20, 5] vira [10, 30, 35]. */
export function acumular(valores: number[]): number[] {
  let total = 0;
  return valores.map((valor) => (total += valor));
}

export type Projecao = {
  /** Último mês fechado do ano (1 a 12), ou 0 se nenhum fechou. */
  ultimoMesFechado: number;
  /** Faturamento projetado até dezembro, ou null se não há base para projetar. */
  valorCentavos: number | null;
};

/**
 * Projeção até dezembro (especificação, "Projeção e alertas"):
 * acumulado até o último mês fechado + média mensal dos meses fechados × meses restantes.
 *
 * - Mês fechado é todo mês anterior ao mês de hoje.
 * - No ano de abertura, a média considera só os meses desde a abertura.
 * - Ano passado: tudo fechado, a "projeção" é o total do ano. Ano futuro: sem projeção.
 * - A projeção nunca fica abaixo do que já foi faturado no ano.
 */
export function projetar(entrada: {
  porMes: number[];
  ano: number;
  hoje: string;
  dataAbertura: string;
}): Projecao {
  const { porMes, ano, hoje, dataAbertura } = entrada;
  const total = porMes.reduce((soma, valor) => soma + valor, 0);

  if (ano < anoDe(hoje)) return { ultimoMesFechado: MESES_NO_ANO, valorCentavos: total };
  if (ano > anoDe(hoje)) return { ultimoMesFechado: 0, valorCentavos: null };

  const ultimoMesFechado = mesDe(hoje) - 1;
  const primeiroMes = anoDe(dataAbertura) === ano ? mesDe(dataAbertura) : 1;
  const mesesFechados = ultimoMesFechado - primeiroMes + 1;
  if (mesesFechados <= 0) return { ultimoMesFechado, valorCentavos: null };

  const acumuladoFechado = porMes
    .slice(0, ultimoMesFechado)
    .reduce((soma, valor) => soma + valor, 0);
  const mesesRestantes = MESES_NO_ANO - ultimoMesFechado;
  const projetado = Math.round(
    acumuladoFechado + (acumuladoFechado / mesesFechados) * mesesRestantes,
  );

  return { ultimoMesFechado, valorCentavos: Math.max(projetado, total) };
}

export type SerieDoGrafico = {
  /** Acumulado de cada mês; null nos meses que ainda não chegaram. */
  acumulado: (number | null)[];
  /** Trecho projetado, do mês atual até dezembro; null fora dele. */
  projecao: (number | null)[];
  /** Posição (0 a 11) do valor mais recente, ou null se o ano ainda não começou. */
  indiceAtual: number | null;
};

/**
 * Séries do gráfico de acumulado. No ano corrente, a linha cheia vai até o mês de hoje e a
 * projeção liga o acumulado de hoje ao valor projetado para dezembro, em linha reta.
 */
export function serieDoGrafico(entrada: {
  porMes: number[];
  ano: number;
  hoje: string;
  projecaoCentavos: number | null;
}): SerieDoGrafico {
  const { porMes, ano, hoje, projecaoCentavos } = entrada;
  const acumulado = acumular(porMes);
  const vazio = new Array<number | null>(MESES_NO_ANO).fill(null);

  if (ano < anoDe(hoje)) return { acumulado, projecao: vazio, indiceAtual: MESES_NO_ANO - 1 };
  if (ano > anoDe(hoje)) return { acumulado: vazio, projecao: vazio, indiceAtual: null };

  const indiceAtual = mesDe(hoje) - 1;
  const ultimo = MESES_NO_ANO - 1;
  const atual = acumulado[indiceAtual];

  return {
    acumulado: acumulado.map((valor, indice) => (indice <= indiceAtual ? valor : null)),
    projecao: vazio.map((_, indice) => {
      if (projecaoCentavos === null || indiceAtual === ultimo || indice < indiceAtual) return null;
      const avanco = (indice - indiceAtual) / (ultimo - indiceAtual);
      return Math.round(atual + (projecaoCentavos - atual) * avanco);
    }),
    indiceAtual,
  };
}

/**
 * Receita dos 12 meses anteriores ao mês de hoje (RBT12), que define a faixa do Simples.
 * Em outubro de 2026, soma de outubro de 2025 a setembro de 2026.
 */
export function receitaUltimos12Meses(notas: NotaDoPainel[], hoje: string): number {
  // Meses contados desde o ano zero, para comparar sem montar datas.
  const indice = (data: string) => anoDe(data) * MESES_NO_ANO + (mesDe(data) - 1);
  const mesAtual = indice(hoje);

  return notas
    .filter((nota) => {
      const mes = indice(nota.dataCompetencia);
      return conta(nota) && mes >= mesAtual - MESES_NO_ANO && mes < mesAtual;
    })
    .reduce((soma, nota) => soma + nota.valorCentavos, 0);
}

/** Quanto do limite já foi usado, em porcentagem (pode passar de 100). */
export function percentualDoLimite(acumuladoCentavos: number, limiteCentavos: number): number {
  if (limiteCentavos <= 0) return 0;
  return (acumuladoCentavos * 100) / limiteCentavos;
}

export type Origem = {
  nome: string;
  valorCentavos: number;
  /** Participação no faturamento do ano, em porcentagem inteira. */
  percentual: number;
};

const SEM_TOMADOR = "Tomador não identificado";

/**
 * Origem do faturamento do ano por tomador, do maior para o menor.
 * Mostra os `maximo` primeiros e junta o restante em "Outros".
 */
export function origemDoFaturamento(notas: NotaDoPainel[], ano: number, maximo = 4): Origem[] {
  const porTomador = new Map<string, { nome: string; valorCentavos: number }>();

  for (const nota of notas) {
    if (!conta(nota) || anoDe(nota.dataCompetencia) !== ano) continue;
    // Agrupa pelo documento; sem documento, pelo nome.
    const chave = nota.tomadorDoc ?? nota.tomadorNome ?? SEM_TOMADOR;
    const grupo = porTomador.get(chave) ?? { nome: nota.tomadorNome ?? SEM_TOMADOR, valorCentavos: 0 };
    grupo.valorCentavos += nota.valorCentavos;
    porTomador.set(chave, grupo);
  }

  const total = [...porTomador.values()].reduce((soma, grupo) => soma + grupo.valorCentavos, 0);
  if (total === 0) return [];

  const ordenados = [...porTomador.values()].sort((a, b) => b.valorCentavos - a.valorCentavos);
  const principais = ordenados.slice(0, maximo);
  const restante = ordenados.slice(maximo).reduce((soma, grupo) => soma + grupo.valorCentavos, 0);
  if (restante > 0) principais.push({ nome: "Outros", valorCentavos: restante });

  return principais.map((grupo) => ({
    ...grupo,
    percentual: Math.round((grupo.valorCentavos * 100) / total),
  }));
}

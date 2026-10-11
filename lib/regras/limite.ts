// Regra de cálculo: limite de faturamento do ano, proporcional no ano de abertura.
// Equivale a uma classe de Service/Domain no Laravel: função pura, sem banco e sem tela.
// Os valores legais chegam por parâmetro, vindos da tabela `parametro`; nada fica fixo aqui.
import { anoDe, mesDe } from "@/lib/datas";

export type Porte = "MEI" | "ME";

/** Valores vigentes da tabela `parametro`, por chave, em centavos. */
export type Parametros = Record<string, number>;

function parametro(parametros: Parametros, chave: string): number {
  const valor = parametros[chave];
  if (valor === undefined) throw new Error(`Parâmetro "${chave}" não encontrado para a vigência.`);
  return valor;
}

/**
 * Meses de atividade no ano. O mês de abertura conta inteiro, qualquer que seja o dia.
 * Empresa aberta em ano anterior tem 12; aberta em ano posterior, 0.
 */
export function mesesDeAtividade(dataAbertura: string, ano: number): number {
  const anoAbertura = anoDe(dataAbertura);
  if (anoAbertura < ano) return 12;
  if (anoAbertura > ano) return 0;
  return 12 - mesDe(dataAbertura) + 1;
}

/**
 * Limite de faturamento do ano, em centavos.
 * - Ano cheio: limite anual do porte.
 * - Ano de abertura: MEI usa o valor mensal da tabela vezes os meses de atividade;
 *   ME usa 1/12 do limite anual por mês de atividade.
 */
export function limiteDoAno(entrada: {
  porte: Porte;
  dataAbertura: string;
  ano: number;
  parametros: Parametros;
}): number {
  const { porte, dataAbertura, ano, parametros } = entrada;
  const meses = mesesDeAtividade(dataAbertura, ano);

  if (porte === "MEI") {
    if (meses === 12) return parametro(parametros, "limite_anual_mei");
    return parametro(parametros, "limite_mensal_proporcional_mei") * meses;
  }

  const anual = parametro(parametros, "limite_anual_me");
  return meses === 12 ? anual : Math.round((anual * meses) / 12);
}

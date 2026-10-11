// Regra de cálculo: qual enquadramento (MEI ou ME) vale em cada data, pelo histórico da empresa.
// Equivale a uma classe de Service/Domain no Laravel: funções puras, sem banco e sem tela.
// O histórico vem da tabela `enquadramento`, um período por linha.
import { anoDe } from "@/lib/datas";
import type { Porte } from "@/lib/regras/limite";

export type Periodo = {
  porte: Porte;
  /** Primeiro dia do período, "aaaa-mm-dd". */
  inicioEm: string;
  /** Último dia do período, ou null se ainda está em vigor. */
  fimEm: string | null;
};

/**
 * Enquadramento em vigor na data. Data anterior ao primeiro período vale o primeiro;
 * data sem período (não deveria acontecer) vale o mais recente.
 */
export function enquadramentoEm<T extends Periodo>(periodos: T[], data: string): T {
  if (periodos.length === 0) throw new Error("Empresa sem enquadramento.");
  const ordenados = [...periodos].sort((a, b) => a.inicioEm.localeCompare(b.inicioEm));
  if (data < ordenados[0].inicioEm) return ordenados[0];

  const vigente = ordenados.find(
    (periodo) => periodo.inicioEm <= data && (periodo.fimEm === null || periodo.fimEm >= data),
  );
  return vigente ?? ordenados[ordenados.length - 1];
}

/**
 * Mudança de porte dentro do ano, até a data de referência: devolve o porte anterior e o
 * último dia em que ele valeu. Null se o porte foi o mesmo o ano inteiro.
 *
 * No ano da mudança o painel usa o limite do porte em vigor na data de referência, contra o
 * faturamento do ano inteiro, e mostra um aviso com o que esta função devolve.
 */
export function mudancaDePorteNoAno(
  periodos: Periodo[],
  ano: number,
  referencia: string,
): { porteAnterior: Porte; ate: string } | null {
  const atual = enquadramentoEm(periodos, referencia);
  const anteriores = periodos
    .filter(
      (periodo) =>
        periodo.fimEm !== null &&
        anoDe(periodo.fimEm) === ano &&
        periodo.fimEm < referencia &&
        periodo.porte !== atual.porte,
    )
    .sort((a, b) => (b.fimEm as string).localeCompare(a.fimEm as string));

  const ultimo = anteriores[0];
  return ultimo ? { porteAnterior: ultimo.porte, ate: ultimo.fimEm as string } : null;
}

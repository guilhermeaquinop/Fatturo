// Regras da tela de Notas: números que faltam na sequência, filtro e totais.
// Equivale a uma classe de Service/Domain no Laravel: funções puras, sem banco e sem tela.
import { anoDe } from "@/lib/datas";

export type SituacaoDaNota = "emitida" | "cancelada";

/** Filtro de situação: uma situação ou null (todas). */
export type FiltroDeSituacao = SituacaoDaNota | null;

type ParaTotais = { valorCentavos: number; situacao: SituacaoDaNota };

/**
 * Números que faltam entre a nota 1 e a maior importada. A NFS-e é numerada em sequência,
 * então um buraco indica uma nota cancelada ou que ainda não foi importada.
 * Números que não são inteiros positivos são ignorados.
 */
export function numerosFaltando(numeros: string[]): number[] {
  const presentes = new Set(
    numeros.filter((numero) => /^\d{1,9}$/.test(numero)).map(Number).filter((numero) => numero > 0),
  );
  if (presentes.size === 0) return [];

  const maior = Math.max(...presentes);
  const faltando: number[] = [];
  for (let numero = 1; numero < maior; numero++) {
    if (!presentes.has(numero)) faltando.push(numero);
  }
  return faltando;
}

/** Junta números numa frase: [1] vira "1"; [1, 8, 35] vira "1, 8 e 35". */
export function listarNumeros(numeros: number[]): string {
  if (numeros.length <= 1) return numeros.join("");
  return `${numeros.slice(0, -1).join(", ")} e ${numeros[numeros.length - 1]}`;
}

/** Anos que têm nota, pela competência, do mais antigo ao mais recente. */
export function anosComNota(notas: { dataCompetencia: string }[]): number[] {
  return [...new Set(notas.map((nota) => anoDe(nota.dataCompetencia)))].sort((a, b) => a - b);
}

/** Lê o filtro de situação da URL; qualquer valor desconhecido vira "todas". */
export function filtroDeSituacao(valor: unknown): FiltroDeSituacao {
  return valor === "emitida" || valor === "cancelada" ? valor : null;
}

/** Filtros da lista de notas. Null em um campo significa "sem filtro". */
export type FiltrosDeNotas = {
  ano: number | null;
  situacao: FiltroDeSituacao;
  /** Chave do tomador, como devolvida por chaveDoTomador(). */
  tomador: string | null;
  /** Datas "aaaa-mm-dd", inclusive nas duas pontas. */
  competenciaDe: string | null;
  competenciaAte: string | null;
  emissaoDe: string | null;
  emissaoAte: string | null;
  valorMinimoCentavos: number | null;
  valorMaximoCentavos: number | null;
};

type ParaFiltrar = ParaTotais & {
  dataCompetencia: string;
  dataEmissao: string;
  tomadorNome: string | null;
  tomadorDoc: string | null;
};

const SEM_TOMADOR = "sem-tomador";

/** Identifica o tomador de uma nota: o documento, na falta dele o nome, ou "sem-tomador". */
export function chaveDoTomador(nota: { tomadorNome: string | null; tomadorDoc: string | null }): string {
  return nota.tomadorDoc ?? nota.tomadorNome ?? SEM_TOMADOR;
}

/** Tomadores que aparecem nas notas, sem repetir, em ordem alfabética. */
export function tomadores(
  notas: { tomadorNome: string | null; tomadorDoc: string | null }[],
): { chave: string; nome: string }[] {
  const porChave = new Map<string, string>();
  for (const nota of notas) {
    const chave = chaveDoTomador(nota);
    if (!porChave.has(chave)) porChave.set(chave, nota.tomadorNome ?? "Tomador não identificado");
  }
  return [...porChave.entries()]
    .map(([chave, nome]) => ({ chave, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Aplica todos os filtros de uma vez; a nota precisa passar em cada um que estiver preenchido. */
export function filtrarNotas<T extends ParaFiltrar>(notas: T[], filtros: FiltrosDeNotas): T[] {
  return notas.filter(
    (nota) =>
      (filtros.ano === null || anoDe(nota.dataCompetencia) === filtros.ano) &&
      (filtros.situacao === null || nota.situacao === filtros.situacao) &&
      (filtros.tomador === null || chaveDoTomador(nota) === filtros.tomador) &&
      (filtros.competenciaDe === null || nota.dataCompetencia >= filtros.competenciaDe) &&
      (filtros.competenciaAte === null || nota.dataCompetencia <= filtros.competenciaAte) &&
      (filtros.emissaoDe === null || nota.dataEmissao >= filtros.emissaoDe) &&
      (filtros.emissaoAte === null || nota.dataEmissao <= filtros.emissaoAte) &&
      (filtros.valorMinimoCentavos === null || nota.valorCentavos >= filtros.valorMinimoCentavos) &&
      (filtros.valorMaximoCentavos === null || nota.valorCentavos <= filtros.valorMaximoCentavos),
  );
}

export type TotaisDasNotas = {
  emitidas: number;
  canceladas: number;
  /** Soma das notas emitidas; as canceladas não entram no faturamento. */
  valorEmitidoCentavos: number;
};

/** Quantidade de notas por situação e o valor das emitidas. */
export function totaisDasNotas(notas: ParaTotais[]): TotaisDasNotas {
  const resultado: TotaisDasNotas = { emitidas: 0, canceladas: 0, valorEmitidoCentavos: 0 };
  for (const nota of notas) {
    if (nota.situacao === "cancelada") {
      resultado.canceladas += 1;
    } else {
      resultado.emitidas += 1;
      resultado.valorEmitidoCentavos += nota.valorCentavos;
    }
  }
  return resultado;
}

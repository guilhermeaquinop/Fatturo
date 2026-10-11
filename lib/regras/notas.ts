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

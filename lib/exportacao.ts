// Montagem dos arquivos CSV da exportação de dados. Equivale a uma classe de Export no Laravel
// (como as do pacote Laravel Excel): função pura, que recebe linhas e devolve o texto do arquivo.
//
// O formato é o que o Excel em português abre direto: ponto e vírgula entre as colunas,
// vírgula nos centavos, datas em dd/mm/aaaa e a marca BOM no começo, para os acentos.
import Papa from "papaparse";
import { formatarDataBr } from "@/lib/datas";

export type Celula = string | number | null;

const BOM = "﻿";

/** 123456 centavos vira "1234,56": número puro, sem "R$" nem ponto de milhar, para somar no Excel. */
export function valorParaCsv(centavos: number | null): string {
  if (centavos === null) return "";
  const sinal = centavos < 0 ? "-" : "";
  const absoluto = Math.abs(centavos);
  return `${sinal}${Math.floor(absoluto / 100)},${String(absoluto % 100).padStart(2, "0")}`;
}

/** "2026-10-02" vira "02/10/2026"; aceita também data com hora. Vazio para null. */
export function dataParaCsv(iso: string | null): string {
  return iso ? formatarDataBr(iso.slice(0, 10)) : "";
}

/**
 * Texto que começa com =, +, - ou @ é lido pelo Excel como fórmula. Como descrições de
 * extrato vêm de fora, um apóstrofo na frente faz o Excel tratar como texto.
 */
function semFormula(celula: Celula): Celula {
  return typeof celula === "string" && /^[=+\-@\t\r]/.test(celula) ? `'${celula}` : celula;
}

/** Monta o CSV com cabeçalho. `colunasDeTexto` protege só as colunas de texto livre. */
export function montarCsv(cabecalho: string[], linhas: Celula[][], colunasDeTexto: number[] = []): string {
  const protegidas = linhas.map((linha) =>
    linha.map((celula, indice) => (colunasDeTexto.includes(indice) ? semFormula(celula) : celula)),
  );
  const csv = Papa.unparse({ fields: cabecalho, data: protegidas }, { delimiter: ";", newline: "\r\n" });
  // Sem linhas, o Papa Parse deixa uma quebra sobrando depois do cabeçalho.
  return BOM + csv.trimEnd();
}

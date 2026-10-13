// Testes das regras da tela de Notas. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  anosComNota,
  filtrarNotas,
  filtroDeSituacao,
  listarNumeros,
  numerosFaltando,
  tomadores,
  totaisDasNotas,
  type FiltrosDeNotas,
} from "@/lib/regras/notas";

describe("numerosFaltando", () => {
  it("lista os buracos entre a nota 1 e a maior", () => {
    expect(numerosFaltando(["2", "3", "4", "6", "7"])).toEqual([1, 5]);
    expect(numerosFaltando(["1", "2", "3"])).toEqual([]);
  });

  it("não depende da ordem nem de números repetidos", () => {
    expect(numerosFaltando(["7", "2", "2", "4"])).toEqual([1, 3, 5, 6]);
  });

  it("ignora números que não são inteiros positivos", () => {
    expect(numerosFaltando(["A-12", "", "0", "3"])).toEqual([1, 2]);
    expect(numerosFaltando(["A-12"])).toEqual([]);
  });

  it("devolve vazio sem notas ou com a nota 1 sozinha", () => {
    expect(numerosFaltando([])).toEqual([]);
    expect(numerosFaltando(["1"])).toEqual([]);
  });

  it("aceita número com zeros à esquerda", () => {
    expect(numerosFaltando(["001", "003"])).toEqual([2]);
  });
});

describe("listarNumeros", () => {
  it("separa por vírgula e termina com e", () => {
    expect(listarNumeros([])).toBe("");
    expect(listarNumeros([1])).toBe("1");
    expect(listarNumeros([1, 8])).toBe("1 e 8");
    expect(listarNumeros([1, 8, 35, 37])).toBe("1, 8, 35 e 37");
  });
});

describe("anosComNota", () => {
  it("lista os anos de competência sem repetir, em ordem", () => {
    expect(
      anosComNota([
        { dataCompetencia: "2026-03-01" },
        { dataCompetencia: "2024-12-01" },
        { dataCompetencia: "2026-10-01" },
      ]),
    ).toEqual([2024, 2026]);
    expect(anosComNota([])).toEqual([]);
  });
});

describe("filtroDeSituacao", () => {
  it("reconhece as situações e trata o resto como todas", () => {
    expect(filtroDeSituacao("emitida")).toBe("emitida");
    expect(filtroDeSituacao("cancelada")).toBe("cancelada");
    expect(filtroDeSituacao("outra")).toBeNull();
    expect(filtroDeSituacao(undefined)).toBeNull();
  });
});

describe("totaisDasNotas", () => {
  it("conta por situação e soma só as emitidas", () => {
    expect(
      totaisDasNotas([
        { valorCentavos: 320000, situacao: "emitida" },
        { valorCentavos: 750000, situacao: "emitida" },
        { valorCentavos: 150000, situacao: "cancelada" },
      ]),
    ).toEqual({ emitidas: 2, canceladas: 1, valorEmitidoCentavos: 1070000 });
  });

  it("devolve zeros para lista vazia", () => {
    expect(totaisDasNotas([])).toEqual({ emitidas: 0, canceladas: 0, valorEmitidoCentavos: 0 });
  });
});

describe("tomadores e filtrarNotas", () => {
  const notas = [
    { numero: "1", dataCompetencia: "2025-12-01", dataEmissao: "2026-03-01", tomadorNome: "Beta Ltda", tomadorDoc: "22222222000122", valorCentavos: 325000, situacao: "emitida" },
    { numero: "2", dataCompetencia: "2026-01-01", dataEmissao: "2026-01-02", tomadorNome: "Alfa Ltda", tomadorDoc: "11111111000111", valorCentavos: 270000, situacao: "emitida" },
    { numero: "3", dataCompetencia: "2026-03-01", dataEmissao: "2026-03-31", tomadorNome: "Alfa Ltda", tomadorDoc: "11111111000111", valorCentavos: 750000, situacao: "cancelada" },
    { numero: "4", dataCompetencia: "2026-03-20", dataEmissao: "2026-03-20", tomadorNome: null, tomadorDoc: null, valorCentavos: 9312, situacao: "emitida" },
  ] as const;
  const semFiltro: FiltrosDeNotas = {
    ano: null,
    situacao: null,
    tomador: null,
    competenciaDe: null,
    competenciaAte: null,
    emissaoDe: null,
    emissaoAte: null,
    valorMinimoCentavos: null,
    valorMaximoCentavos: null,
  };
  const numeros = (filtros: Partial<FiltrosDeNotas>) =>
    filtrarNotas([...notas], { ...semFiltro, ...filtros }).map((nota) => nota.numero);

  it("lista os tomadores sem repetir, em ordem alfabética, com o não identificado", () => {
    expect(tomadores([...notas])).toEqual([
      { chave: "11111111000111", nome: "Alfa Ltda" },
      { chave: "22222222000122", nome: "Beta Ltda" },
      { chave: "sem-tomador", nome: "Tomador não identificado" },
    ]);
  });

  it("devolve tudo sem filtro", () => {
    expect(numeros({})).toEqual(["1", "2", "3", "4"]);
  });

  it("filtra por ano de competência, não de emissão", () => {
    expect(numeros({ ano: 2025 })).toEqual(["1"]);
    expect(numeros({ ano: 2026 })).toEqual(["2", "3", "4"]);
  });

  it("filtra por tomador, inclusive o não identificado", () => {
    expect(numeros({ tomador: "11111111000111" })).toEqual(["2", "3"]);
    expect(numeros({ tomador: "sem-tomador" })).toEqual(["4"]);
  });

  it("filtra por intervalo de competência e de emissão, com as pontas incluídas", () => {
    expect(numeros({ competenciaDe: "2026-01-01", competenciaAte: "2026-03-01" })).toEqual(["2", "3"]);
    expect(numeros({ competenciaAte: "2025-12-31" })).toEqual(["1"]);
    expect(numeros({ emissaoDe: "2026-03-01", emissaoAte: "2026-03-20" })).toEqual(["1", "4"]);
  });

  it("filtra por faixa de valor, com as pontas incluídas", () => {
    expect(numeros({ valorMinimoCentavos: 270000, valorMaximoCentavos: 325000 })).toEqual(["1", "2"]);
    expect(numeros({ valorMaximoCentavos: 10000 })).toEqual(["4"]);
    expect(numeros({ valorMinimoCentavos: 750001 })).toEqual([]);
  });

  it("combina os filtros: a nota precisa passar em todos", () => {
    expect(numeros({ ano: 2026, tomador: "11111111000111", situacao: "emitida" })).toEqual(["2"]);
    expect(numeros({ ano: 2026, situacao: "cancelada", valorMinimoCentavos: 1 })).toEqual(["3"]);
  });
});

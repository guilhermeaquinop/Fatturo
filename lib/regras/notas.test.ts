// Testes das regras da tela de Notas. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  anosComNota,
  filtroDeSituacao,
  listarNumeros,
  numerosFaltando,
  totaisDasNotas,
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

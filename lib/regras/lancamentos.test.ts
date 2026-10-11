// Testes das regras da tela de Lançamentos. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  deslocarMes,
  filtrarPorCategoria,
  filtroDeCategoria,
  limitesDoMes,
  mesValido,
  totais,
} from "@/lib/regras/lancamentos";

const lancamentos = [
  { valorCentavos: 320000, sentido: "entrada", categoria: "receita" },
  { valorCentavos: 15050, sentido: "entrada", categoria: null },
  { valorCentavos: 8990, sentido: "saida", categoria: "pessoal" },
  { valorCentavos: 93450, sentido: "saida", categoria: "imposto" },
  { valorCentavos: 1290, sentido: "saida", categoria: null },
] as const;

describe("mesValido", () => {
  it("aceita aaaa-mm e recusa o resto", () => {
    expect(mesValido("2026-10")).toBe(true);
    expect(mesValido("2026-13")).toBe(false);
    expect(mesValido("2026-00")).toBe(false);
    expect(mesValido("2026-1")).toBe(false);
    expect(mesValido("outubro")).toBe(false);
  });
});

describe("limitesDoMes", () => {
  it("devolve o primeiro e o último dia", () => {
    expect(limitesDoMes("2026-10")).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(limitesDoMes("2026-04")).toEqual({ de: "2026-04-01", ate: "2026-04-30" });
  });

  it("considera o ano bissexto em fevereiro", () => {
    expect(limitesDoMes("2026-02").ate).toBe("2026-02-28");
    expect(limitesDoMes("2028-02").ate).toBe("2028-02-29");
  });
});

describe("deslocarMes", () => {
  it("anda para trás e para a frente, virando o ano", () => {
    expect(deslocarMes("2026-10", -1)).toBe("2026-09");
    expect(deslocarMes("2026-10", 1)).toBe("2026-11");
    expect(deslocarMes("2026-01", -1)).toBe("2025-12");
    expect(deslocarMes("2026-12", 1)).toBe("2027-01");
    expect(deslocarMes("2026-03", -15)).toBe("2024-12");
  });
});

describe("filtroDeCategoria", () => {
  it("reconhece as categorias e o filtro sem classificação", () => {
    expect(filtroDeCategoria("receita")).toBe("receita");
    expect(filtroDeCategoria("imposto")).toBe("imposto");
    expect(filtroDeCategoria("sem")).toBe("sem");
  });

  it("trata valor desconhecido ou ausente como todas", () => {
    expect(filtroDeCategoria("outra")).toBeNull();
    expect(filtroDeCategoria(undefined)).toBeNull();
    expect(filtroDeCategoria(["receita"])).toBeNull();
  });
});

describe("filtrarPorCategoria", () => {
  it("devolve tudo sem filtro", () => {
    expect(filtrarPorCategoria([...lancamentos], null)).toHaveLength(5);
  });

  it("filtra por categoria e por sem classificação", () => {
    expect(filtrarPorCategoria([...lancamentos], "pessoal")).toEqual([lancamentos[2]]);
    expect(filtrarPorCategoria([...lancamentos], "sem")).toEqual([lancamentos[1], lancamentos[4]]);
    expect(filtrarPorCategoria([...lancamentos], "despesa")).toEqual([]);
  });
});

describe("totais", () => {
  it("soma entradas e saídas em centavos e conta os sem classificação", () => {
    expect(totais([...lancamentos])).toEqual({
      entradasCentavos: 335050,
      saidasCentavos: 103730,
      semClassificacao: 2,
    });
  });

  it("devolve zeros para lista vazia", () => {
    expect(totais([])).toEqual({ entradasCentavos: 0, saidasCentavos: 0, semClassificacao: 0 });
  });
});

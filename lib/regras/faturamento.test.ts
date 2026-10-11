// Testes das regras do painel. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  acumular,
  faturamentoPorMes,
  origemDoFaturamento,
  percentualDoLimite,
  projetar,
  receitaUltimos12Meses,
  serieDoGrafico,
  type NotaDoPainel,
} from "@/lib/regras/faturamento";

function nota(
  dataCompetencia: string,
  valorCentavos: number,
  extra: Partial<NotaDoPainel> = {},
): NotaDoPainel {
  return {
    dataCompetencia,
    valorCentavos,
    situacao: "emitida",
    tomadorNome: "Cliente A",
    tomadorDoc: "11444777000161",
    ...extra,
  };
}

describe("faturamentoPorMes", () => {
  it("soma as notas emitidas de cada mês do ano pela competência", () => {
    const porMes = faturamentoPorMes(
      [
        nota("2026-01-10", 100000),
        nota("2026-01-31", 50000),
        nota("2026-03-01", 20000),
        nota("2026-12-31", 7000),
      ],
      2026,
    );
    expect(porMes).toEqual([150000, 0, 20000, 0, 0, 0, 0, 0, 0, 0, 0, 7000]);
  });

  it("ignora notas canceladas e de outros anos", () => {
    const porMes = faturamentoPorMes(
      [
        nota("2026-02-10", 100000),
        nota("2026-02-11", 999999, { situacao: "cancelada" }),
        nota("2025-02-10", 888888),
        nota("2027-01-01", 777777),
      ],
      2026,
    );
    expect(porMes[1]).toBe(100000);
    expect(porMes.reduce((a, b) => a + b, 0)).toBe(100000);
  });

  it("devolve doze zeros quando não há notas", () => {
    expect(faturamentoPorMes([], 2026)).toEqual(new Array(12).fill(0));
  });
});

describe("acumular", () => {
  it("faz a soma corrida", () => {
    expect(acumular([10, 20, 0, 5])).toEqual([10, 30, 30, 35]);
  });
});

describe("projetar", () => {
  const abertura = "2021-03-05";

  it("reproduz o exemplo do mockup do painel", () => {
    // R$ 56.600 de janeiro a setembro e R$ 1.820 em outubro; hoje é outubro.
    const porMes = [600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 860000, 182000, 0, 0];
    const projecao = projetar({ porMes, ano: 2026, hoje: "2026-10-07", dataAbertura: abertura });
    expect(projecao.ultimoMesFechado).toBe(9);
    // 56.600 + (56.600 / 9) x 3 = 75.466,67.
    expect(projecao.valorCentavos).toBe(7546667);
  });

  it("não tem base para projetar em janeiro", () => {
    const porMes = [500000, ...new Array(11).fill(0)];
    expect(projetar({ porMes, ano: 2026, hoje: "2026-01-20", dataAbertura: abertura })).toEqual({
      ultimoMesFechado: 0,
      valorCentavos: null,
    });
  });

  it("em dezembro, projeta só o mês que falta", () => {
    const porMes = [...new Array(11).fill(100000), 0];
    const projecao = projetar({ porMes, ano: 2026, hoje: "2026-12-05", dataAbertura: abertura });
    // 11 meses de R$ 1.000 fechados + média de R$ 1.000 para dezembro.
    expect(projecao).toEqual({ ultimoMesFechado: 11, valorCentavos: 1200000 });
  });

  it("no ano de abertura, a média considera só os meses desde a abertura", () => {
    // Abriu em julho; julho a setembro fechados com R$ 3.000 no total; hoje é outubro.
    const porMes = [0, 0, 0, 0, 0, 0, 100000, 100000, 100000, 0, 0, 0];
    const projecao = projetar({ porMes, ano: 2026, hoje: "2026-10-07", dataAbertura: "2026-07-10" });
    // 3.000 + (3.000 / 3) x 3 = 6.000. Dividindo por 9 meses daria 4.000.
    expect(projecao.valorCentavos).toBe(600000);
  });

  it("não projeta no mês da própria abertura", () => {
    const porMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 50000, 0, 0];
    expect(
      projetar({ porMes, ano: 2026, hoje: "2026-10-20", dataAbertura: "2026-10-01" }).valorCentavos,
    ).toBeNull();
  });

  it("nunca fica abaixo do que já foi faturado no ano", () => {
    // Meses fechados fracos e um mês atual muito forte.
    const porMes = [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 5000000, 0, 0];
    const projecao = projetar({ porMes, ano: 2026, hoje: "2026-10-07", dataAbertura: abertura });
    // A fórmula daria 90.000 + 10.000 x 3 = 120.000, menos que os 5.090.000 já faturados.
    expect(projecao.valorCentavos).toBe(5090000);
  });

  it("em ano passado devolve o total do ano; em ano futuro, nada", () => {
    const porMes = new Array(12).fill(100000);
    expect(projetar({ porMes, ano: 2025, hoje: "2026-10-07", dataAbertura: abertura })).toEqual({
      ultimoMesFechado: 12,
      valorCentavos: 1200000,
    });
    expect(
      projetar({ porMes, ano: 2027, hoje: "2026-10-07", dataAbertura: abertura }).valorCentavos,
    ).toBeNull();
  });

  it("devolve centavos inteiros", () => {
    const porMes = [100000, 0, 0, 33333, 0, 0, 0, 0, 0, 0, 0, 0];
    const projecao = projetar({ porMes, ano: 2026, hoje: "2026-08-07", dataAbertura: abertura });
    expect(Number.isInteger(projecao.valorCentavos)).toBe(true);
  });
});

describe("receitaUltimos12Meses", () => {
  it("soma os 12 meses anteriores ao mês atual, sem o mês atual", () => {
    const notas = [
      nota("2025-09-30", 1), // fora: 13 meses atrás
      nota("2025-10-01", 10), // dentro: primeiro mês da janela
      nota("2026-03-15", 100),
      nota("2026-09-30", 1000), // dentro: último mês fechado
      nota("2026-10-01", 10000), // fora: mês atual
    ];
    expect(receitaUltimos12Meses(notas, "2026-10-07")).toBe(1110);
  });

  it("ignora canceladas", () => {
    const notas = [nota("2026-05-10", 500), nota("2026-05-11", 900, { situacao: "cancelada" })];
    expect(receitaUltimos12Meses(notas, "2026-10-07")).toBe(500);
  });

  it("atravessa a virada de ano", () => {
    const notas = [nota("2025-01-31", 1), nota("2025-02-01", 10), nota("2026-01-31", 100), nota("2026-02-01", 1000)];
    // Em fevereiro de 2026: de fevereiro de 2025 a janeiro de 2026.
    expect(receitaUltimos12Meses(notas, "2026-02-15")).toBe(110);
  });
});

describe("percentualDoLimite", () => {
  it("calcula a porcentagem usada, inclusive acima de 100", () => {
    expect(percentualDoLimite(5842000, 8100000)).toBeCloseTo(72.12, 2);
    expect(percentualDoLimite(9000000, 8100000)).toBeCloseTo(111.11, 2);
    expect(percentualDoLimite(0, 8100000)).toBe(0);
  });

  it("devolve zero quando não há limite", () => {
    expect(percentualDoLimite(100, 0)).toBe(0);
  });
});

describe("origemDoFaturamento", () => {
  it("agrupa por tomador e ordena do maior para o menor", () => {
    const notas = [
      nota("2026-01-10", 300000, { tomadorNome: "Studio Aurora", tomadorDoc: "11222333000181" }),
      nota("2026-02-10", 500000, { tomadorNome: "Clínica Bem Viver", tomadorDoc: "11444777000161" }),
      nota("2026-03-10", 200000, { tomadorNome: "Studio Aurora", tomadorDoc: "11222333000181" }),
    ];
    expect(origemDoFaturamento(notas, 2026)).toEqual([
      { nome: "Studio Aurora", valorCentavos: 500000, percentual: 50 },
      { nome: "Clínica Bem Viver", valorCentavos: 500000, percentual: 50 },
    ]);
  });

  it("junta o que passa do máximo em Outros", () => {
    const notas = ["A", "B", "C", "D", "E", "F"].map((nome, indice) =>
      nota("2026-01-10", (6 - indice) * 100000, { tomadorNome: nome, tomadorDoc: null }),
    );
    const origem = origemDoFaturamento(notas, 2026, 4);
    expect(origem.map((item) => item.nome)).toEqual(["A", "B", "C", "D", "Outros"]);
    expect(origem[4].valorCentavos).toBe(300000);
  });

  it("identifica notas sem tomador", () => {
    const origem = origemDoFaturamento(
      [nota("2026-01-10", 100, { tomadorNome: null, tomadorDoc: null })],
      2026,
    );
    expect(origem).toEqual([{ nome: "Tomador não identificado", valorCentavos: 100, percentual: 100 }]);
  });

  it("ignora canceladas e outros anos, e devolve lista vazia sem faturamento", () => {
    const notas = [nota("2026-01-10", 100, { situacao: "cancelada" }), nota("2025-01-10", 100)];
    expect(origemDoFaturamento(notas, 2026)).toEqual([]);
  });
});

describe("serieDoGrafico", () => {
  const porMes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 50, 0, 0];

  it("no ano corrente, a linha cheia para no mês de hoje e a projeção segue até dezembro", () => {
    const serie = serieDoGrafico({ porMes, ano: 2026, hoje: "2026-10-07", projecaoCentavos: 1150 });
    expect(serie.indiceAtual).toBe(9);
    expect(serie.acumulado).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 950, null, null]);
    // De 950 em outubro a 1.150 em dezembro, em linha reta.
    expect(serie.projecao).toEqual([null, null, null, null, null, null, null, null, null, 950, 1050, 1150]);
  });

  it("não desenha projeção quando não há valor projetado ou em dezembro", () => {
    const semBase = serieDoGrafico({ porMes, ano: 2026, hoje: "2026-10-07", projecaoCentavos: null });
    expect(semBase.projecao.every((valor) => valor === null)).toBe(true);
    const dezembro = serieDoGrafico({ porMes, ano: 2026, hoje: "2026-12-07", projecaoCentavos: 2000 });
    expect(dezembro.projecao.every((valor) => valor === null)).toBe(true);
    expect(dezembro.indiceAtual).toBe(11);
  });

  it("em ano passado mostra os doze meses, sem projeção", () => {
    const serie = serieDoGrafico({ porMes, ano: 2025, hoje: "2026-10-07", projecaoCentavos: 950 });
    expect(serie.acumulado[11]).toBe(950);
    expect(serie.projecao.every((valor) => valor === null)).toBe(true);
    expect(serie.indiceAtual).toBe(11);
  });

  it("em ano futuro não mostra nada", () => {
    const serie = serieDoGrafico({ porMes, ano: 2027, hoje: "2026-10-07", projecaoCentavos: null });
    expect(serie.acumulado.every((valor) => valor === null)).toBe(true);
    expect(serie.indiceAtual).toBeNull();
  });
});

// Testes do limite proporcional. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { limiteDoAno, mesesDeAtividade, type Parametros } from "@/lib/regras/limite";

// Valores de exemplo, iguais aos do seed (todos ainda "a confirmar").
const parametros: Parametros = {
  limite_anual_mei: 8100000,
  limite_mensal_proporcional_mei: 675000,
  limite_anual_me: 36000000,
};

describe("mesesDeAtividade", () => {
  it("conta 12 meses para empresa aberta em ano anterior", () => {
    expect(mesesDeAtividade("2021-03-05", 2026)).toBe(12);
  });

  it("conta do mês de abertura até dezembro, com o mês de abertura inteiro", () => {
    expect(mesesDeAtividade("2026-01-01", 2026)).toBe(12);
    expect(mesesDeAtividade("2026-01-31", 2026)).toBe(12);
    expect(mesesDeAtividade("2026-03-20", 2026)).toBe(10);
    expect(mesesDeAtividade("2026-12-31", 2026)).toBe(1);
  });

  it("conta zero para ano anterior à abertura", () => {
    expect(mesesDeAtividade("2026-03-20", 2025)).toBe(0);
  });
});

describe("limiteDoAno", () => {
  it("usa o limite anual cheio fora do ano de abertura", () => {
    expect(limiteDoAno({ porte: "MEI", dataAbertura: "2021-03-05", ano: 2026, parametros })).toBe(8100000);
    expect(limiteDoAno({ porte: "ME", dataAbertura: "2021-03-05", ano: 2026, parametros })).toBe(36000000);
  });

  it("MEI no ano de abertura: valor mensal vezes os meses de atividade", () => {
    // Aberto em março: 10 meses x R$ 6.750 = R$ 67.500.
    expect(limiteDoAno({ porte: "MEI", dataAbertura: "2026-03-20", ano: 2026, parametros })).toBe(6750000);
    // Aberto em dezembro: 1 mês.
    expect(limiteDoAno({ porte: "MEI", dataAbertura: "2026-12-10", ano: 2026, parametros })).toBe(675000);
  });

  it("MEI aberto em janeiro tem o limite anual cheio", () => {
    expect(limiteDoAno({ porte: "MEI", dataAbertura: "2026-01-15", ano: 2026, parametros })).toBe(8100000);
  });

  it("ME no ano de abertura: 1/12 do limite anual por mês de atividade", () => {
    // Aberta em julho: 6 meses x R$ 30.000 = R$ 180.000.
    expect(limiteDoAno({ porte: "ME", dataAbertura: "2026-07-01", ano: 2026, parametros })).toBe(18000000);
  });

  it("devolve centavos inteiros mesmo quando a divisão não é exata", () => {
    const quebrado: Parametros = { ...parametros, limite_anual_me: 10000000 };
    const limite = limiteDoAno({ porte: "ME", dataAbertura: "2026-06-01", ano: 2026, parametros: quebrado });
    // 7 meses de R$ 100.000 / 12 = R$ 58.333,33 (5833333,33 centavos, arredondado).
    expect(limite).toBe(5833333);
    expect(Number.isInteger(limite)).toBe(true);
  });

  it("devolve zero para ano anterior à abertura", () => {
    expect(limiteDoAno({ porte: "MEI", dataAbertura: "2026-03-20", ano: 2025, parametros })).toBe(0);
    expect(limiteDoAno({ porte: "ME", dataAbertura: "2026-03-20", ano: 2025, parametros })).toBe(0);
  });

  it("falha com mensagem clara se o parâmetro não existir", () => {
    expect(() => limiteDoAno({ porte: "MEI", dataAbertura: "2021-03-05", ano: 2026, parametros: {} })).toThrow(
      'Parâmetro "limite_anual_mei" não encontrado',
    );
  });
});

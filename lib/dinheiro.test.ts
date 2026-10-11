// Testes da formatação de dinheiro. Equivalem a testes unitários de helper no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  centavosDeDecimal,
  formatarReais,
  formatarReaisCurto,
  formatarReaisInteiros,
} from "@/lib/dinheiro";

describe("formatarReais", () => {
  it("formata centavos em reais com separador brasileiro", () => {
    expect(formatarReais(8605)).toBe("R$ 86,05");
    expect(formatarReais(123456789)).toBe("R$ 1.234.567,89");
    expect(formatarReais(0)).toBe("R$ 0,00");
  });
});

describe("formatarReaisInteiros", () => {
  it("omite os centavos", () => {
    expect(formatarReaisInteiros(8100000)).toBe("R$ 81.000");
    expect(formatarReaisInteiros(5842000)).toBe("R$ 58.420");
  });
});

describe("formatarReaisCurto", () => {
  it("abrevia milhares e milhões", () => {
    expect(formatarReaisCurto(8100000)).toBe("R$ 81 mil");
    expect(formatarReaisCurto(36000000)).toBe("R$ 360 mil");
    expect(formatarReaisCurto(480000000)).toBe("R$ 4,8 milhões");
    expect(formatarReaisCurto(100000000)).toBe("R$ 1 milhão");
  });

  it("mantém o valor completo abaixo de mil reais", () => {
    expect(formatarReaisCurto(8605)).toBe("R$ 86,05");
  });
});

describe("centavosDeDecimal", () => {
  it("converte texto decimal em centavos inteiros", () => {
    expect(centavosDeDecimal("3200.00")).toBe(320000);
    expect(centavosDeDecimal("7500.5")).toBe(750050);
    expect(centavosDeDecimal("150")).toBe(15000);
    expect(centavosDeDecimal("0.07")).toBe(7);
    // Valores que em float dariam erro de arredondamento.
    expect(centavosDeDecimal("1.15")).toBe(115);
    expect(centavosDeDecimal("4.35")).toBe(435);
  });

  it("recusa formatos que não são decimal com ponto", () => {
    for (const valor of ["", "3.200,00", "1,50", "-10.00", "10.999", "abc", "1e3"]) {
      expect(centavosDeDecimal(valor)).toBeNull();
    }
  });
});

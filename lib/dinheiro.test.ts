// Testes da formatação de dinheiro. Equivalem a testes unitários de helper no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { formatarReais, formatarReaisCurto, formatarReaisInteiros } from "@/lib/dinheiro";

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

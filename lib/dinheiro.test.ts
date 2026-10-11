// Testes da formatação de dinheiro. Equivalem a testes unitários de helper no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  centavosDeDecimal,
  centavosDeTexto,
  formatarReais,
  formatarReaisCurto,
  formatarReaisInteiros,
  formatarValorParaCampo,
} from "@/lib/dinheiro";

describe("centavosDeTexto", () => {
  it("lê o formato brasileiro e o americano", () => {
    expect(centavosDeTexto("1.234,56")).toBe(123456);
    expect(centavosDeTexto("1234,56")).toBe(123456);
    expect(centavosDeTexto("1,234.56")).toBe(123456);
    expect(centavosDeTexto("1234.56")).toBe(123456);
    expect(centavosDeTexto("1.234.567,89")).toBe(123456789);
    expect(centavosDeTexto("150")).toBe(15000);
    expect(centavosDeTexto("150,5")).toBe(15050);
    expect(centavosDeTexto("0,07")).toBe(7);
  });

  it("trata ponto ou vírgula seguidos de três dígitos como milhar", () => {
    expect(centavosDeTexto("1.234")).toBe(123400);
    expect(centavosDeTexto("1,234")).toBe(123400);
    expect(centavosDeTexto("12.345.678")).toBe(1234567800);
  });

  it("entende as formas de escrever valor negativo", () => {
    expect(centavosDeTexto("-50,00")).toBe(-5000);
    expect(centavosDeTexto("50,00-")).toBe(-5000);
    expect(centavosDeTexto("(50,00)")).toBe(-5000);
    expect(centavosDeTexto("50,00 D")).toBe(-5000);
    expect(centavosDeTexto("50,00 C")).toBe(5000);
    expect(centavosDeTexto("+50,00")).toBe(5000);
  });

  it("ignora o símbolo da moeda e os espaços", () => {
    expect(centavosDeTexto("R$ 1.234,56")).toBe(123456);
    expect(centavosDeTexto("-R$ 89,90")).toBe(-8990);
    expect(centavosDeTexto("R$\u00a0-89,90")).toBe(-8990);
  });

  it("devolve null para o que não é valor", () => {
    expect(centavosDeTexto("")).toBeNull();
    expect(centavosDeTexto("abc")).toBeNull();
    expect(centavosDeTexto("12,345,67")).toBeNull();
    expect(centavosDeTexto("1.23.4")).toBeNull();
    expect(centavosDeTexto("10,5678")).toBeNull();
    expect(centavosDeTexto("02/10/2026")).toBeNull();
    expect(centavosDeTexto("-")).toBeNull();
  });
});

describe("formatarValorParaCampo", () => {
  it("escreve o valor sem o símbolo, para um campo de formulário", () => {
    expect(formatarValorParaCampo(8605)).toBe("86,05");
    expect(formatarValorParaCampo(123456789)).toBe("1.234.567,89");
  });
});

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

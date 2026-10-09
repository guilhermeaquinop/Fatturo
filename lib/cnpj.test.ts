// Testes da validação e da máscara de CNPJ. Equivalem a testes de uma Rule no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { limparCnpj, mascararCnpj, validarCnpj } from "@/lib/cnpj";

describe("validarCnpj", () => {
  it("aceita CNPJ numérico válido, com ou sem máscara", () => {
    expect(validarCnpj("11.222.333/0001-81")).toBe(true);
    expect(validarCnpj("11222333000181")).toBe(true);
    expect(validarCnpj("11.444.777/0001-61")).toBe(true);
  });

  it("aceita CNPJ alfanumérico válido (exemplo da Receita Federal)", () => {
    expect(validarCnpj("12.ABC.345/01DE-35")).toBe(true);
    expect(validarCnpj("12abc34501de35")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(validarCnpj("11.222.333/0001-80")).toBe(false);
    expect(validarCnpj("11.222.333/0001-91")).toBe(false);
    expect(validarCnpj("12.ABC.345/01DE-34")).toBe(false);
  });

  it("recusa tamanho errado e valor vazio", () => {
    expect(validarCnpj("")).toBe(false);
    expect(validarCnpj("1122233300018")).toBe(false);
  });

  it("recusa sequências de um caractere só", () => {
    expect(validarCnpj("00.000.000/0000-00")).toBe(false);
    expect(validarCnpj("11111111111111")).toBe(false);
  });

  it("recusa letra na posição dos dígitos verificadores", () => {
    expect(validarCnpj("12ABC34501DE3A")).toBe(false);
  });
});

describe("mascararCnpj", () => {
  it("formata o CNPJ completo", () => {
    expect(mascararCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(mascararCnpj("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  });

  it("formata aos poucos, enquanto o usuário digita", () => {
    expect(mascararCnpj("")).toBe("");
    expect(mascararCnpj("11")).toBe("11");
    expect(mascararCnpj("112")).toBe("11.2");
    expect(mascararCnpj("11222333")).toBe("11.222.333");
    expect(mascararCnpj("112223330001")).toBe("11.222.333/0001");
  });

  it("ignora o que passar de 14 caracteres", () => {
    expect(mascararCnpj("11222333000181999")).toBe("11.222.333/0001-81");
  });
});

describe("limparCnpj", () => {
  it("tira a máscara e deixa as letras em maiúsculas", () => {
    expect(limparCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
  });
});

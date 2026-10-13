// Testes da montagem dos CSV de exportação. Equivalem a testes unitários de um Export no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { dataParaCsv, montarCsv, valorParaCsv } from "@/lib/exportacao";

describe("valorParaCsv", () => {
  it("escreve centavos como número com vírgula, sem símbolo nem milhar", () => {
    expect(valorParaCsv(123456)).toBe("1234,56");
    expect(valorParaCsv(93450)).toBe("934,50");
    expect(valorParaCsv(7)).toBe("0,07");
    expect(valorParaCsv(0)).toBe("0,00");
  });

  it("mantém o sinal e deixa vazio o que não tem valor", () => {
    expect(valorParaCsv(-8990)).toBe("-89,90");
    expect(valorParaCsv(null)).toBe("");
  });
});

describe("dataParaCsv", () => {
  it("formata data e data com hora no padrão brasileiro", () => {
    expect(dataParaCsv("2026-10-02")).toBe("02/10/2026");
    expect(dataParaCsv("2026-10-02T14:30:00+00:00")).toBe("02/10/2026");
    expect(dataParaCsv(null)).toBe("");
  });
});

describe("montarCsv", () => {
  it("usa ponto e vírgula, quebra de linha do Windows e a marca BOM", () => {
    const csv = montarCsv(["Número", "Valor"], [["70", "3200,00"], ["71", "7500,50"]]);
    expect(csv).toBe("﻿Número;Valor\r\n70;3200,00\r\n71;7500,50");
  });

  it("põe entre aspas o texto com ponto e vírgula, aspas ou quebra de linha", () => {
    const csv = montarCsv(["Descrição"], [["Pix; cliente"], ['Loja "Aurora"'], ["duas\nlinhas"]]);
    expect(csv).toBe('﻿Descrição\r\n"Pix; cliente"\r\n"Loja ""Aurora"""\r\n"duas\nlinhas"');
  });

  it("escreve vazio para null", () => {
    expect(montarCsv(["A", "B"], [[null, 1]])).toBe("﻿A;B\r\n;1");
  });

  it("neutraliza fórmulas só nas colunas de texto livre", () => {
    const csv = montarCsv(["Descrição", "Valor"], [["=SOMA(A1:A9)", "-89,90"], ["@cmd", "10,00"]], [0]);
    expect(csv).toBe("﻿Descrição;Valor\r\n'=SOMA(A1:A9);-89,90\r\n'@cmd;10,00");
  });

  it("devolve só o cabeçalho quando não há linhas", () => {
    expect(montarCsv(["A", "B"], [])).toBe("﻿A;B");
  });
});

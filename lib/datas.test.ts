// Testes dos helpers de data. Equivalem a testes unitários de helper no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { anoDe, formatarDataBr, hojeIso, mascararData, mesDe, parseDataBr } from "@/lib/datas";

describe("parseDataBr", () => {
  it("converte dd/mm/aaaa em aaaa-mm-dd", () => {
    expect(parseDataBr("05/03/2021")).toBe("2021-03-05");
    expect(parseDataBr(" 31/12/1999 ")).toBe("1999-12-31");
  });

  it("aceita 29 de fevereiro só em ano bissexto", () => {
    expect(parseDataBr("29/02/2024")).toBe("2024-02-29");
    expect(parseDataBr("29/02/2023")).toBeNull();
  });

  it("recusa datas que não existem e formatos errados", () => {
    expect(parseDataBr("31/04/2024")).toBeNull();
    expect(parseDataBr("00/01/2024")).toBeNull();
    expect(parseDataBr("10/13/2024")).toBeNull();
    expect(parseDataBr("5/3/2021")).toBeNull();
    expect(parseDataBr("2021-03-05")).toBeNull();
    expect(parseDataBr("")).toBeNull();
  });
});

describe("formatarDataBr", () => {
  it("converte aaaa-mm-dd em dd/mm/aaaa", () => {
    expect(formatarDataBr("2021-03-05")).toBe("05/03/2021");
  });
});

describe("mascararData", () => {
  it("formata aos poucos e ignora o excesso", () => {
    expect(mascararData("0")).toBe("0");
    expect(mascararData("0503")).toBe("05/03");
    expect(mascararData("05032021")).toBe("05/03/2021");
    expect(mascararData("05/03/2021999")).toBe("05/03/2021");
    expect(mascararData("ab")).toBe("");
  });
});

describe("hojeIso", () => {
  it("usa o fuso de São Paulo, não o UTC", () => {
    // 02:00 UTC do dia 9 ainda é dia 8 em São Paulo (UTC-3).
    expect(hojeIso(new Date("2026-10-09T02:00:00Z"))).toBe("2026-10-08");
    expect(hojeIso(new Date("2026-10-09T03:00:00Z"))).toBe("2026-10-09");
  });
});

describe("anoDe e mesDe", () => {
  it("leem ano e mês da data ISO", () => {
    expect(anoDe("2026-10-09")).toBe(2026);
    expect(mesDe("2026-10-09")).toBe(10);
    expect(mesDe("2026-01-31")).toBe(1);
  });
});

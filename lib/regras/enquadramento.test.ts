// Testes do enquadramento por data. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { enquadramentoEm, mudancaDePorteNoAno, type Periodo } from "@/lib/regras/enquadramento";

// MEI da abertura até junho de 2026, ME a partir de julho.
const historico: Periodo[] = [
  { porte: "ME", inicioEm: "2026-07-01", fimEm: null },
  { porte: "MEI", inicioEm: "2023-08-17", fimEm: "2026-06-30" },
];
const soMe: Periodo[] = [{ porte: "ME", inicioEm: "2021-03-05", fimEm: null }];

describe("enquadramentoEm", () => {
  it("devolve o período que contém a data", () => {
    expect(enquadramentoEm(historico, "2024-12-31").porte).toBe("MEI");
    expect(enquadramentoEm(historico, "2026-10-11").porte).toBe("ME");
  });

  it("inclui o primeiro e o último dia de cada período", () => {
    expect(enquadramentoEm(historico, "2023-08-17").porte).toBe("MEI");
    expect(enquadramentoEm(historico, "2026-06-30").porte).toBe("MEI");
    expect(enquadramentoEm(historico, "2026-07-01").porte).toBe("ME");
  });

  it("usa o primeiro período para data anterior ao histórico", () => {
    expect(enquadramentoEm(historico, "2023-01-01").porte).toBe("MEI");
  });

  it("usa o mais recente se a data cair num buraco do histórico", () => {
    const comBuraco: Periodo[] = [
      { porte: "MEI", inicioEm: "2023-01-01", fimEm: "2023-12-31" },
      { porte: "ME", inicioEm: "2025-01-01", fimEm: "2025-12-31" },
    ];
    expect(enquadramentoEm(comBuraco, "2024-06-01").porte).toBe("ME");
  });

  it("recusa histórico vazio", () => {
    expect(() => enquadramentoEm([], "2026-01-01")).toThrow();
  });
});

describe("mudancaDePorteNoAno", () => {
  it("informa o porte anterior e o último dia dele no ano da mudança", () => {
    expect(mudancaDePorteNoAno(historico, 2026, "2026-10-11")).toEqual({
      porteAnterior: "MEI",
      ate: "2026-06-30",
    });
    expect(mudancaDePorteNoAno(historico, 2026, "2026-12-31")).toEqual({
      porteAnterior: "MEI",
      ate: "2026-06-30",
    });
  });

  it("não há mudança nos anos de um porte só", () => {
    expect(mudancaDePorteNoAno(historico, 2025, "2025-12-31")).toBeNull();
    expect(mudancaDePorteNoAno(historico, 2027, "2027-12-31")).toBeNull();
    expect(mudancaDePorteNoAno(soMe, 2026, "2026-10-11")).toBeNull();
  });

  it("não há mudança antes de ela acontecer", () => {
    expect(mudancaDePorteNoAno(historico, 2026, "2026-05-10")).toBeNull();
  });

  it("ignora troca que mantém o porte (só o anexo mudou)", () => {
    const trocaDeAnexo: Periodo[] = [
      { porte: "ME", inicioEm: "2024-01-01", fimEm: "2026-03-31" },
      { porte: "ME", inicioEm: "2026-04-01", fimEm: null },
    ];
    expect(mudancaDePorteNoAno(trocaDeAnexo, 2026, "2026-10-11")).toBeNull();
  });

  it("mudança na virada do ano não gera aviso em nenhum dos dois anos", () => {
    const viradaDeAno: Periodo[] = [
      { porte: "MEI", inicioEm: "2023-01-01", fimEm: "2025-12-31" },
      { porte: "ME", inicioEm: "2026-01-01", fimEm: null },
    ];
    expect(mudancaDePorteNoAno(viradaDeAno, 2025, "2025-12-31")).toBeNull();
    expect(mudancaDePorteNoAno(viradaDeAno, 2026, "2026-10-11")).toBeNull();
  });
});

// Testes das regras do DAS. Equivalem a testes unitários de um Service no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  dasPagoAcumulado,
  diasEntre,
  mesesDoDas,
  resumoDoDas,
  situacaoDaGuia,
  valorSugerido,
  vencimentoPadrao,
  type GuiaSalva,
} from "@/lib/regras/das";
import type { Periodo } from "@/lib/regras/enquadramento";

// MEI da abertura até junho de 2026, ME a partir de julho.
const periodos: Periodo[] = [
  { porte: "MEI", inicioEm: "2023-08-17", fimEm: "2026-06-30" },
  { porte: "ME", inicioEm: "2026-07-01", fimEm: null },
];
const HOJE = "2026-10-13";

describe("vencimentoPadrao", () => {
  it("cai no dia 20 do mês seguinte", () => {
    // 20/08/2026 é uma quinta-feira.
    expect(vencimentoPadrao("2026-07", 20)).toBe("2026-08-20");
    expect(vencimentoPadrao("2026-09", 20)).toBe("2026-10-20");
  });

  it("passa para segunda quando o dia 20 cai no fim de semana", () => {
    // 20/09/2026 é domingo: a guia real de agosto venceu em 21/09.
    expect(vencimentoPadrao("2026-08", 20)).toBe("2026-09-21");
    // 20/06/2026 é sábado.
    expect(vencimentoPadrao("2026-05", 20)).toBe("2026-06-22");
  });

  it("vira o ano na competência de dezembro", () => {
    expect(vencimentoPadrao("2026-12", 20)).toBe("2027-01-20");
  });
});

describe("situacaoDaGuia", () => {
  const guia = { competencia: "2026-09", vencimento: "2026-10-20", valorCentavos: 83700, pagoEm: null };

  it("é paga quando tem data de pagamento, mesmo depois do vencimento", () => {
    expect(situacaoDaGuia({ ...guia, pagoEm: "2026-10-25" }, HOJE)).toBe("paga");
  });

  it("é a vencer enquanto o mês de competência não terminou", () => {
    expect(situacaoDaGuia({ ...guia, competencia: "2026-10", vencimento: "2026-11-20" }, HOJE)).toBe(
      "a_vencer",
    );
    expect(situacaoDaGuia(guia, "2026-09-30")).toBe("a_vencer");
  });

  it("é pendente do fim do mês até o dia do vencimento, inclusive", () => {
    expect(situacaoDaGuia(guia, "2026-10-01")).toBe("pendente");
    expect(situacaoDaGuia(guia, "2026-10-20")).toBe("pendente");
  });

  it("é pendente até o vencimento mesmo sem valor informado", () => {
    expect(situacaoDaGuia({ ...guia, valorCentavos: null }, "2026-10-20")).toBe("pendente");
  });

  it("é vencida a partir do dia seguinte ao vencimento, se tem valor", () => {
    expect(situacaoDaGuia(guia, "2026-10-21")).toBe("vencida");
  });

  it("fica sem valor, e não vencida, quando passou do prazo e nada foi informado", () => {
    expect(situacaoDaGuia({ ...guia, valorCentavos: null }, "2026-10-21")).toBe("sem_valor");
  });
});

describe("valorSugerido", () => {
  it("aplica a alíquota em centésimos de por cento, sem float", () => {
    // Guias reais de julho e agosto de 2026: R$ 15.575,00 a 6% = R$ 934,50.
    expect(valorSugerido(1557500, 600)).toBe(93450);
    expect(valorSugerido(1070000, 600)).toBe(64200);
    expect(valorSugerido(0, 600)).toBe(0);
  });

  it("arredonda para o centavo mais próximo", () => {
    // R$ 93,12 a 6% = R$ 5,5872.
    expect(valorSugerido(9312, 600)).toBe(559);
  });
});

describe("diasEntre", () => {
  it("conta dias corridos, com sinal", () => {
    expect(diasEntre("2026-10-13", "2026-10-20")).toBe(7);
    expect(diasEntre("2026-10-13", "2026-10-13")).toBe(0);
    expect(diasEntre("2026-10-21", "2026-10-20")).toBe(-1);
    expect(diasEntre("2026-12-25", "2027-01-20")).toBe(26);
  });
});

describe("mesesDoDas", () => {
  const receita = [595000, 595000, 2699312, 0, 1345000, 1395000, 1557500, 1557500, 1395000, 1070000, 0, 0];
  const guias: GuiaSalva[] = [
    { competencia: "2026-07", vencimento: "2026-08-20", valorCentavos: 93450, pagoEm: "2026-08-20" },
    { competencia: "2026-08", vencimento: "2026-09-21", valorCentavos: 93450, pagoEm: null },
  ];
  const base = {
    ano: 2026,
    dataAbertura: "2023-08-17",
    hoje: HOJE,
    guias,
    receitaPorMes: receita,
    periodos,
    diaDeVencimento: 20,
    aliquotaSugerida: 600,
    sugerir: true,
  };
  const meses = mesesDoDas(base);
  const mes = (numero: number) => meses[numero - 1];

  it("devolve os 12 meses de um ano cheio", () => {
    expect(meses).toHaveLength(12);
    expect(mes(1).competencia).toBe("2026-01");
    expect(mes(12).vencimento).toBe("2027-01-20");
  });

  it("usa a guia gravada quando existe e o vencimento padrão quando não", () => {
    expect(mes(7)).toMatchObject({ valorCentavos: 93450, pagoEm: "2026-08-20", situacao: "paga" });
    expect(mes(8)).toMatchObject({ vencimento: "2026-09-21", situacao: "vencida" });
    expect(mes(9)).toMatchObject({ vencimento: "2026-10-20", valorCentavos: null, situacao: "pendente" });
    expect(mes(10).situacao).toBe("a_vencer");
  });

  it("aplica o porte de cada mês", () => {
    expect(mes(6).porte).toBe("MEI");
    expect(mes(7).porte).toBe("ME");
  });

  it("sugere valor só para mês de ME encerrado, com receita e sem valor informado", () => {
    expect(mes(9).sugestaoCentavos).toBe(83700);
    // Já tem valor.
    expect(mes(8).sugestaoCentavos).toBeNull();
    // MEI: valor fixo, sem sugestão. Mês antigo sem registro fica "sem valor".
    expect(mes(5).sugestaoCentavos).toBeNull();
    expect(mes(5).situacao).toBe("sem_valor");
    // Mês ainda aberto.
    expect(mes(10).sugestaoCentavos).toBeNull();
  });

  it("não sugere quando a sugestão está desligada", () => {
    expect(mesesDoDas({ ...base, sugerir: false })[8].sugestaoCentavos).toBeNull();
  });

  it("começa no mês de abertura no ano em que a empresa abriu", () => {
    const de2023 = mesesDoDas({ ...base, ano: 2023, guias: [], receitaPorMes: new Array(12).fill(0) });
    expect(de2023.map((item) => item.mes)).toEqual([8, 9, 10, 11, 12]);
    expect(mesesDoDas({ ...base, ano: 2022, guias: [] })).toEqual([]);
  });
});

describe("resumoDoDas e dasPagoAcumulado", () => {
  const meses = mesesDoDas({
    ano: 2026,
    dataAbertura: "2023-08-17",
    hoje: HOJE,
    guias: [
      { competencia: "2026-06", vencimento: "2026-07-20", valorCentavos: 8605, pagoEm: "2026-07-18" },
      { competencia: "2026-07", vencimento: "2026-08-20", valorCentavos: 93450, pagoEm: "2026-08-20" },
      { competencia: "2026-08", vencimento: "2026-09-21", valorCentavos: 93450, pagoEm: null },
    ],
    receitaPorMes: new Array(12).fill(0),
    periodos,
    diaDeVencimento: 20,
    aliquotaSugerida: 600,
    sugerir: true,
  });

  it("soma as pagas e separa vencidas de pendentes", () => {
    const resumo = resumoDoDas(meses);
    expect(resumo.pagoCentavos).toBe(102055);
    expect(resumo.pagas).toBe(2);
    // Só agosto tem valor e está atrasada; janeiro a maio não foram informados.
    expect(resumo.vencidas.map((item) => item.mes)).toEqual([8]);
    expect(resumo.pendentes.map((item) => item.mes)).toEqual([9]);
  });

  it("aponta como próxima a guia em aberto que vence primeiro", () => {
    expect(resumoDoDas(meses).proxima?.mes).toBe(8);
    const semAtraso = meses.filter((item) => item.situacao !== "vencida");
    expect(resumoDoDas(semAtraso).proxima?.mes).toBe(9);
    expect(resumoDoDas(meses.filter((item) => item.situacao === "paga")).proxima).toBeNull();
  });

  it("acumula o DAS pago por mês de competência, até o mês atual", () => {
    expect(dasPagoAcumulado(meses, 10)).toEqual([
      0, 0, 0, 0, 0, 8605, 102055, 102055, 102055, 102055, null, null,
    ]);
    expect(dasPagoAcumulado(meses, 12)[11]).toBe(102055);
  });
});

// Testes dos esquemas de lançamento. Equivalem a testes de Form Request no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import {
  classificacaoEmLoteSchema,
  extratoSchema,
  lancamentoSchema,
  mapeamentoCsvSchema,
} from "@/lib/validacao/lancamento";

const valido = {
  data: "02/10/2026",
  sentido: "entrada",
  valor: "1.234,56",
  descricao: "Pix recebido",
  contraparteNome: "",
  categoria: "",
};

function erroDe(campo: string, dados: object): string | undefined {
  const resultado = lancamentoSchema.safeParse(dados);
  if (resultado.success) return undefined;
  return resultado.error.issues.find((item) => item.path[0] === campo)?.message;
}

describe("lancamentoSchema", () => {
  it("aceita um lançamento manual completo, com ou sem categoria", () => {
    expect(lancamentoSchema.safeParse(valido).success).toBe(true);
    expect(lancamentoSchema.safeParse({ ...valido, categoria: "receita" }).success).toBe(true);
  });

  it("aceita data passada e recusa data futura ou que não existe", () => {
    expect(lancamentoSchema.safeParse({ ...valido, data: "15/03/2019" }).success).toBe(true);
    expect(erroDe("data", { ...valido, data: "01/01/2999" })).toBe("A data não pode estar no futuro.");
    expect(erroDe("data", { ...valido, data: "31/02/2026" })).toBe(
      "Data inválida. Use o formato dd/mm/aaaa.",
    );
    expect(erroDe("data", { ...valido, data: "" })).toBe("Informe a data.");
  });

  it("exige valor maior que zero e sem sinal", () => {
    expect(erroDe("valor", { ...valido, valor: "" })).toBe("Informe o valor.");
    expect(erroDe("valor", { ...valido, valor: "abc" })).toBe("Valor inválido. Use o formato 1.234,56.");
    expect(erroDe("valor", { ...valido, valor: "0,00" })).toBe(
      "Informe um valor maior que zero, sem sinal.",
    );
    expect(erroDe("valor", { ...valido, valor: "-50,00" })).toBe(
      "Informe um valor maior que zero, sem sinal.",
    );
  });

  it("exige descrição e recusa categoria ou sentido desconhecidos", () => {
    expect(erroDe("descricao", { ...valido, descricao: "   " })).toBe("Informe a descrição.");
    expect(lancamentoSchema.safeParse({ ...valido, categoria: "lazer" }).success).toBe(false);
    expect(lancamentoSchema.safeParse({ ...valido, sentido: "estorno" }).success).toBe(false);
  });
});

describe("classificacaoEmLoteSchema", () => {
  const id = "6a7a94eb-3f8b-49c4-ae2c-193dba30e4b4";

  it("aceita categoria ou vazio (sem classificação)", () => {
    expect(classificacaoEmLoteSchema.safeParse({ ids: [id], categoria: "pessoal" }).success).toBe(true);
    expect(classificacaoEmLoteSchema.safeParse({ ids: [id], categoria: "" }).success).toBe(true);
  });

  it("recusa lista vazia e id que não é UUID", () => {
    expect(classificacaoEmLoteSchema.safeParse({ ids: [], categoria: "pessoal" }).success).toBe(false);
    expect(classificacaoEmLoteSchema.safeParse({ ids: ["1"], categoria: "pessoal" }).success).toBe(false);
  });
});

describe("extratoSchema", () => {
  const extrato = {
    nome: "extrato.ofx",
    tipo: "OFX",
    hash: "a".repeat(64),
    lancamentos: [
      {
        idExterno: "ofx:0260-1:abc",
        data: "2026-10-02",
        valorCentavos: 320000,
        sentido: "entrada",
        descricao: "Pix recebido",
        contraparteNome: null,
      },
    ],
    erros: 0,
  };

  it("aceita o que o leitor produz", () => {
    expect(extratoSchema.safeParse(extrato).success).toBe(true);
  });

  it("recusa valor zero, negativo ou fracionado e tipo que não é extrato", () => {
    const com = (valorCentavos: number) => ({
      ...extrato,
      lancamentos: [{ ...extrato.lancamentos[0], valorCentavos }],
    });
    expect(extratoSchema.safeParse(com(0)).success).toBe(false);
    expect(extratoSchema.safeParse(com(-100)).success).toBe(false);
    expect(extratoSchema.safeParse(com(10.5)).success).toBe(false);
    expect(extratoSchema.safeParse({ ...extrato, tipo: "XML_NFSE" }).success).toBe(false);
  });
});

describe("mapeamentoCsvSchema", () => {
  const base = { assinatura: "data|valor|descricao", colunaData: 0, colunaDescricao: 2 };

  it("aceita valor numa coluna ou crédito e débito", () => {
    expect(
      mapeamentoCsvSchema.safeParse({ ...base, colunaValor: 1, colunaCredito: null, colunaDebito: null })
        .success,
    ).toBe(true);
    expect(
      mapeamentoCsvSchema.safeParse({ ...base, colunaValor: null, colunaCredito: 1, colunaDebito: 3 })
        .success,
    ).toBe(true);
  });

  it("recusa os dois modos juntos ou nenhum", () => {
    expect(
      mapeamentoCsvSchema.safeParse({ ...base, colunaValor: 1, colunaCredito: 1, colunaDebito: 3 })
        .success,
    ).toBe(false);
    expect(
      mapeamentoCsvSchema.safeParse({ ...base, colunaValor: null, colunaCredito: 1, colunaDebito: null })
        .success,
    ).toBe(false);
  });
});

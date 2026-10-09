// Testes do esquema da configuração da empresa. Equivalem a testes de Form Request no Pest/PHPUnit.
import { describe, expect, it } from "vitest";
import { anexoParaGravar, empresaSchema } from "@/lib/validacao/empresa";

const me = {
  cnpj: "11.222.333/0001-81",
  nome: "Studio Aurora Ltda",
  dataAbertura: "05/03/2021",
  porte: "ME",
  regime: "SIMPLES",
  atividade: "servico",
  anexo: "III",
};

const mei = { ...me, porte: "MEI", anexo: "" };

function mensagens(dados: unknown) {
  const resultado = empresaSchema.safeParse(dados);
  return Object.fromEntries(
    (resultado.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("empresaSchema", () => {
  it("aceita ME com anexo e MEI sem anexo", () => {
    expect(empresaSchema.safeParse(me).success).toBe(true);
    expect(empresaSchema.safeParse(mei).success).toBe(true);
  });

  it("aceita ME com anexo \"Não sei\"", () => {
    expect(empresaSchema.safeParse({ ...me, anexo: "nao_sei" }).success).toBe(true);
  });

  it("exige anexo para ME", () => {
    expect(mensagens({ ...me, anexo: "" })).toHaveProperty("anexo");
  });

  it("recusa CNPJ com dígito verificador errado", () => {
    expect(mensagens({ ...me, cnpj: "11.222.333/0001-80" })).toEqual({
      cnpj: "CNPJ inválido. Confira os dígitos.",
    });
  });

  it("recusa data inexistente e data futura", () => {
    expect(mensagens({ ...me, dataAbertura: "31/02/2021" })).toEqual({
      dataAbertura: "Data inválida. Use o formato dd/mm/aaaa.",
    });
    expect(mensagens({ ...me, dataAbertura: "01/01/2999" })).toEqual({
      dataAbertura: "A data de abertura não pode estar no futuro.",
    });
  });

  it("exige o porte e recusa valores fora das listas", () => {
    expect(mensagens({ ...me, porte: undefined })).toHaveProperty("porte", "Escolha o porte da empresa.");
    expect(mensagens({ ...me, regime: "PRESUMIDO" })).toHaveProperty("regime");
    expect(mensagens({ ...me, atividade: "industria" })).toHaveProperty("atividade");
  });

  it("aponta os campos vazios do primeiro passo", () => {
    expect(mensagens({ ...me, cnpj: "", nome: "  ", dataAbertura: "" })).toEqual({
      cnpj: "Informe o CNPJ.",
      nome: "Informe o nome da empresa.",
      dataAbertura: "Informe a data de abertura.",
    });
  });
});

describe("anexoParaGravar", () => {
  it("devolve o anexo da ME", () => {
    expect(anexoParaGravar({ porte: "ME", anexo: "V" })).toBe("V");
    expect(anexoParaGravar({ porte: "ME", anexo: "nao_sei" })).toBe("nao_sei");
  });

  it("devolve null para MEI, mesmo com anexo preenchido", () => {
    expect(anexoParaGravar({ porte: "MEI", anexo: "" })).toBeNull();
    expect(anexoParaGravar({ porte: "MEI", anexo: "III" })).toBeNull();
  });
});

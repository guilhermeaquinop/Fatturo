// Testes do leitor de OFX. Equivalem a testes unitários de um Parser no Pest/PHPUnit.
// As amostras são fictícias, montadas pela especificação do formato (versões 1.x e 2.x).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lerOfx } from "@/lib/importacao/ofx";

const amostra = (nome: string) =>
  readFileSync(new URL(`./amostras/${nome}`, import.meta.url), "utf8");

function extrato(texto: string) {
  const lido = lerOfx(texto);
  if (lido.tipo !== "extrato") throw new Error(`esperava extrato, veio: ${lido.mensagem}`);
  return lido;
}

describe("lerOfx (versão 1.x, SGML sem fechamento de tag)", () => {
  const lido = extrato(amostra("extrato.ofx"));

  it("lê entradas e saídas, com valor sempre positivo e o sentido à parte", () => {
    expect(lido.erros).toEqual([]);
    expect(lido.lancamentos).toHaveLength(4);
    expect(lido.lancamentos[0]).toEqual({
      idExterno: "ofx:0260-0001-1234567-8:68de1a20-0001",
      data: "2026-10-02",
      valorCentavos: 320000,
      sentido: "entrada",
      descricao: "Transferencia recebida pelo Pix - CLINICA BEM VIVER LTDA - 12.345.678/0001-95",
      contraparteNome: null,
    });
    expect(lido.lancamentos[1]).toMatchObject({ valorCentavos: 8990, sentido: "saida" });
  });

  it("usa MEMO como descrição e NAME como contraparte quando vêm os dois", () => {
    expect(lido.lancamentos[1].descricao).toBe("Compra no debito & cafe");
    expect(lido.lancamentos[1].contraparteNome).toBe("PADARIA DO BAIRRO");
  });

  it("usa NAME como descrição quando não há MEMO", () => {
    expect(lido.lancamentos[3]).toMatchObject({
      descricao: "MARCOS ALVES RIBEIRO",
      contraparteNome: null,
      valorCentavos: 15050,
    });
  });

  it("aceita vírgula como separador decimal e ignora a hora da data", () => {
    expect(lido.lancamentos[2]).toMatchObject({
      data: "2026-10-03",
      valorCentavos: 93450,
      sentido: "saida",
    });
  });

  it("pula linha de valor zero", () => {
    expect(lido.lancamentos.some((item) => item.descricao === "Saldo do dia")).toBe(false);
  });
});

describe("lerOfx (versão 2.x, XML)", () => {
  const lido = extrato(amostra("extrato-v2.ofx"));

  it("lê as contas do arquivo, corrente e cartão", () => {
    expect(lido.lancamentos.map((item) => item.descricao)).toEqual([
      "TED RECEBIDA ESTÚDIO AURORA",
      "PIX ENVIADO ALUGUEL",
      "ASSINATURA SOFTWARE",
    ]);
  });

  it("diferencia FITID repetido na mesma conta e separa contas diferentes", () => {
    expect(lido.lancamentos.map((item) => item.idExterno)).toEqual([
      "ofx:341-98765-4:20261010001",
      "ofx:341-98765-4:20261010001:2",
      "ofx:5555000011112222:20261010001",
    ]);
  });

  it("lista as linhas com problema sem interromper o arquivo", () => {
    expect(lido.erros).toEqual([
      "Lançamento 3 com data inválida.",
      "Lançamento 4 com valor inválido.",
      "Lançamento 5 sem identificador (FITID).",
    ]);
  });
});

describe("lerOfx (arquivos que não servem)", () => {
  it("recusa o que não é OFX", () => {
    expect(lerOfx("data;valor\n01/10/2026;10,00")).toEqual({
      tipo: "erro",
      mensagem: "O arquivo não é um extrato OFX.",
    });
  });

  it("recusa OFX sem extrato de conta", () => {
    expect(lerOfx("<OFX><SIGNONMSGSRSV1></SIGNONMSGSRSV1></OFX>")).toEqual({
      tipo: "erro",
      mensagem: "O arquivo OFX não tem extrato de conta.",
    });
  });

  it("avisa quando o extrato não tem lançamentos", () => {
    const vazio = "<OFX><STMTRS><BANKACCTFROM><ACCTID>1</BANKACCTFROM></STMTRS></OFX>";
    expect(lerOfx(vazio)).toEqual({
      tipo: "erro",
      mensagem: "O extrato não tem lançamentos no período.",
    });
  });

  it("lê o arquivo inteiro como uma conta quando o bloco do extrato não fecha", () => {
    const semFechar =
      "<OFX><STMTRS><STMTTRN><DTPOSTED>20261001<TRNAMT>10.00<FITID>a1<MEMO>X</STMTTRN></OFX>";
    expect(extrato(semFechar).lancamentos).toEqual([
      {
        idExterno: "ofx:sem-conta:a1",
        data: "2026-10-01",
        valorCentavos: 1000,
        sentido: "entrada",
        descricao: "X",
        contraparteNome: null,
      },
    ]);
  });
});

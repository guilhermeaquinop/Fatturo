// Testes do leitor de XML de NFS-e. Equivalem a testes unitários de um Parser no Pest/PHPUnit.
// As amostras em ./amostras têm a estrutura de notas reais do Emissor Nacional, com
// CNPJs, nomes e valores fictícios.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lerNfse } from "@/lib/importacao/nfse";

function amostra(nome: string): string {
  return readFileSync(new URL(`./amostras/${nome}`, import.meta.url), "utf8");
}

describe("lerNfse — nota", () => {
  it("lê uma nota com tomador pessoa jurídica", () => {
    expect(lerNfse(amostra("nota-cnpj.xml"))).toEqual({
      tipo: "nota",
      nota: {
        chave: "21112012211222333000181000000000007026101649923191",
        numero: "70",
        dataEmissao: "2026-10-02",
        dataCompetencia: "2026-10-01",
        emitenteCnpj: "11222333000181",
        tomadorNome: "CLINICA BEM VIVER LTDA",
        tomadorDoc: "11444777000161",
        valorCentavos: 320000,
      },
    });
  });

  it("lê tomador pessoa física e converte a emissão para o dia em São Paulo", () => {
    const resultado = lerNfse(amostra("nota-cpf.xml"));
    expect(resultado).toMatchObject({
      tipo: "nota",
      nota: {
        numero: "71",
        tomadorNome: "MARCOS ALVES RIBEIRO",
        tomadorDoc: "52998224725",
        // 7500.50 sem passar por float.
        valorCentavos: 750050,
        // Emitida 00:40 de 01/11 no fuso -02:00, que é 23:40 de 31/10 em São Paulo.
        dataEmissao: "2026-10-31",
        dataCompetencia: "2026-10-31",
      },
    });
  });

  it("aceita nota sem tomador", () => {
    expect(lerNfse(amostra("nota-sem-tomador.xml"))).toMatchObject({
      tipo: "nota",
      nota: { numero: "72", tomadorNome: null, tomadorDoc: null, valorCentavos: 15000 },
    });
  });

  it("usa a data de emissão quando não há competência", () => {
    const xml = amostra("nota-cnpj.xml").replace("<dCompet>2026-10-01</dCompet>", "");
    expect(lerNfse(xml)).toMatchObject({
      tipo: "nota",
      nota: { dataEmissao: "2026-10-02", dataCompetencia: "2026-10-02" },
    });
  });

  it("ignora a assinatura digital do arquivo", () => {
    const semAssinatura = amostra("nota-cnpj.xml").replace(/<Signature[\s\S]*<\/Signature>/, "");
    expect(lerNfse(semAssinatura)).toEqual(lerNfse(amostra("nota-cnpj.xml")));
  });
});

describe("lerNfse — cancelamento", () => {
  it("lê o evento de cancelamento e devolve a chave da nota", () => {
    expect(lerNfse(amostra("cancelamento.xml"))).toEqual({
      tipo: "cancelamento",
      chave: "21112012211222333000181000000000007026101649923191",
    });
  });

  it("recusa evento que não é cancelamento", () => {
    const outro = amostra("cancelamento.xml").replace(/e101101/g, "e999999");
    expect(lerNfse(outro)).toMatchObject({ tipo: "erro" });
  });
});

describe("lerNfse — erros", () => {
  const erroDe = (xml: string) => {
    const resultado = lerNfse(xml);
    return resultado.tipo === "erro" ? resultado.mensagem : `leu como ${resultado.tipo}`;
  };

  it("recusa texto que não é XML", () => {
    expect(erroDe("isto não é xml")).toBe("O arquivo não é um XML válido.");
    expect(erroDe("")).toBe("O arquivo não é um XML válido.");
    expect(erroDe("<NFSe><infNFSe>")).toBe("O arquivo não é um XML válido.");
  });

  it("recusa XML de outro tipo de documento", () => {
    expect(erroDe("<nfeProc><NFe/></nfeProc>")).toBe(
      "O arquivo não é uma NFS-e do padrão nacional.",
    );
  });

  it("recusa nota com chave de acesso de tamanho errado", () => {
    const xml = amostra("nota-cnpj.xml").replace(
      'Id="NFS21112012211222333000181000000000007026101649923191"',
      'Id="NFS123"',
    );
    expect(erroDe(xml)).toBe("NFS-e sem chave de acesso válida.");
  });

  it("recusa nota sem valor do serviço ou com valor malformado", () => {
    const base = amostra("nota-cnpj.xml");
    expect(erroDe(base.replace("<vServ>3200.00</vServ>", ""))).toBe(
      "NFS-e sem valor do serviço válido.",
    );
    expect(erroDe(base.replace("<vServ>3200.00</vServ>", "<vServ>3.200,00</vServ>"))).toBe(
      "NFS-e sem valor do serviço válido.",
    );
  });

  it("recusa nota sem data de emissão ou com competência inválida", () => {
    const base = amostra("nota-cnpj.xml");
    expect(erroDe(base.replace(/<dhEmi>.*?<\/dhEmi>/, ""))).toBe(
      "NFS-e sem data de emissão válida.",
    );
    expect(erroDe(base.replace("<dCompet>2026-10-01</dCompet>", "<dCompet>2026-13-01</dCompet>"))).toBe(
      "NFS-e com data de competência inválida.",
    );
  });

  it("recusa nota sem a DPS", () => {
    const xml = amostra("nota-cnpj.xml").replace(/<DPS[\s\S]*<\/DPS>/, "");
    expect(erroDe(xml)).toBe("NFS-e sem a declaração de prestação de serviço (DPS).");
  });
});

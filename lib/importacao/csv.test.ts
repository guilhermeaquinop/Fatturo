// Testes do leitor de CSV. Equivalem a testes unitários de um Parser no Pest/PHPUnit.
// Os extratos são fictícios, nos formatos mais comuns dos bancos brasileiros.
import { describe, expect, it } from "vitest";
import {
  abrirCsv,
  dataDeCelula,
  detectarSeparador,
  lerCsv,
  mapeamentoCabe,
  sugerirMapeamento,
  type MapeamentoCsv,
  type TabelaCsv,
} from "@/lib/importacao/csv";

function tabela(texto: string): TabelaCsv {
  const aberta = abrirCsv(texto);
  if ("erro" in aberta) throw new Error(aberta.erro);
  return aberta;
}

async function extrato(texto: string, mapeamento: MapeamentoCsv) {
  const lido = await lerCsv(tabela(texto), mapeamento);
  if (lido.tipo !== "extrato") throw new Error(`esperava extrato, veio: ${lido.mensagem}`);
  return lido;
}

// Uma coluna de valor, com sinal, separado por vírgula.
const VALOR_UNICO = `Data,Valor,Identificador,Descrição
02/10/2026,3200.00,68de-1,Transferência recebida pelo Pix - CLINICA BEM VIVER
02/10/2026,-89.90,68de-2,Compra no débito - PADARIA
03/10/2026,-934.50,68de-3,Pagamento de boleto - DAS
`;
const MAPA_VALOR: MapeamentoCsv = {
  colunaData: 0,
  colunaDescricao: 3,
  colunaValor: 1,
  colunaCredito: null,
  colunaDebito: null,
};

// Crédito e débito em colunas separadas, ponto e vírgula, formato brasileiro e título antes.
const DUAS_COLUNAS = `Extrato Conta Corrente
Período: 01/10/2026 a 05/10/2026

Data Lançamento;Histórico;Crédito;Débito;Saldo
02/10/2026;PIX RECEBIDO;1.500,00;;1.500,00
03/10/2026;TARIFA;;12,90;1.487,10
04/10/2026;SALDO DO DIA;;;1.487,10
;Total;1.500,00;12,90;
`;
const MAPA_DUAS: MapeamentoCsv = {
  colunaData: 0,
  colunaDescricao: 1,
  colunaValor: null,
  colunaCredito: 2,
  colunaDebito: 3,
};

describe("dataDeCelula", () => {
  it("aceita os formatos de data dos extratos", () => {
    expect(dataDeCelula("02/10/2026")).toBe("2026-10-02");
    expect(dataDeCelula("2/10/26")).toBe("2026-10-02");
    expect(dataDeCelula("02-10-2026")).toBe("2026-10-02");
    expect(dataDeCelula("02.10.2026")).toBe("2026-10-02");
    expect(dataDeCelula("2026-10-02")).toBe("2026-10-02");
    expect(dataDeCelula("2026-10-02T14:30:00")).toBe("2026-10-02");
    expect(dataDeCelula("02/10/2026 14:30")).toBe("2026-10-02");
  });

  it("recusa o que não é data ou data que não existe", () => {
    expect(dataDeCelula("31/02/2026")).toBeNull();
    expect(dataDeCelula("Data")).toBeNull();
    expect(dataDeCelula("1.500,00")).toBeNull();
    expect(dataDeCelula("")).toBeNull();
  });
});

describe("detectarSeparador", () => {
  it("reconhece vírgula, ponto e vírgula e tabulação", () => {
    expect(detectarSeparador(VALOR_UNICO)).toBe(",");
    expect(detectarSeparador(DUAS_COLUNAS)).toBe(";");
    expect(detectarSeparador("Data\tValor\tDescrição\n01/10/2026\t10,00\tA\n")).toBe("\t");
  });

  it("não confunde a vírgula dos centavos com separador", () => {
    // Todas as linhas de dados têm duas vírgulas, mas o cabeçalho e as linhas têm quatro ";".
    const extrato =
      "Extrato Conta Corrente\r\n\r\nData;Histórico;Crédito;Débito;Saldo\r\n" +
      "09/10/2026;TED RECEBIDA;1.500,00;;1.500,00\r\n09/10/2026;TARIFA;;29,90;1.470,10\r\n";
    expect(detectarSeparador(extrato)).toBe(";");
    expect(tabela(extrato).colunas).toEqual(["Data", "Histórico", "Crédito", "Débito", "Saldo"]);
  });

  it("usa vírgula quando não há separador reconhecível", () => {
    expect(detectarSeparador("apenas um texto\n")).toBe(",");
  });
});

describe("abrirCsv", () => {
  it("separa o cabeçalho das linhas e monta a assinatura sem acento", () => {
    const aberta = tabela(VALOR_UNICO);
    expect(aberta.colunas).toEqual(["Data", "Valor", "Identificador", "Descrição"]);
    expect(aberta.linhas).toHaveLength(3);
    expect(aberta.assinatura).toBe("data|valor|identificador|descricao");
  });

  it("detecta ponto e vírgula e pula as linhas de título antes da tabela", () => {
    const aberta = tabela(DUAS_COLUNAS);
    expect(aberta.colunas).toEqual(["Data Lançamento", "Histórico", "Crédito", "Débito", "Saldo"]);
    expect(aberta.linhas[0]).toEqual(["02/10/2026", "PIX RECEBIDO", "1.500,00", "", "1.500,00"]);
  });

  it("nomeia as colunas quando o arquivo não tem cabeçalho", () => {
    const aberta = tabela("02/10/2026;PIX RECEBIDO;1500,00\n03/10/2026;TARIFA;-12,90\n");
    expect(aberta.colunas).toEqual(["Coluna 1", "Coluna 2", "Coluna 3"]);
    expect(aberta.linhas).toHaveLength(2);
    expect(aberta.assinatura).toBe("sem-cabecalho:3");
  });

  it("ignora a marca de ordem de bytes (BOM) do Excel", () => {
    expect(tabela(`﻿${VALOR_UNICO}`).colunas[0]).toBe("Data");
  });

  it("recusa arquivo sem tabela ou só com cabeçalho", () => {
    expect(abrirCsv("apenas um texto\n")).toEqual({
      erro: "O arquivo CSV não tem colunas de extrato.",
    });
    expect(abrirCsv("Data,Valor,Descrição\n")).toEqual({
      erro: "O arquivo CSV não tem lançamentos.",
    });
  });
});

describe("sugerirMapeamento", () => {
  it("reconhece data, descrição e valor pelo nome da coluna", () => {
    expect(sugerirMapeamento(["Data", "Valor", "Identificador", "Descrição"])).toEqual({
      colunaData: 0,
      colunaDescricao: 3,
      colunaValor: 1,
      colunaCredito: null,
      colunaDebito: null,
    });
  });

  it("prefere crédito e débito quando as duas colunas existem", () => {
    expect(
      sugerirMapeamento(["Data Lançamento", "Histórico", "Crédito", "Débito", "Saldo"]),
    ).toEqual({
      colunaData: 0,
      colunaDescricao: 1,
      colunaValor: null,
      colunaCredito: 2,
      colunaDebito: 3,
    });
  });

  it("deixa em branco o que não reconhece", () => {
    const palpite = sugerirMapeamento(["Coluna 1", "Coluna 2", "Coluna 3"]);
    expect(palpite.colunaData).toBeUndefined();
    expect(palpite.colunaDescricao).toBeUndefined();
    expect(palpite.colunaValor).toBeUndefined();
  });
});

describe("mapeamentoCabe", () => {
  it("confere se as colunas existem no arquivo", () => {
    expect(mapeamentoCabe(MAPA_VALOR, 4)).toBe(true);
    expect(mapeamentoCabe(MAPA_VALOR, 3)).toBe(false);
    expect(mapeamentoCabe(MAPA_DUAS, 5)).toBe(true);
  });
});

describe("lerCsv", () => {
  it("lê valor com sinal numa coluna só", async () => {
    const lido = await extrato(VALOR_UNICO, MAPA_VALOR);
    expect(lido.erros).toEqual([]);
    expect(lido.lancamentos).toHaveLength(3);
    expect(lido.lancamentos[0]).toMatchObject({
      data: "2026-10-02",
      valorCentavos: 320000,
      sentido: "entrada",
      descricao: "Transferência recebida pelo Pix - CLINICA BEM VIVER",
      contraparteNome: null,
    });
    expect(lido.lancamentos[2]).toMatchObject({ valorCentavos: 93450, sentido: "saida" });
  });

  it("lê crédito e débito em colunas separadas e pula saldo e total", async () => {
    const lido = await extrato(DUAS_COLUNAS, MAPA_DUAS);
    expect(lido.erros).toEqual([]);
    expect(lido.lancamentos.map((item) => [item.descricao, item.sentido, item.valorCentavos])).toEqual([
      ["PIX RECEBIDO", "entrada", 150000],
      ["TARIFA", "saida", 1290],
    ]);
  });

  it("gera o mesmo identificador para o mesmo lançamento em arquivos diferentes", async () => {
    const outubro = await extrato(VALOR_UNICO, MAPA_VALOR);
    // Extrato maior, que se sobrepõe ao anterior e traz um lançamento novo no fim.
    const maior = await extrato(`${VALOR_UNICO}04/10/2026,150.50,68de-4,Pix recebido\n`, MAPA_VALOR);
    expect(maior.lancamentos.slice(0, 3).map((item) => item.idExterno)).toEqual(
      outubro.lancamentos.map((item) => item.idExterno),
    );
    expect(new Set(maior.lancamentos.map((item) => item.idExterno)).size).toBe(4);
    expect(maior.lancamentos[0].idExterno).toMatch(/^csv:[0-9a-f]{64}$/);
  });

  it("distingue lançamentos idênticos no mesmo dia pela ordem", async () => {
    const repetido = "Data,Valor,Descrição\n02/10/2026,-5.00,TARIFA PIX\n02/10/2026,-5.00,TARIFA PIX\n";
    const lido = await extrato(repetido, { ...MAPA_VALOR, colunaDescricao: 2 });
    expect(lido.lancamentos).toHaveLength(2);
    expect(lido.lancamentos[0].idExterno).not.toBe(lido.lancamentos[1].idExterno);
  });

  it("lista a linha com data inválida e segue com as outras", async () => {
    const comErro = "Data,Valor,Descrição\n31/02/2026,10.00,A\n01/03/2026,10.00,B\n";
    const lido = await extrato(comErro, { ...MAPA_VALOR, colunaDescricao: 2 });
    expect(lido.erros).toEqual(["Linha 1: data inválida."]);
    expect(lido.lancamentos.map((item) => item.descricao)).toEqual(["B"]);
  });

  it("usa um texto padrão quando a descrição vem vazia", async () => {
    const lido = await extrato("Data,Valor,Descrição\n01/03/2026,10.00,\n", {
      ...MAPA_VALOR,
      colunaDescricao: 2,
    });
    expect(lido.lancamentos[0].descricao).toBe("Sem descrição");
  });

  it("recusa mapeamento que aponta para coluna que não existe", async () => {
    const lido = await lerCsv(tabela(VALOR_UNICO), { ...MAPA_VALOR, colunaDescricao: 9 });
    expect(lido).toEqual({
      tipo: "erro",
      mensagem: "O mapeamento de colunas não combina com este arquivo.",
    });
  });

  it("avisa quando o mapeamento não encontra lançamento algum", async () => {
    // A coluna escolhida como data é a de descrição: nenhuma linha tem data... mas tem texto,
    // então cada linha vira erro. Com a coluna de data vazia, nada é lido.
    const semData = "Data,Valor,Descrição\n,10.00,A\n,20.00,B\n";
    const lido = await lerCsv(tabela(semData), { ...MAPA_VALOR, colunaDescricao: 2 });
    expect(lido).toEqual({
      tipo: "erro",
      mensagem: "Nenhum lançamento encontrado com este mapeamento.",
    });
  });
});

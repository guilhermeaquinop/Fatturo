// Leitor de extrato bancário em OFX (o formato "Money" que os bancos exportam).
// Equivale a uma classe de Service/Parser no Laravel: função pura, sem banco e sem tela.
// Roda no navegador: o arquivo é lido aqui e só os lançamentos extraídos vão ao servidor.
//
// O OFX tem duas versões. A 1.x é SGML: as tags de valor não fecham (<TRNAMT>-50.00).
// A 2.x é XML, com tudo fechado. Este leitor procura as tags pelo nome e aceita as duas.
// Foi escrito pela especificação do formato, sem um extrato real para conferir.
import { dataIsoValida } from "@/lib/datas";
import { centavosDeTexto } from "@/lib/dinheiro";
import { limparEspacos } from "@/lib/importacao/texto";

export type LancamentoLido = {
  /** Identificador que impede duplicar ao reimportar. */
  idExterno: string;
  /** Dia do lançamento, "aaaa-mm-dd". */
  data: string;
  /** Sempre positivo; o sentido diz se entrou ou saiu. */
  valorCentavos: number;
  sentido: "entrada" | "saida";
  descricao: string;
  contraparteNome: string | null;
};

export type ExtratoLido =
  | { tipo: "extrato"; lancamentos: LancamentoLido[]; erros: string[] }
  | { tipo: "erro"; mensagem: string };

const DESCRICAO_MAXIMA = 300;

/** Valor de uma tag dentro de um trecho: o texto até a próxima tag ou o fim da linha. */
function tag(trecho: string, nome: string): string | undefined {
  const achado = new RegExp(`<${nome}>([^<\\r\\n]*)`, "i").exec(trecho);
  const valor = achado ? desescapar(achado[1]).trim() : "";
  return valor === "" ? undefined : valor;
}

/** Todos os blocos <NOME>...</NOME> de um trecho. */
function blocos(trecho: string, nome: string): string[] {
  const padrao = new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`, "gi");
  return [...trecho.matchAll(padrao)].map((achado) => achado[1]);
}

function desescapar(texto: string): string {
  return texto
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/** "20261002120000[-3:BRT]" vira "2026-10-02". O dia é o que o banco escreveu, sem converter fuso. */
function dataOfx(valor: string | undefined): string | null {
  const partes = /^(\d{4})(\d{2})(\d{2})/.exec(valor ?? "");
  if (!partes) return null;
  const iso = `${partes[1]}-${partes[2]}-${partes[3]}`;
  return dataIsoValida(iso) ? iso : null;
}

/** Identificação da conta de um extrato: banco, agência e número, o que houver. */
function contaDoExtrato(extrato: string): string {
  const origem = blocos(extrato, "BANKACCTFROM")[0] ?? blocos(extrato, "CCACCTFROM")[0] ?? "";
  const partes = [tag(origem, "BANKID"), tag(origem, "BRANCHID"), tag(origem, "ACCTID")];
  const conta = partes.filter((parte) => parte !== undefined).join("-");
  return conta === "" ? "sem-conta" : conta.replace(/\s+/g, "");
}

export function lerOfx(texto: string): ExtratoLido {
  if (!/<OFX>/i.test(texto)) {
    return { tipo: "erro", mensagem: "O arquivo não é um extrato OFX." };
  }

  // Um arquivo pode trazer mais de uma conta: cada uma vem num bloco de extrato próprio.
  const extratos = [...blocos(texto, "STMTRS"), ...blocos(texto, "CCSTMTRS")];
  // Arquivo que não fecha o bloco do extrato: lê o arquivo inteiro como uma conta só.
  if (extratos.length === 0 && /<STMTTRN>/i.test(texto)) extratos.push(texto);
  if (extratos.length === 0) {
    return { tipo: "erro", mensagem: "O arquivo OFX não tem extrato de conta." };
  }

  const lancamentos: LancamentoLido[] = [];
  const erros: string[] = [];
  let posicao = 0;

  for (const extrato of extratos) {
    const conta = contaDoExtrato(extrato);
    // Alguns bancos repetem o mesmo FITID em lançamentos diferentes; a repetição ganha um sufixo.
    const vistos = new Map<string, number>();

    for (const movimento of blocos(extrato, "STMTTRN")) {
      posicao += 1;
      const fitid = tag(movimento, "FITID");
      const data = dataOfx(tag(movimento, "DTPOSTED"));
      const valor = centavosDeTexto(tag(movimento, "TRNAMT") ?? "");

      if (!fitid) {
        erros.push(`Lançamento ${posicao} sem identificador (FITID).`);
        continue;
      }
      if (!data) {
        erros.push(`Lançamento ${posicao} com data inválida.`);
        continue;
      }
      if (valor === null) {
        erros.push(`Lançamento ${posicao} com valor inválido.`);
        continue;
      }
      // Linha de valor zero (saldo, aviso do banco) não é entrada nem saída.
      if (valor === 0) continue;

      const repeticao = (vistos.get(fitid) ?? 0) + 1;
      vistos.set(fitid, repeticao);

      const memo = tag(movimento, "MEMO");
      const nome = tag(movimento, "NAME");
      const descricao = limparEspacos(memo ?? nome ?? "Sem descrição").slice(0, DESCRICAO_MAXIMA);

      lancamentos.push({
        idExterno: `ofx:${conta}:${fitid}${repeticao > 1 ? `:${repeticao}` : ""}`,
        data,
        valorCentavos: Math.abs(valor),
        sentido: valor > 0 ? "entrada" : "saida",
        descricao,
        // Quando o banco manda os dois, NAME costuma ser a outra parte e MEMO o histórico.
        contraparteNome: memo && nome ? limparEspacos(nome).slice(0, 200) : null,
      });
    }
  }

  if (lancamentos.length === 0 && erros.length === 0) {
    return { tipo: "erro", mensagem: "O extrato não tem lançamentos no período." };
  }
  return { tipo: "extrato", lancamentos, erros };
}

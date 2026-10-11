// Leitor de XML da NFS-e nacional (padrão do Emissor Nacional, sped.fazenda.gov.br/nfse).
// Equivale a uma classe de Service/Parser no Laravel: função pura, sem banco e sem tela.
// Roda no navegador: o arquivo é lido aqui e só os dados extraídos vão ao servidor.
//
// Lê dois tipos de documento:
// - NFS-e (<NFSe>): a nota emitida.
// - Evento de cancelamento (<evento> com <e101101>): cancela uma nota pela chave de acesso.
//   Este foi escrito pelo leiaute oficial, sem um arquivo real para conferir.
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { limparCnpj, validarCnpj } from "@/lib/cnpj";
import { dataEmSaoPaulo, dataIsoValida } from "@/lib/datas";
import { centavosDeDecimal } from "@/lib/dinheiro";

export type NotaLida = {
  /** Chave de acesso: 50 dígitos. */
  chave: string;
  numero: string;
  /** Dia da emissão em São Paulo, "aaaa-mm-dd". */
  dataEmissao: string;
  /** Competência do serviço, "aaaa-mm-dd". */
  dataCompetencia: string;
  /** CNPJ de quem emitiu, sem máscara. */
  emitenteCnpj: string;
  tomadorNome: string | null;
  /** CPF ou CNPJ do tomador, sem máscara. */
  tomadorDoc: string | null;
  valorCentavos: number;
};

export type ResultadoLeitura =
  | { tipo: "nota"; nota: NotaLida }
  | { tipo: "cancelamento"; chave: string }
  | { tipo: "erro"; mensagem: string };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Mantém tudo como texto: "010101" não vira 10101 e "3200.00" não vira float.
  parseTagValue: false,
  parseAttributeValue: false,
  removeNSPrefix: true,
  trimValues: true,
});

type No = Record<string, unknown>;

function no(valor: unknown): No | undefined {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor)
    ? (valor as No)
    : undefined;
}

function texto(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

function erro(mensagem: string): ResultadoLeitura {
  return { tipo: "erro", mensagem };
}

const CHAVE = /^\d{50}$/;

/** Lê um XML e devolve a nota, o cancelamento ou o motivo de não ter conseguido ler. */
export function lerNfse(xml: string): ResultadoLeitura {
  if (XMLValidator.validate(xml) !== true) {
    return erro("O arquivo não é um XML válido.");
  }

  let documento: No;
  try {
    documento = parser.parse(xml) as No;
  } catch {
    return erro("O arquivo não é um XML válido.");
  }

  const evento = no(documento.evento);
  if (evento) return lerEvento(evento);

  const nfse = no(documento.NFSe);
  if (nfse) return lerNota(nfse);

  return erro("O arquivo não é uma NFS-e do padrão nacional.");
}

function lerNota(nfse: No): ResultadoLeitura {
  const inf = no(nfse.infNFSe);
  if (!inf) return erro("NFS-e sem o bloco de informações (infNFSe).");

  // A chave de acesso vem no atributo Id, depois do prefixo "NFS".
  const chave = texto(inf["@_Id"])?.replace(/^NFS/, "");
  if (!chave || !CHAVE.test(chave)) return erro("NFS-e sem chave de acesso válida.");

  const numero = texto(inf.nNFSe);
  if (!numero) return erro("NFS-e sem número.");

  const emitenteCnpj = limparCnpj(texto(no(inf.emit)?.CNPJ) ?? "");
  if (!validarCnpj(emitenteCnpj)) return erro("NFS-e sem CNPJ do emitente válido.");

  const dps = no(no(inf.DPS)?.infDPS);
  if (!dps) return erro("NFS-e sem a declaração de prestação de serviço (DPS).");

  // dhEmi traz data, hora e fuso; a nota vale pelo dia em São Paulo.
  const emissao = new Date(texto(dps.dhEmi) ?? "");
  if (Number.isNaN(emissao.getTime())) return erro("NFS-e sem data de emissão válida.");
  const dataEmissao = dataEmSaoPaulo(emissao);

  // Sem competência informada, vale a data de emissão.
  const dataCompetencia = texto(dps.dCompet) ?? dataEmissao;
  if (!dataIsoValida(dataCompetencia)) return erro("NFS-e com data de competência inválida.");

  const valorCentavos = centavosDeDecimal(
    texto(no(no(dps.valores)?.vServPrest)?.vServ) ?? "",
  );
  if (valorCentavos === null) return erro("NFS-e sem valor do serviço válido.");

  // O tomador é opcional, e pode ser pessoa jurídica (CNPJ) ou física (CPF).
  const tomador = no(dps.toma);
  const tomadorDoc = texto(tomador?.CNPJ) ?? texto(tomador?.CPF) ?? null;

  return {
    tipo: "nota",
    nota: {
      chave,
      numero,
      dataEmissao,
      dataCompetencia,
      emitenteCnpj,
      tomadorNome: texto(tomador?.xNome)?.slice(0, 200) ?? null,
      tomadorDoc: tomadorDoc && /^(\d{11}|[A-Z0-9]{12}\d{2})$/.test(tomadorDoc) ? tomadorDoc : null,
      valorCentavos,
    },
  };
}

function lerEvento(evento: No): ResultadoLeitura {
  const pedido = no(no(no(evento.infEvento)?.pedRegEvento)?.infPedReg);
  if (!pedido) return erro("Evento de NFS-e sem o pedido de registro.");

  // e101101 é o código do evento de cancelamento. Outros eventos não mudam o faturamento.
  if (pedido.e101101 === undefined) {
    return erro("Evento de NFS-e que não é cancelamento. Nada a importar.");
  }

  const chave = texto(pedido.chNFSe);
  if (!chave || !CHAVE.test(chave)) return erro("Cancelamento sem chave de acesso válida.");

  return { tipo: "cancelamento", chave };
}

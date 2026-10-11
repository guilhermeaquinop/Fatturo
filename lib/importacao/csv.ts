// Leitor de extrato bancário em CSV, para quando o banco não exporta OFX.
// Equivale a uma classe de Service/Parser no Laravel: funções puras, sem banco e sem tela.
// Roda no navegador: o arquivo é lido aqui e só os lançamentos extraídos vão ao servidor.
//
// O CSV não tem padrão: cada banco usa colunas, separador e formato de valor diferentes.
// Por isso a leitura tem dois passos: abrirCsv() separa cabeçalho e linhas, e lerCsv() extrai
// os lançamentos com o mapeamento de colunas informado pelo usuário (guardado por cabeçalho).
import Papa from "papaparse";
import { dataIsoValida, parseDataBr } from "@/lib/datas";
import { centavosDeTexto } from "@/lib/dinheiro";
import type { ExtratoLido, LancamentoLido } from "@/lib/importacao/ofx";
import { limparEspacos, sha256 } from "@/lib/importacao/texto";

export type TabelaCsv = {
  /** Nome de cada coluna. Sem cabeçalho no arquivo, "Coluna 1", "Coluna 2"... */
  colunas: string[];
  /** Linhas de dados, sem o cabeçalho. */
  linhas: string[][];
  /** Identifica o formato (o "banco"): o cabeçalho normalizado. */
  assinatura: string;
};

/** Posição das colunas, contando do zero. Valor numa coluna só ou em crédito e débito. */
export type MapeamentoCsv = {
  colunaData: number;
  colunaDescricao: number;
  colunaValor: number | null;
  colunaCredito: number | null;
  colunaDebito: number | null;
};

const DESCRICAO_MAXIMA = 300;
const COLUNAS_MAXIMAS = 40;

/** Minúsculas e sem acento, para comparar nomes de coluna. */
function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Data de uma célula: "02/10/2026", "02/10/26", "02-10-2026", "02.10.2026" ou "2026-10-02",
 * com ou sem hora depois. Devolve "aaaa-mm-dd" ou null.
 */
export function dataDeCelula(valor: string): string | null {
  const texto = valor.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) {
    const data = `${iso[1]}-${iso[2]}-${iso[3]}`;
    return dataIsoValida(data) ? data : null;
  }
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})(?!\d)/.exec(texto);
  if (!br) return null;
  const ano = br[3].length === 2 ? `20${br[3]}` : br[3];
  return parseDataBr(`${br[1].padStart(2, "0")}/${br[2].padStart(2, "0")}/${ano}`);
}

// Na ordem de preferência em caso de empate: no Brasil o mais comum é ponto e vírgula,
// porque a vírgula já é o separador decimal.
const SEPARADORES = [";", "\t", ",", "|"];
const LINHAS_PARA_DETECTAR = 30;

/**
 * Descobre o separador de colunas: o que aparece no mesmo número de vezes em mais linhas.
 * A detecção automática do Papa Parse erra em extratos brasileiros, em que a vírgula dos
 * centavos ("1.500,00") aparece em toda linha e parece um separador.
 */
export function detectarSeparador(texto: string): string {
  const linhas = texto
    .split(/\r?\n/)
    .filter((linha) => linha.trim() !== "")
    .slice(0, LINHAS_PARA_DETECTAR);

  let melhor = { separador: ",", linhas: 0 };
  for (const separador of SEPARADORES) {
    // Quantas linhas têm cada contagem do separador; vale a contagem mais repetida.
    const porContagem = new Map<number, number>();
    for (const linha of linhas) {
      const contagem = linha.split(separador).length - 1;
      if (contagem > 0) porContagem.set(contagem, (porContagem.get(contagem) ?? 0) + 1);
    }
    const maisRepetida = Math.max(0, ...porContagem.values());
    if (maisRepetida > melhor.linhas) melhor = { separador, linhas: maisRepetida };
  }
  return melhor.separador;
}

/**
 * Separa o cabeçalho das linhas. Linhas de título antes da tabela (comuns em extratos) são
 * puladas: o cabeçalho é a primeira linha com pelo menos duas células preenchidas.
 */
export function abrirCsv(texto: string): TabelaCsv | { erro: string } {
  const semBom = texto.replace(/^\ufeff/, "");
  const lido = Papa.parse<string[]>(semBom, {
    delimiter: detectarSeparador(semBom),
    skipEmptyLines: "greedy",
  });
  const linhas = lido.data.map((linha) => linha.map((celula) => celula.trim()));

  const inicio = linhas.findIndex((linha) => linha.filter((celula) => celula !== "").length >= 2);
  if (inicio === -1) return { erro: "O arquivo CSV não tem colunas de extrato." };

  const primeira = linhas[inicio];
  if (primeira.length > COLUNAS_MAXIMAS) return { erro: "O arquivo CSV tem colunas demais." };

  // Se a primeira linha já traz uma data, o arquivo não tem cabeçalho.
  const semCabecalho = primeira.some((celula) => dataDeCelula(celula) !== null);
  if (semCabecalho) {
    return {
      colunas: primeira.map((_, indice) => `Coluna ${indice + 1}`),
      linhas: linhas.slice(inicio),
      assinatura: `sem-cabecalho:${primeira.length}`,
    };
  }

  const dados = linhas.slice(inicio + 1);
  if (dados.length === 0) return { erro: "O arquivo CSV não tem lançamentos." };

  return {
    colunas: primeira.map((nome, indice) => (nome === "" ? `Coluna ${indice + 1}` : nome)),
    linhas: dados,
    assinatura: primeira.map(semAcento).join("|"),
  };
}

/** Palpite inicial do mapeamento, pelos nomes das colunas. O usuário confirma ou corrige. */
export function sugerirMapeamento(colunas: string[]): Partial<MapeamentoCsv> {
  const nomes = colunas.map(semAcento);
  // `fora` evita escolher de novo uma coluna já usada ("Data Lançamento" não é a descrição).
  const achar = (padrao: RegExp, fora?: number) => {
    const indice = nomes.findIndex((nome, posicao) => posicao !== fora && padrao.test(nome));
    return indice === -1 ? undefined : indice;
  };
  const data = achar(/^data|^date|^dt/);

  const credito = achar(/credito|entrada/);
  const debito = achar(/debito|saida/);
  const emDuasColunas = credito !== undefined && debito !== undefined;

  return {
    colunaData: data,
    colunaDescricao: achar(/descri|historico|lancamento|memo|detalhe|estabelecimento/, data),
    colunaValor: emDuasColunas ? null : (achar(/^valor|^amount|^montante|^quantia/) ?? undefined),
    colunaCredito: emDuasColunas ? credito : null,
    colunaDebito: emDuasColunas ? debito : null,
  };
}

/** Confere se o mapeamento aponta para colunas que existem na tabela. */
export function mapeamentoCabe(mapeamento: MapeamentoCsv, colunas: number): boolean {
  const usadas = [
    mapeamento.colunaData,
    mapeamento.colunaDescricao,
    mapeamento.colunaValor,
    mapeamento.colunaCredito,
    mapeamento.colunaDebito,
  ].filter((coluna): coluna is number => coluna !== null);
  return usadas.every((coluna) => Number.isInteger(coluna) && coluna >= 0 && coluna < colunas);
}

/** Valor da linha, com sinal: positivo é entrada. Null se não der para ler. */
function valorDaLinha(linha: string[], mapeamento: MapeamentoCsv): number | null {
  if (mapeamento.colunaValor !== null) return centavosDeTexto(linha[mapeamento.colunaValor] ?? "");

  const credito = (linha[mapeamento.colunaCredito ?? -1] ?? "").trim();
  const debito = (linha[mapeamento.colunaDebito ?? -1] ?? "").trim();
  const entrada = credito === "" ? 0 : centavosDeTexto(credito);
  const saida = debito === "" ? 0 : centavosDeTexto(debito);
  if (entrada === null || saida === null) return null;
  // Linha sem crédito nem débito (saldo do dia) conta como zero e é pulada.
  return Math.abs(entrada) - Math.abs(saida);
}

/**
 * Extrai os lançamentos da tabela. Uma linha com problema vira um erro no resumo e as outras
 * entram. Linhas sem data (títulos, saldos, totais) são puladas em silêncio.
 */
export async function lerCsv(tabela: TabelaCsv, mapeamento: MapeamentoCsv): Promise<ExtratoLido> {
  if (!mapeamentoCabe(mapeamento, tabela.colunas.length)) {
    return { tipo: "erro", mensagem: "O mapeamento de colunas não combina com este arquivo." };
  }

  const lancamentos: LancamentoLido[] = [];
  const erros: string[] = [];
  // Quantas vezes cada combinação de data, valor e descrição já apareceu no arquivo.
  const vistos = new Map<string, number>();

  for (const [indice, linha] of tabela.linhas.entries()) {
    const celulaData = (linha[mapeamento.colunaData] ?? "").trim();
    if (celulaData === "") continue;

    const numero = indice + 1;
    const data = dataDeCelula(celulaData);
    if (!data) {
      erros.push(`Linha ${numero}: data inválida.`);
      continue;
    }
    const valor = valorDaLinha(linha, mapeamento);
    if (valor === null) {
      erros.push(`Linha ${numero}: valor inválido.`);
      continue;
    }
    // Linha de valor zero (saldo do dia, por exemplo) não é entrada nem saída.
    if (valor === 0) continue;

    const descricao =
      limparEspacos(linha[mapeamento.colunaDescricao] ?? "").slice(0, DESCRICAO_MAXIMA) ||
      "Sem descrição";

    // O CSV não traz identificador do banco. A chave contra duplicados é um hash de data,
    // valor e descrição; lançamentos idênticos no mesmo dia se distinguem pela ordem (1º, 2º...).
    const base = `${data}|${valor}|${semAcento(descricao)}`;
    const posicao = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, posicao);

    lancamentos.push({
      idExterno: `csv:${await sha256(`${base}|${posicao}`)}`,
      data,
      valorCentavos: Math.abs(valor),
      sentido: valor > 0 ? "entrada" : "saida",
      descricao,
      contraparteNome: null,
    });
  }

  if (lancamentos.length === 0 && erros.length === 0) {
    return { tipo: "erro", mensagem: "Nenhum lançamento encontrado com este mapeamento." };
  }
  return { tipo: "extrato", lancamentos, erros };
}

// Rota GET /configuracoes/exportar/[tabela]: baixa um CSV com os dados da empresa.
// Equivale a um método de Controller que devolve response()->streamDownload() no Laravel.
// Um route.ts responde à requisição direto, sem página: aqui, com o arquivo para download.
// O RLS garante que só saem os dados da empresa de quem está logado.
import { NextResponse } from "next/server";
import { hojeIso } from "@/lib/datas";
import { empresaAtual, type EmpresaAtual } from "@/lib/empresa";
import { dataParaCsv, montarCsv, valorParaCsv, type Celula } from "@/lib/exportacao";
import { createClient } from "@/lib/supabase/server";
import { ROTULO_ANEXO, ROTULO_ATIVIDADE, ROTULO_REGIME } from "@/lib/validacao/empresa";
import { ROTULO_CATEGORIA } from "@/lib/validacao/lancamento";
import { tabelaExportada } from "../tabelas";

// O Supabase devolve no máximo 1000 linhas por consulta; a leitura é feita em páginas.
const PAGINA = 1000;

type Cliente = Awaited<ReturnType<typeof createClient>>;
type Arquivo = { cabecalho: string[]; linhas: Celula[][]; colunasDeTexto: number[] };

/** Lê todas as páginas de uma consulta. `pagina` recebe o intervalo e devolve as linhas. */
async function todas<T>(
  pagina: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await pagina(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(`Não foi possível exportar: ${error.message}`);
    linhas.push(...(data ?? []));
    if ((data ?? []).length < PAGINA) return linhas;
  }
}

function empresa(dados: EmpresaAtual): Arquivo {
  return {
    cabecalho: [
      "CNPJ", "Nome", "Data de abertura", "Atividade", "Porte", "Regime", "Anexo",
      "Início do período", "Fim do período",
    ],
    // Uma linha por período do enquadramento, com os dados da empresa repetidos.
    linhas: dados.enquadramentos.map((periodo) => [
      dados.cnpj,
      dados.nome,
      dataParaCsv(dados.dataAbertura),
      ROTULO_ATIVIDADE[dados.atividade],
      periodo.porte,
      ROTULO_REGIME[periodo.regime],
      periodo.anexo ? ROTULO_ANEXO[periodo.anexo] : "",
      dataParaCsv(periodo.inicioEm),
      dataParaCsv(periodo.fimEm),
    ]),
    colunasDeTexto: [1],
  };
}

async function notas(supabase: Cliente, empresaId: string): Promise<Arquivo> {
  const linhas = await todas((de, ate) =>
    supabase
      .from("nota_fiscal")
      .select(
        "numero, chave_acesso, data_emissao, data_competencia, tomador_nome, tomador_doc, valor_centavos, situacao",
      )
      .eq("empresa_id", empresaId)
      .order("data_competencia")
      .order("id")
      .range(de, ate),
  );
  return {
    cabecalho: [
      "Número", "Chave de acesso", "Emissão", "Competência", "Tomador", "CPF ou CNPJ do tomador",
      "Valor", "Situação",
    ],
    linhas: linhas.map((nota) => [
      nota.numero,
      nota.chave_acesso,
      dataParaCsv(nota.data_emissao),
      dataParaCsv(nota.data_competencia),
      nota.tomador_nome,
      nota.tomador_doc,
      valorParaCsv(nota.valor_centavos),
      nota.situacao === "cancelada" ? "Cancelada" : "Emitida",
    ]),
    colunasDeTexto: [4],
  };
}

async function das(supabase: Cliente, empresaId: string): Promise<Arquivo> {
  const linhas = await todas((de, ate) =>
    supabase
      .from("guia_das")
      .select("competencia, vencimento, valor_centavos, pago_em")
      .eq("empresa_id", empresaId)
      .order("competencia")
      .range(de, ate),
  );
  return {
    cabecalho: ["Competência", "Vencimento", "Valor", "Pago em"],
    linhas: linhas.map((guia) => [
      // Só mês e ano: "07/2026".
      dataParaCsv(guia.competencia).slice(3),
      dataParaCsv(guia.vencimento),
      valorParaCsv(guia.valor_centavos),
      dataParaCsv(guia.pago_em),
    ]),
    colunasDeTexto: [],
  };
}

async function lancamentos(supabase: Cliente, empresaId: string): Promise<Arquivo> {
  const linhas = await todas((de, ate) =>
    supabase
      .from("lancamento")
      .select("data, sentido, valor_centavos, descricao, contraparte_nome, categoria, origem")
      .eq("empresa_id", empresaId)
      .order("data")
      .order("id")
      .range(de, ate),
  );
  return {
    cabecalho: ["Data", "Tipo", "Valor", "Descrição", "Remetente ou destinatário", "Categoria", "Origem"],
    linhas: linhas.map((item) => [
      dataParaCsv(item.data),
      item.sentido === "entrada" ? "Entrada" : "Saída",
      // Saída com sinal de menos, para a coluna somar certo.
      valorParaCsv(item.sentido === "entrada" ? item.valor_centavos : -item.valor_centavos),
      item.descricao,
      item.contraparte_nome,
      item.categoria ? ROTULO_CATEGORIA[item.categoria] : "Sem classificação",
      item.origem === "arquivo" ? "Extrato" : "Manual",
    ]),
    colunasDeTexto: [3, 4],
  };
}

export async function GET(_requisicao: Request, { params }: RouteContext<"/configuracoes/exportar/[tabela]">) {
  const tabela = tabelaExportada((await params).tabela);
  if (!tabela) return new NextResponse("Exportação não encontrada.", { status: 404 });

  const dados = await empresaAtual();
  if (!dados) return new NextResponse("Empresa não configurada.", { status: 404 });

  const supabase = await createClient();
  const arquivo =
    tabela === "empresa"
      ? empresa(dados)
      : tabela === "notas"
        ? await notas(supabase, dados.id)
        : tabela === "das"
          ? await das(supabase, dados.id)
          : await lancamentos(supabase, dados.id);

  return new NextResponse(montarCsv(arquivo.cabecalho, arquivo.linhas, arquivo.colunasDeTexto), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fatturo-${tabela}-${hojeIso()}.csv"`,
      // Dados pessoais: nada de guardar em cache.
      "Cache-Control": "no-store",
    },
  });
}

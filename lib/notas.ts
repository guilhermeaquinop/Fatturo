// Leitura das notas fiscais da empresa, para o painel e para a tela de Notas.
// Equivale a um Repository (ou a um scope do Eloquent como NotaFiscal::doPeriodo()) no Laravel.
import "server-only";
import type { NotaDoPainel } from "@/lib/regras/faturamento";
import { createClient } from "@/lib/supabase/server";

// O Supabase devolve no máximo 1000 linhas por consulta; a leitura é feita em páginas.
const PAGINA = 1000;

/** Notas com competência entre as duas datas (inclusive), "aaaa-mm-dd". */
export async function notasDoPeriodo(
  empresaId: string,
  de: string,
  ate: string,
): Promise<NotaDoPainel[]> {
  const supabase = await createClient();
  const notas: NotaDoPainel[] = [];

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("nota_fiscal")
      .select("data_competencia, valor_centavos, situacao, tomador_nome, tomador_doc")
      .eq("empresa_id", empresaId)
      .gte("data_competencia", de)
      .lte("data_competencia", ate)
      // Ordem estável, para as páginas não repetirem nem pularem linhas.
      .order("data_competencia")
      .order("id")
      .range(inicio, inicio + PAGINA - 1);

    if (error) throw new Error(`Não foi possível ler as notas: ${error.message}`);

    for (const linha of data) {
      notas.push({
        dataCompetencia: linha.data_competencia,
        valorCentavos: linha.valor_centavos,
        situacao: linha.situacao,
        tomadorNome: linha.tomador_nome,
        tomadorDoc: linha.tomador_doc,
      });
    }

    if (data.length < PAGINA) return notas;
  }
}

/** Uma nota como aparece na tela de Notas. */
export type Nota = {
  id: string;
  numero: string;
  /** "aaaa-mm-dd". */
  dataEmissao: string;
  /** "aaaa-mm-dd". É a data que posiciona a nota no faturamento. */
  dataCompetencia: string;
  tomadorNome: string | null;
  /** CPF ou CNPJ, sem máscara. */
  tomadorDoc: string | null;
  valorCentavos: number;
  situacao: "emitida" | "cancelada";
};

/** Todas as notas da empresa, da competência mais recente para a mais antiga. */
export async function todasAsNotas(empresaId: string): Promise<Nota[]> {
  const supabase = await createClient();
  const notas: Nota[] = [];

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("nota_fiscal")
      .select(
        "id, numero, data_emissao, data_competencia, tomador_nome, tomador_doc, valor_centavos, situacao",
      )
      .eq("empresa_id", empresaId)
      .order("data_competencia", { ascending: false })
      .order("data_emissao", { ascending: false })
      .order("id")
      .range(inicio, inicio + PAGINA - 1);

    if (error) throw new Error(`Não foi possível ler as notas: ${error.message}`);

    for (const linha of data) {
      notas.push({
        id: linha.id,
        numero: linha.numero,
        dataEmissao: linha.data_emissao,
        dataCompetencia: linha.data_competencia,
        tomadorNome: linha.tomador_nome,
        tomadorDoc: linha.tomador_doc,
        valorCentavos: linha.valor_centavos,
        situacao: linha.situacao,
      });
    }

    if (data.length < PAGINA) return notas;
  }
}

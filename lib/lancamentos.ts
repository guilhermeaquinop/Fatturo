// Leitura dos lançamentos da empresa para a tela de Lançamentos.
// Equivale a um Repository (ou a scopes do Eloquent como Lancamento::doMes()) no Laravel.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Categoria, Sentido } from "@/lib/validacao/lancamento";

export type Lancamento = {
  id: string;
  /** "aaaa-mm-dd". */
  data: string;
  /** Sempre positivo; o sentido diz se entrou ou saiu. */
  valorCentavos: number;
  sentido: Sentido;
  descricao: string;
  contraparteNome: string | null;
  /** Null = sem classificação. */
  categoria: Categoria | null;
  origem: "arquivo" | "manual";
};

const COLUNAS = "id, data, valor_centavos, sentido, descricao, contraparte_nome, categoria, origem";
// O Supabase devolve no máximo 1000 linhas por consulta; a leitura é feita em páginas.
const PAGINA = 1000;

type Linha = {
  id: string;
  data: string;
  valor_centavos: number;
  sentido: Sentido;
  descricao: string;
  contraparte_nome: string | null;
  categoria: Categoria | null;
  origem: "arquivo" | "manual";
};

function deLinha(linha: Linha): Lancamento {
  return {
    id: linha.id,
    data: linha.data,
    valorCentavos: linha.valor_centavos,
    sentido: linha.sentido,
    descricao: linha.descricao,
    contraparteNome: linha.contraparte_nome,
    categoria: linha.categoria,
    origem: linha.origem,
  };
}

/** Lançamentos com data entre as duas datas (inclusive), do mais recente ao mais antigo. */
export async function lancamentosDoPeriodo(
  empresaId: string,
  de: string,
  ate: string,
): Promise<Lancamento[]> {
  const supabase = await createClient();
  const lancamentos: Lancamento[] = [];

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from("lancamento")
      .select(COLUNAS)
      .eq("empresa_id", empresaId)
      .gte("data", de)
      .lte("data", ate)
      // Ordem estável, para as páginas não repetirem nem pularem linhas.
      .order("data", { ascending: false })
      .order("criado_em", { ascending: false })
      .order("id")
      .range(inicio, inicio + PAGINA - 1);

    if (error) throw new Error(`Não foi possível ler os lançamentos: ${error.message}`);
    lancamentos.push(...data.map(deLinha));
    if (data.length < PAGINA) return lancamentos;
  }
}

/** Um lançamento pelo id, ou null se não existir (ou for de outra empresa: o RLS esconde). */
export async function lancamentoPorId(id: string): Promise<Lancamento | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lancamento").select(COLUNAS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível ler o lançamento: ${error.message}`);
  return data ? deLinha(data) : null;
}

/** Quantos lançamentos da empresa ainda estão sem categoria, em todos os meses. */
export async function contarSemClassificacao(empresaId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("lancamento")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .is("categoria", null);
  if (error) throw new Error(`Não foi possível contar os lançamentos: ${error.message}`);
  return count ?? 0;
}

/** Data do lançamento mais recente da empresa, ou null se não há nenhum. */
export async function dataDoUltimoLancamento(empresaId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamento")
    .select("data")
    .eq("empresa_id", empresaId)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Não foi possível ler os lançamentos: ${error.message}`);
  return data?.data ?? null;
}

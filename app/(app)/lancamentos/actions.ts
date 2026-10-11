"use server";

// Server Actions dos lançamentos — equivalem aos métodos store(), update() e destroy() de um
// LancamentoController, mais a classificação em lote. Validam de novo com os mesmos esquemas
// Zod do formulário. O RLS garante que só os lançamentos da empresa do usuário são tocados.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDataBr } from "@/lib/datas";
import { centavosDeTexto } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import {
  classificacaoEmLoteSchema,
  lancamentoEditavelSchema,
  lancamentoSchema,
} from "@/lib/validacao/lancamento";

export type ResultadoAcao = { erro: string } | undefined;

const ROTA = "/lancamentos";
const ERRO_DE_CAMPOS = "Confira os campos e tente de novo.";
const ERRO_GERAL = "Não foi possível salvar agora. Tente de novo em instantes.";

/** Volta para a lista no mês do lançamento salvo. */
function voltarParaOMes(dataIso: string): never {
  revalidatePath(ROTA);
  redirect(`${ROTA}?mes=${dataIso.slice(0, 7)}`);
}

/** Cria um lançamento manual. Aceita data passada, para registrar o que veio antes do Fatturo. */
export async function criarLancamento(dados: unknown): Promise<ResultadoAcao> {
  const validado = lancamentoSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DE_CAMPOS };

  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const data = parseDataBr(validado.data.data);
  const valor = centavosDeTexto(validado.data.valor);
  if (!data || valor === null) return { erro: ERRO_DE_CAMPOS };

  const supabase = await createClient();
  const { error } = await supabase.from("lancamento").insert({
    empresa_id: empresa.id,
    data,
    valor_centavos: valor,
    sentido: validado.data.sentido,
    descricao: validado.data.descricao,
    contraparte_nome: validado.data.contraparteNome || null,
    categoria: validado.data.categoria || null,
    origem: "manual",
  });

  if (error) {
    console.error("Falha ao criar lançamento:", error.code ?? error.message);
    return { erro: ERRO_GERAL };
  }
  voltarParaOMes(data);
}

/**
 * Atualiza um lançamento. No manual muda tudo; no importado, só descrição, contraparte e
 * categoria (data, valor e sentido são os do banco, e o banco de dados também barra a troca).
 */
export async function atualizarLancamento(id: string, dados: unknown): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("lancamento")
    .select("origem, data")
    .eq("id", id)
    .maybeSingle();
  if (!atual) return { erro: "Lançamento não encontrado." };

  if (atual.origem === "manual") {
    const validado = lancamentoSchema.safeParse(dados);
    if (!validado.success) return { erro: ERRO_DE_CAMPOS };
    const data = parseDataBr(validado.data.data);
    const valor = centavosDeTexto(validado.data.valor);
    if (!data || valor === null) return { erro: ERRO_DE_CAMPOS };

    const { error } = await supabase
      .from("lancamento")
      .update({
        data,
        valor_centavos: valor,
        sentido: validado.data.sentido,
        descricao: validado.data.descricao,
        contraparte_nome: validado.data.contraparteNome || null,
        categoria: validado.data.categoria || null,
      })
      .eq("id", id);
    if (error) {
      console.error("Falha ao atualizar lançamento:", error.code ?? error.message);
      return { erro: ERRO_GERAL };
    }
    voltarParaOMes(data);
  }

  const validado = lancamentoEditavelSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DE_CAMPOS };

  const { error } = await supabase
    .from("lancamento")
    .update({
      descricao: validado.data.descricao,
      contraparte_nome: validado.data.contraparteNome || null,
      categoria: validado.data.categoria || null,
    })
    .eq("id", id);
  if (error) {
    console.error("Falha ao atualizar lançamento:", error.code ?? error.message);
    return { erro: ERRO_GERAL };
  }
  voltarParaOMes(atual.data);
}

/** Exclui um lançamento. */
export async function excluirLancamento(id: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lancamento").delete().eq("id", id).select("data");

  if (error) {
    console.error("Falha ao excluir lançamento:", error.code ?? error.message);
    return { erro: "Não foi possível excluir agora. Tente de novo em instantes." };
  }
  if (data.length === 0) return { erro: "Lançamento não encontrado." };
  voltarParaOMes(data[0].data);
}

/** Aplica uma categoria (ou "sem classificação") a vários lançamentos de uma vez. */
export async function classificarEmLote(
  dados: unknown,
): Promise<{ ok: true; alterados: number } | { ok: false; erro: string }> {
  const validado = classificacaoEmLoteSchema.safeParse(dados);
  if (!validado.success) return { ok: false, erro: "Selecione os lançamentos e a categoria." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamento")
    .update({ categoria: validado.data.categoria || null })
    .in("id", validado.data.ids)
    .select("id");

  if (error) {
    console.error("Falha ao classificar lançamentos:", error.code ?? error.message);
    return { ok: false, erro: "Não foi possível classificar agora. Tente de novo em instantes." };
  }
  revalidatePath(ROTA);
  return { ok: true, alterados: data.length };
}

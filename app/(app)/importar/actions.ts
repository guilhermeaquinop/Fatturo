"use server";

// Server Actions da importação — equivalem aos métodos de um ImportacaoController.
// Recebem só os dados que o navegador extraiu do arquivo (nunca o arquivo), validam de novo
// com o mesmo esquema Zod e gravam tudo numa transação, pelas funções importar_nfse e
// importar_extrato do banco. Também guardam o mapeamento de colunas dos extratos em CSV.
import { revalidatePath } from "next/cache";
import { empresaAtual } from "@/lib/empresa";
import { createClient } from "@/lib/supabase/server";
import { arquivoNfseSchema } from "@/lib/validacao/importacao";
import {
  extratoSchema,
  mapeamentoCsvSchema,
  type MapeamentoCsvDados,
} from "@/lib/validacao/lancamento";

export type ResultadoImportacao =
  | {
      ok: true;
      novos: number;
      duplicados: number;
      cancelados: number;
      erros: number;
      /** Explicação dos erros, uma frase por tipo de problema. */
      mensagens: string[];
    }
  | { ok: false; erro: string };

// Código do Postgres para violação de chave única.
const CHAVE_DUPLICADA = "23505";

type RetornoDoBanco = {
  novos: number;
  duplicados: number;
  cancelados: number;
  nao_encontrados: number;
};

export async function importarNfse(dados: unknown): Promise<ResultadoImportacao> {
  const validado = arquivoNfseSchema.safeParse(dados);
  if (!validado.success) return { ok: false, erro: "Não foi possível ler os dados do arquivo." };

  const empresa = await empresaAtual();
  if (!empresa) return { ok: false, erro: "Configure a empresa antes de importar arquivos." };

  const { nome, hash, notas, cancelamentos } = validado.data;

  // Só entram notas emitidas pela própria empresa.
  const proprias = notas.filter((nota) => nota.emitenteCnpj === empresa.cnpj);
  const deOutroCnpj = notas.length - proprias.length;
  if (proprias.length === 0 && cancelamentos.length === 0) {
    return { ok: false, erro: "Nota emitida por outro CNPJ. Só entram notas da sua empresa." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("importar_nfse", {
    p_nome: nome,
    p_hash: hash,
    p_notas: proprias.map((nota) => ({
      chave: nota.chave,
      numero: nota.numero,
      data_emissao: nota.dataEmissao,
      data_competencia: nota.dataCompetencia,
      tomador_nome: nota.tomadorNome,
      tomador_doc: nota.tomadorDoc,
      valor_centavos: nota.valorCentavos,
    })),
    p_cancelamentos: cancelamentos,
    p_erros: deOutroCnpj,
  });

  if (error) {
    if (error.code === CHAVE_DUPLICADA) {
      return { ok: false, erro: "Este arquivo já foi importado. Nada foi alterado." };
    }
    console.error("Falha ao importar NFS-e:", error.code ?? error.message);
    return { ok: false, erro: "Não foi possível importar agora. Tente de novo em instantes." };
  }

  const retorno = data as RetornoDoBanco;
  const mensagens: string[] = [];
  if (deOutroCnpj > 0) mensagens.push("Nota emitida por outro CNPJ foi ignorada.");
  if (retorno.nao_encontrados > 0) {
    mensagens.push("Cancelamento de uma nota que ainda não foi importada. Importe a nota primeiro.");
  }

  // O painel mostrado depois precisa refletir as notas novas.
  revalidatePath("/painel");

  return {
    ok: true,
    novos: retorno.novos,
    duplicados: retorno.duplicados,
    cancelados: retorno.cancelados,
    erros: deOutroCnpj + retorno.nao_encontrados,
    mensagens,
  };
}

/** Importa os lançamentos lidos de um extrato OFX ou CSV. */
export async function importarExtrato(dados: unknown): Promise<ResultadoImportacao> {
  const validado = extratoSchema.safeParse(dados);
  if (!validado.success) return { ok: false, erro: "Não foi possível ler os dados do arquivo." };

  if (!(await empresaAtual())) {
    return { ok: false, erro: "Configure a empresa antes de importar arquivos." };
  }

  const { nome, tipo, hash, lancamentos, erros } = validado.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("importar_extrato", {
    p_nome: nome,
    p_tipo: tipo,
    p_hash: hash,
    p_lancamentos: lancamentos.map((item) => ({
      id_externo: item.idExterno,
      data: item.data,
      valor_centavos: item.valorCentavos,
      sentido: item.sentido,
      descricao: item.descricao,
      contraparte_nome: item.contraparteNome,
    })),
    p_erros: erros,
  });

  if (error) {
    if (error.code === CHAVE_DUPLICADA) {
      return { ok: false, erro: "Este arquivo já foi importado. Nada foi alterado." };
    }
    console.error("Falha ao importar extrato:", error.code ?? error.message);
    return { ok: false, erro: "Não foi possível importar agora. Tente de novo em instantes." };
  }

  const retorno = data as { novos: number; duplicados: number };
  revalidatePath("/lancamentos");

  return {
    ok: true,
    novos: retorno.novos,
    duplicados: retorno.duplicados,
    cancelados: 0,
    erros,
    mensagens: [],
  };
}

type MapeamentoSalvo = Omit<MapeamentoCsvDados, "assinatura">;

/** Mapeamento de colunas já guardado para este formato de CSV, ou null na primeira vez. */
export async function mapeamentoCsvSalvo(assinatura: unknown): Promise<MapeamentoSalvo | null> {
  if (typeof assinatura !== "string" || assinatura === "" || assinatura.length > 1000) return null;

  const empresa = await empresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("mapeamento_csv")
    .select("coluna_data, coluna_descricao, coluna_valor, coluna_credito, coluna_debito")
    .eq("empresa_id", empresa.id)
    .eq("assinatura", assinatura)
    .maybeSingle();
  if (!data) return null;

  return {
    colunaData: data.coluna_data,
    colunaDescricao: data.coluna_descricao,
    colunaValor: data.coluna_valor,
    colunaCredito: data.coluna_credito,
    colunaDebito: data.coluna_debito,
  };
}

/** Guarda (ou troca) o mapeamento de colunas de um formato de CSV. */
export async function salvarMapeamentoCsv(dados: unknown): Promise<{ ok: boolean }> {
  const validado = mapeamentoCsvSchema.safeParse(dados);
  if (!validado.success) return { ok: false };

  const empresa = await empresaAtual();
  if (!empresa) return { ok: false };

  const { assinatura } = validado.data;
  const colunas = {
    coluna_data: validado.data.colunaData,
    coluna_descricao: validado.data.colunaDescricao,
    coluna_valor: validado.data.colunaValor,
    coluna_credito: validado.data.colunaCredito,
    coluna_debito: validado.data.colunaDebito,
  };

  // Atualiza o mapeamento deste formato, se já existir; senão, cria. (Como um updateOrCreate.)
  const supabase = await createClient();
  const atualizacao = await supabase
    .from("mapeamento_csv")
    .update(colunas)
    .eq("empresa_id", empresa.id)
    .eq("assinatura", assinatura)
    .select("id");
  let erro = atualizacao.error;
  if (!erro && atualizacao.data?.length === 0) {
    const criacao = await supabase
      .from("mapeamento_csv")
      .insert({ empresa_id: empresa.id, assinatura, ...colunas });
    erro = criacao.error;
  }

  if (erro) console.error("Falha ao salvar o mapeamento do CSV:", erro.code ?? erro.message);
  return { ok: !erro };
}

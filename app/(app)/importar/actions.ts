"use server";

// Server Action da importação de NFS-e — equivale ao método store() de um ImportacaoController.
// Recebe só os dados que o navegador extraiu do XML (nunca o arquivo), valida de novo com
// o mesmo esquema Zod e grava tudo numa transação, pela função importar_nfse do banco.
import { revalidatePath } from "next/cache";
import { empresaAtual } from "@/lib/empresa";
import { createClient } from "@/lib/supabase/server";
import { arquivoNfseSchema } from "@/lib/validacao/importacao";

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

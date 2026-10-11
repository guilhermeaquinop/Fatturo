"use server";

// Server Action da configuração inicial — equivale ao método store() de um EmpresaController.
// Valida de novo com o mesmo esquema Zod do formulário e grava empresa e enquadramento
// numa transação só, pela função configurar_empresa do banco.
import { redirect } from "next/navigation";
import { limparCnpj } from "@/lib/cnpj";
import { parseDataBr } from "@/lib/datas";
import { ROTA_INICIAL, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import { anexoParaGravar, empresaSchema } from "@/lib/validacao/empresa";

export type ResultadoAcao = { erro: string } | undefined;

// Código do Postgres para violação de chave única.
const CHAVE_DUPLICADA = "23505";

export async function salvarEmpresa(dados: unknown): Promise<ResultadoAcao> {
  const validado = empresaSchema.safeParse(dados);
  if (!validado.success) return { erro: "Confira os campos e tente de novo." };

  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims) redirect(ROTA_LOGIN);

  const dataAbertura = parseDataBr(validado.data.dataAbertura);
  if (!dataAbertura) return { erro: "Confira a data de abertura e tente de novo." };

  const { error } = await supabase.rpc("configurar_empresa", {
    p_cnpj: limparCnpj(validado.data.cnpj),
    p_nome: validado.data.nome,
    p_data_abertura: dataAbertura,
    p_atividade: validado.data.atividade,
    p_porte: validado.data.porte,
    p_regime: validado.data.regime,
    p_anexo: anexoParaGravar(validado.data) ?? undefined,
  });

  if (error) {
    if (error.code === CHAVE_DUPLICADA) {
      // O usuário já tem empresa (por exemplo, salvou em outra aba): segue para o app.
      if (error.message.includes("empresa_usuario_id_key")) redirect(ROTA_INICIAL);
      return { erro: "Este CNPJ já está cadastrado em outra conta." };
    }
    console.error("Falha ao salvar a empresa:", error.code ?? error.message);
    return { erro: "Não foi possível salvar agora. Tente de novo em instantes." };
  }

  redirect(ROTA_INICIAL);
}

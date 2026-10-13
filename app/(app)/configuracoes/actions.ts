"use server";

// Server Actions da tela de Configurações — equivalem aos métodos de um ConfiguracaoController
// (e de um ProfileController, na parte de senha e conta). Cada formulário da tela chama uma.
// Todas validam de novo com o mesmo esquema Zod do formulário; o RLS garante que só os dados
// do usuário logado são alcançados.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDataBr } from "@/lib/datas";
import { empresaAtual } from "@/lib/empresa";
import { ROTA_CONTA_INATIVA, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import {
  alertasSchema,
  anexoSchema,
  dadosDaEmpresaSchema,
  exclusaoDaContaSchema,
  inativacaoDaContaSchema,
  mudancaDeEnquadramentoSchema,
  perfilSchema,
  trocaDeSenhaSchema,
} from "@/lib/validacao/configuracoes";

export type Resultado = { ok: true } | { ok: false; erro: string };

const ERRO_DE_CAMPOS: Resultado = { ok: false, erro: "Confira os campos e tente de novo." };
const ERRO_GERAL: Resultado = {
  ok: false,
  erro: "Não foi possível salvar agora. Tente de novo em instantes.",
};
const SENHA_ERRADA: Resultado = { ok: false, erro: "Senha incorreta." };

// O enquadramento muda o limite do painel e o porte de cada mês do DAS.
function revalidarTudo() {
  revalidatePath("/configuracoes");
  revalidatePath("/painel");
  revalidatePath("/das");
}

/** Confere a senha do usuário logado antes de uma ação sensível. */
async function senhaConfere(senha: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;
  if (typeof email !== "string") return false;

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  return !error;
}

/** Salva o nome e o avatar de quem está logado. */
export async function salvarPerfil(dados: unknown): Promise<Resultado> {
  const validado = perfilSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(ROTA_LOGIN);

  const { error } = await supabase
    .from("usuario")
    .update({ nome: validado.data.nome, avatar: Number(validado.data.avatar) })
    .eq("id", data.claims.sub);
  if (error) {
    console.error("Falha ao salvar o perfil:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  // O nome e o avatar aparecem no menu de todas as telas.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function salvarDadosDaEmpresa(dados: unknown): Promise<Resultado> {
  const validado = dadosDaEmpresaSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;

  const empresa = await empresaAtual();
  if (!empresa) return ERRO_GERAL;

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresa")
    .update({ nome: validado.data.nome, atividade: validado.data.atividade })
    .eq("id", empresa.id);
  if (error) {
    console.error("Falha ao salvar a empresa:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  // O nome da empresa aparece no menu de todas as telas.
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Registra a mudança de porte ou de anexo a partir de uma data (ex.: MEI para ME). */
export async function registrarMudancaDeEnquadramento(dados: unknown): Promise<Resultado> {
  const validado = mudancaDeEnquadramentoSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;

  const inicioEm = parseDataBr(validado.data.inicioEm);
  if (!inicioEm) return ERRO_DE_CAMPOS;
  const { porte } = validado.data;
  const anexo = porte === "ME" && validado.data.anexo !== "" ? validado.data.anexo : undefined;

  const supabase = await createClient();
  const { error } = await supabase.rpc("mudar_enquadramento", {
    p_porte: porte,
    p_inicio_em: inicioEm,
    p_anexo: anexo,
  });

  if (error) {
    // Códigos definidos na função mudar_enquadramento do banco.
    if (error.code === "P0002") {
      return { ok: false, erro: "A data da mudança não pode estar no futuro." };
    }
    if (error.code === "P0003") {
      return {
        ok: false,
        erro: "A data da mudança precisa ser depois do início do enquadramento atual.",
      };
    }
    if (error.code === "P0004") {
      return { ok: false, erro: "O enquadramento informado é igual ao atual." };
    }
    console.error("Falha ao mudar o enquadramento:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  revalidarTudo();
  return { ok: true };
}

/** Corrige o anexo do período em vigor, sem abrir um período novo. */
export async function corrigirAnexo(dados: unknown): Promise<Resultado> {
  const validado = anexoSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;

  const supabase = await createClient();
  const { error } = await supabase.rpc("corrigir_anexo", { p_anexo: validado.data.anexo });
  if (error) {
    console.error("Falha ao corrigir o anexo:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  revalidarTudo();
  return { ok: true };
}

/** Desfaz a última mudança de enquadramento e volta ao período anterior. */
export async function desfazerMudancaDeEnquadramento(): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("desfazer_mudanca_de_enquadramento");
  if (error) {
    if (error.code === "P0001") return { ok: false, erro: "Não há mudança para desfazer." };
    console.error("Falha ao desfazer a mudança de enquadramento:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  revalidarTudo();
  return { ok: true };
}

export async function salvarAlertas(dados: unknown): Promise<Resultado> {
  const validado = alertasSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;

  const empresa = await empresaAtual();
  if (!empresa) return ERRO_GERAL;

  const { faixa1, faixa2, faixa3, email } = validado.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("empresa")
    .update({
      alerta_faixas: [Number(faixa1), Number(faixa2), Number(faixa3)],
      alerta_email: email === "" ? null : email,
    })
    .eq("id", empresa.id);
  if (error) {
    console.error("Falha ao salvar os alertas:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  revalidatePath("/configuracoes");
  revalidatePath("/painel");
  return { ok: true };
}

export async function trocarSenha(dados: unknown): Promise<Resultado> {
  const validado = trocaDeSenhaSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;

  if (!(await senhaConfere(validado.data.senhaAtual))) {
    return { ok: false, erro: "A senha atual está incorreta." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: validado.data.senha });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, erro: "A nova senha precisa ser diferente da atual." };
    }
    if (error.code === "weak_password") {
      return { ok: false, erro: "Senha fraca. Escolha uma senha mais longa ou menos comum." };
    }
    console.error("Falha ao trocar a senha:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  // Trocar a senha encerra as outras sessões (especificação, "Segurança e privacidade").
  const { error: erroSessoes } = await supabase.auth.signOut({ scope: "others" });
  if (erroSessoes) {
    console.error("Falha ao encerrar as outras sessões:", erroSessoes.code ?? erroSessoes.message);
  }
  return { ok: true };
}

/**
 * Inativa a conta: os dados ficam guardados, o app fica bloqueado e nenhum alerta é enviado.
 * O próprio usuário reativa quando quiser, na tela que aparece depois do login.
 */
export async function inativarConta(dados: unknown): Promise<Resultado> {
  const validado = inativacaoDaContaSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;
  if (!(await senhaConfere(validado.data.senha))) return SENHA_ERRADA;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(ROTA_LOGIN);

  const { error } = await supabase
    .from("usuario")
    .update({ inativa_em: new Date().toISOString() })
    .eq("id", data.claims.sub);
  if (error) {
    console.error("Falha ao inativar a conta:", error.code ?? error.message);
    return ERRO_GERAL;
  }

  revalidatePath("/", "layout");
  redirect(ROTA_CONTA_INATIVA);
}

/** Exclui a conta e todos os dados, sem volta. Pede a senha e a palavra de confirmação. */
export async function excluirConta(dados: unknown): Promise<Resultado> {
  const validado = exclusaoDaContaSchema.safeParse(dados);
  if (!validado.success) return ERRO_DE_CAMPOS;
  if (!(await senhaConfere(validado.data.senha))) return SENHA_ERRADA;

  const supabase = await createClient();
  const { error } = await supabase.rpc("excluir_minha_conta");
  if (error) {
    console.error("Falha ao excluir a conta:", error.code ?? error.message);
    return { ok: false, erro: "Não foi possível excluir a conta agora. Tente de novo em instantes." };
  }

  // A conta não existe mais: limpa o cookie de sessão deste navegador.
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect(`${ROTA_LOGIN}?aviso=conta-excluida`);
}

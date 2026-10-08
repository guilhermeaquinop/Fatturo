"use server";

// Server Actions das telas de acesso — equivalem aos métodos de um AuthController.
// Rodam só no servidor; o navegador as chama como funções. Cada uma valida de novo
// os dados com o mesmo esquema Zod do formulário, porque o cliente não é confiável.
import { redirect } from "next/navigation";
import { ROTA_INICIAL, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import {
  cadastroSchema,
  loginSchema,
  novaSenhaSchema,
  recuperarSenhaSchema,
} from "@/lib/validacao/acesso";

// As actions redirecionam quando dão certo e devolvem { erro } quando falham.
export type ResultadoAcao = { erro: string } | undefined;

const ERRO_GENERICO = "Não foi possível concluir agora. Tente de novo em instantes.";
const ERRO_MUITAS_TENTATIVAS = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
const ERRO_DADOS = "Confira os campos e tente de novo.";

export async function entrar(dados: unknown): Promise<ResultadoAcao> {
  const validado = loginSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DADOS };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validado.data.email,
    password: validado.data.senha,
  });

  if (error) {
    if (error.status === 429) return { erro: ERRO_MUITAS_TENTATIVAS };
    // O Supabase só devolve este código depois de conferir a senha, então a
    // mensagem não revela a quem erra a senha se o e-mail existe.
    if (error.code === "email_not_confirmed") {
      return { erro: "Confirme seu e-mail antes de entrar. O link está na mensagem que enviamos." };
    }
    // Mensagem genérica: não diz se o e-mail existe.
    if (error.code === "invalid_credentials") return { erro: "E-mail ou senha incorretos." };
    console.error("Falha no login:", error.code ?? error.message);
    return { erro: ERRO_GENERICO };
  }

  redirect(ROTA_INICIAL);
}

export async function cadastrar(dados: unknown): Promise<ResultadoAcao> {
  const validado = cadastroSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DADOS };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: validado.data.email,
    password: validado.data.senha,
    options: {
      // Metadados do usuário. O gatilho do banco copia `nome` para a tabela `usuario`.
      data: {
        nome: validado.data.nome,
        termos_aceitos_em: new Date().toISOString(),
      },
    },
  });

  if (error) {
    if (error.status === 429) return { erro: ERRO_MUITAS_TENTATIVAS };
    if (error.code === "weak_password") {
      return { erro: "Senha fraca. Escolha uma senha mais longa ou menos comum." };
    }
    console.error("Falha no cadastro:", error.code ?? error.message);
    return { erro: ERRO_GENERICO };
  }

  // Se o e-mail já tiver conta, o Supabase responde como se tivesse criado,
  // sem enviar nada. A tela seguinte é a mesma nos dois casos.
  redirect("/cadastro/confirmar");
}

// Sempre termina igual, exista ou não uma conta com o e-mail.
export async function pedirRecuperacao(dados: unknown): Promise<ResultadoAcao> {
  const validado = recuperarSenhaSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DADOS };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(validado.data.email);

  if (error) {
    if (error.status === 429) return { erro: ERRO_MUITAS_TENTATIVAS };
    console.error("Falha ao pedir recuperação de senha:", error.code ?? error.message);
  }
  return undefined;
}

export async function definirNovaSenha(dados: unknown): Promise<ResultadoAcao> {
  const validado = novaSenhaSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DADOS };

  const supabase = await createClient();
  // A sessão vem do link de recuperação (app/auth/confirm/route.ts).
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { erro: "O link expirou ou já foi usado. Peça um novo em Esqueci minha senha." };
  }

  const { error } = await supabase.auth.updateUser({ password: validado.data.senha });

  if (error) {
    if (error.status === 429) return { erro: ERRO_MUITAS_TENTATIVAS };
    if (error.code === "same_password") {
      return { erro: "A nova senha precisa ser diferente da atual." };
    }
    if (error.code === "weak_password") {
      return { erro: "Senha fraca. Escolha uma senha mais longa ou menos comum." };
    }
    console.error("Falha ao trocar a senha:", error.code ?? error.message);
    return { erro: ERRO_GENERICO };
  }

  // Trocar a senha encerra as outras sessões (especificação, "Segurança e privacidade").
  const { error: erroSessoes } = await supabase.auth.signOut({ scope: "others" });
  if (erroSessoes) {
    console.error("Falha ao encerrar as outras sessões:", erroSessoes.code ?? erroSessoes.message);
  }

  redirect(ROTA_INICIAL);
}

export async function sair() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) console.error("Falha ao sair:", error.code ?? error.message);
  redirect(ROTA_LOGIN);
}

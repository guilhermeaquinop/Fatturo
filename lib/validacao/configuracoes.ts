// Esquemas Zod da tela de Configurações, um por formulário. Equivalem a Form Requests do Laravel.
// Os mesmos esquemas validam no navegador (React Hook Form) e no servidor (Server Action).
import { z } from "zod";
import { hojeIso, parseDataBr } from "@/lib/datas";
import { email, novaSenha } from "@/lib/validacao/acesso";
import { ANEXOS, ATIVIDADES, PORTES } from "@/lib/validacao/empresa";

/** Perfil de quem usa a conta: nome e um dos dois avatares. */
export const perfilSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome.").max(120, "Use no máximo 120 caracteres."),
  // O select e o botão de escolha guardam texto: "1" ou "2".
  avatar: z.enum(["1", "2"], "Escolha um avatar."),
});

/** Dados da empresa que podem mudar. CNPJ e data de abertura são fixos. */
export const dadosDaEmpresaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome da empresa.")
    .max(160, "Use no máximo 160 caracteres."),
  atividade: z.enum(ATIVIDADES, "Escolha a atividade."),
});

/** Mudança de porte ou de anexo a partir de uma data. */
export const mudancaDeEnquadramentoSchema = z
  .object({
    porte: z.enum(PORTES, "Escolha o porte."),
    // Vazio enquanto nada foi escolhido. Só a ME tem anexo.
    anexo: z.union([z.enum(ANEXOS), z.literal("")]),
    inicioEm: z
      .string()
      .trim()
      .min(1, { error: "Informe a data da mudança.", abort: true })
      .refine((valor) => parseDataBr(valor) !== null, {
        error: "Data inválida. Use o formato dd/mm/aaaa.",
        abort: true,
      })
      .refine((valor) => {
        const iso = parseDataBr(valor);
        return iso !== null && iso <= hojeIso();
      }, "A data da mudança não pode estar no futuro."),
  })
  .refine((dados) => dados.porte !== "ME" || dados.anexo !== "", {
    message: "Escolha o anexo do Simples. Se não souber, selecione \"Não sei\".",
    path: ["anexo"],
  });

/** Correção do anexo do período em vigor. */
export const anexoSchema = z.object({ anexo: z.enum(ANEXOS, "Escolha o anexo.") });

const faixa = z
  .string()
  .trim()
  .min(1, { error: "Informe o percentual.", abort: true })
  .refine((valor) => /^\d{1,3}$/.test(valor) && Number(valor) >= 1 && Number(valor) <= 100, {
    error: "Use um número inteiro de 1 a 100.",
  });

/** Faixas de alerta do limite e o e-mail que recebe os alertas. */
export const alertasSchema = z
  .object({
    faixa1: faixa,
    faixa2: faixa,
    faixa3: faixa,
    // Vazio = usar o e-mail de login.
    email: z.union([z.literal(""), email]),
  })
  .refine((dados) => Number(dados.faixa2) > Number(dados.faixa1), {
    message: "Precisa ser maior que a primeira faixa.",
    path: ["faixa2"],
  })
  .refine((dados) => Number(dados.faixa3) > Number(dados.faixa2), {
    message: "Precisa ser maior que a segunda faixa.",
    path: ["faixa3"],
  });

export const trocaDeSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    senha: novaSenha,
    confirmacao: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não são iguais. Digite a mesma senha nos dois campos.",
    path: ["confirmacao"],
  });

/** Palavra que o usuário digita para confirmar a exclusão da conta. */
export const PALAVRA_DE_EXCLUSAO: string = "EXCLUIR";

export const exclusaoDaContaSchema = z.object({
  senha: z.string().min(1, "Informe sua senha."),
  confirmacao: z
    .string()
    .trim()
    .refine((valor) => valor === PALAVRA_DE_EXCLUSAO, `Digite ${PALAVRA_DE_EXCLUSAO} para confirmar.`),
});

export const inativacaoDaContaSchema = z.object({
  senha: z.string().min(1, "Informe sua senha."),
});

export type PerfilDados = z.infer<typeof perfilSchema>;
export type DadosDaEmpresa = z.infer<typeof dadosDaEmpresaSchema>;
export type MudancaDeEnquadramento = z.infer<typeof mudancaDeEnquadramentoSchema>;
export type AnexoDados = z.infer<typeof anexoSchema>;
export type AlertasDados = z.infer<typeof alertasSchema>;
export type TrocaDeSenhaDados = z.infer<typeof trocaDeSenhaSchema>;
export type ExclusaoDaContaDados = z.infer<typeof exclusaoDaContaSchema>;
export type InativacaoDaContaDados = z.infer<typeof inativacaoDaContaSchema>;

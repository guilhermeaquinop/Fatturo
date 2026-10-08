// Esquemas Zod das telas de acesso. Equivalem aos Form Requests do Laravel.
// O mesmo esquema valida no navegador (React Hook Form) e no servidor (Server Action).
import { z } from "zod";

// Mínimo exigido pela especificação. O Supabase Auth aplica o mesmo mínimo (config.toml).
export const SENHA_MINIMA = 10;
// O bcrypt, usado pelo Supabase Auth, considera no máximo 72 bytes.
const SENHA_MAXIMA = 72;

const email = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(254, "E-mail muito longo.")
  .pipe(z.email("E-mail inválido. Confira o endereço."));

const novaSenha = z
  .string()
  .min(SENHA_MINIMA, `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
  .max(SENHA_MAXIMA, `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`);

const senhasIguais = {
  message: "As senhas não são iguais. Digite a mesma senha nos dois campos.",
  path: ["confirmacao"],
};

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, "Informe sua senha."),
});

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe seu nome.").max(120, "Use no máximo 120 caracteres."),
    email,
    senha: novaSenha,
    confirmacao: z.string().min(1, "Confirme a senha."),
    aceite: z.boolean().refine((valor) => valor, {
      message: "Aceite os termos de uso e a política de privacidade para criar a conta.",
    }),
  })
  .refine((dados) => dados.senha === dados.confirmacao, senhasIguais);

export const recuperarSenhaSchema = z.object({ email });

export const novaSenhaSchema = z
  .object({
    senha: novaSenha,
    confirmacao: z.string().min(1, "Confirme a senha."),
  })
  .refine((dados) => dados.senha === dados.confirmacao, senhasIguais);

export type LoginDados = z.infer<typeof loginSchema>;
export type CadastroDados = z.infer<typeof cadastroSchema>;
export type RecuperarSenhaDados = z.infer<typeof recuperarSenhaSchema>;
export type NovaSenhaDados = z.infer<typeof novaSenhaSchema>;

// Esquema Zod da configuração inicial da empresa. Equivale a um Form Request do Laravel.
// O mesmo esquema valida no navegador (React Hook Form) e no servidor (Server Action).
import { z } from "zod";
import { validarCnpj } from "@/lib/cnpj";
import { hojeIso, parseDataBr } from "@/lib/datas";

// Listas fixas, iguais aos enums do banco (supabase/migrations/*_empresa.sql e *_enquadramento.sql).
export const PORTES = ["MEI", "ME"] as const;
export const REGIMES = ["SIMPLES"] as const;
export const ATIVIDADES = ["servico", "comercio", "ambos"] as const;
export const ANEXOS = ["III", "I", "II", "IV", "V", "nao_sei"] as const;

export type Porte = (typeof PORTES)[number];
export type Regime = (typeof REGIMES)[number];
export type Atividade = (typeof ATIVIDADES)[number];
export type Anexo = (typeof ANEXOS)[number];

// Textos exibidos na tela para cada valor guardado no banco.
export const ROTULO_PORTE: Record<Porte, string> = { MEI: "MEI", ME: "ME" };
export const ROTULO_REGIME: Record<Regime, string> = { SIMPLES: "Simples Nacional" };
export const ROTULO_ATIVIDADE: Record<Atividade, string> = {
  servico: "Prestação de serviços",
  comercio: "Comércio",
  ambos: "Comércio e serviços",
};
export const ROTULO_ANEXO: Record<Anexo, string> = {
  III: "Anexo III · Serviços",
  I: "Anexo I · Comércio",
  II: "Anexo II · Indústria",
  IV: "Anexo IV · Serviços",
  V: "Anexo V · Serviços",
  nao_sei: "Não sei",
};

const DATA_MINIMA = "1900-01-01";

export const empresaSchema = z
  .object({
    cnpj: z
      .string()
      .trim()
      // abort: se estiver vazio, para aqui e não acumula a mensagem de CNPJ inválido.
      .min(1, { error: "Informe o CNPJ.", abort: true })
      .refine(validarCnpj, "CNPJ inválido. Confira os dígitos."),
    nome: z
      .string()
      .trim()
      .min(1, "Informe o nome da empresa.")
      .max(160, "Use no máximo 160 caracteres."),
    dataAbertura: z
      .string()
      .trim()
      .min(1, { error: "Informe a data de abertura.", abort: true })
      .refine((valor) => parseDataBr(valor) !== null, {
        error: "Data inválida. Use o formato dd/mm/aaaa.",
        abort: true,
      })
      .refine((valor) => {
        const iso = parseDataBr(valor);
        return iso !== null && iso >= DATA_MINIMA && iso <= hojeIso();
      }, "A data de abertura não pode estar no futuro."),
    porte: z.enum(PORTES, "Escolha o porte da empresa."),
    regime: z.enum(REGIMES, "Escolha o regime tributário."),
    atividade: z.enum(ATIVIDADES, "Escolha a atividade."),
    // Vazio enquanto nada foi escolhido. Só a ME tem anexo.
    anexo: z.union([z.enum(ANEXOS), z.literal("")]),
  })
  .refine((dados) => dados.porte !== "ME" || dados.anexo !== "", {
    message: "Escolha o anexo do Simples. Se não souber, selecione \"Não sei\".",
    path: ["anexo"],
  });

export type EmpresaDados = z.infer<typeof empresaSchema>;

/** Anexo a gravar: o escolhido para ME; nenhum para MEI, mesmo que o campo tenha valor. */
export function anexoParaGravar(dados: Pick<EmpresaDados, "porte" | "anexo">): Anexo | null {
  if (dados.porte !== "ME" || dados.anexo === "") return null;
  return dados.anexo;
}

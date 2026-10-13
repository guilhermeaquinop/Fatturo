// Esquema Zod do formulário de uma guia do DAS. Equivale a um Form Request do Laravel.
// O mesmo esquema valida no navegador (React Hook Form) e no servidor (Server Action).
// Datas e valor chegam como o usuário digitou: "20/08/2026" e "934,50".
import { z } from "zod";
import { hojeIso, parseDataBr } from "@/lib/datas";
import { centavosDeTexto } from "@/lib/dinheiro";

// Teto de uma guia: R$ 10 milhões. Evita erro de digitação.
const VALOR_MAXIMO = 1_000_000_000;

export const guiaDasSchema = z.object({
  valor: z
    .string()
    .trim()
    .min(1, { error: "Informe o valor da guia.", abort: true })
    .refine((valor) => centavosDeTexto(valor) !== null, {
      error: "Valor inválido. Use o formato 1.234,56.",
      abort: true,
    })
    .refine((valor) => {
      const centavos = centavosDeTexto(valor);
      return centavos !== null && centavos >= 0 && centavos <= VALOR_MAXIMO;
    }, "Informe um valor sem sinal."),
  vencimento: z
    .string()
    .trim()
    .min(1, { error: "Informe o vencimento.", abort: true })
    .refine((valor) => parseDataBr(valor) !== null, "Data inválida. Use o formato dd/mm/aaaa."),
  // Vazio = a guia ainda não foi paga.
  pagoEm: z
    .string()
    .trim()
    .refine((valor) => valor === "" || parseDataBr(valor) !== null, {
      error: "Data inválida. Use o formato dd/mm/aaaa.",
      abort: true,
    })
    .refine((valor) => {
      const iso = parseDataBr(valor);
      return valor === "" || (iso !== null && iso <= hojeIso());
    }, "A data do pagamento não pode estar no futuro."),
});

export type GuiaDasDados = z.infer<typeof guiaDasSchema>;

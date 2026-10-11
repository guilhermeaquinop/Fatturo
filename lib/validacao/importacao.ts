// Esquema Zod do que o navegador envia ao importar um XML de NFS-e.
// Equivale a um Form Request do Laravel. O arquivo não é enviado: só os dados extraídos.
import { z } from "zod";
import { dataIsoValida } from "@/lib/datas";

const chave = z.string().regex(/^\d{50}$/);
const dataIso = z.string().refine(dataIsoValida);

export const notaImportadaSchema = z.object({
  chave,
  numero: z.string().min(1).max(20),
  dataEmissao: dataIso,
  dataCompetencia: dataIso,
  emitenteCnpj: z.string().regex(/^[A-Z0-9]{12}\d{2}$/),
  tomadorNome: z.string().max(200).nullable(),
  tomadorDoc: z
    .string()
    .regex(/^(\d{11}|[A-Z0-9]{12}\d{2})$/)
    .nullable(),
  // Inteiro em centavos; o teto evita números que o JavaScript não representa com exatidão.
  valorCentavos: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

// Limite de itens por arquivo: um XML do Emissor Nacional traz uma nota ou um evento.
const MAXIMO_POR_ARQUIVO = 500;

export const arquivoNfseSchema = z.object({
  nome: z.string().min(1).max(255),
  // SHA-256 do conteúdo do arquivo, calculado no navegador.
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  notas: z.array(notaImportadaSchema).max(MAXIMO_POR_ARQUIVO),
  cancelamentos: z.array(chave).max(MAXIMO_POR_ARQUIVO),
});

export type NotaImportada = z.infer<typeof notaImportadaSchema>;
export type ArquivoNfse = z.infer<typeof arquivoNfseSchema>;

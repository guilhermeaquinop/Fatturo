// Esquemas Zod dos lançamentos: formulário manual, classificação em lote, extrato importado
// e mapeamento de colunas do CSV. Equivale a Form Requests do Laravel.
// Os mesmos esquemas validam no navegador e no servidor.
import { z } from "zod";
import { dataIsoValida, hojeIso, parseDataBr } from "@/lib/datas";
import { centavosDeTexto } from "@/lib/dinheiro";

// Listas fixas, iguais aos enums do banco (supabase/migrations/*_lancamento.sql).
export const CATEGORIAS = ["receita", "despesa", "pessoal", "transferencia", "imposto"] as const;
export const SENTIDOS = ["entrada", "saida"] as const;

export type Categoria = (typeof CATEGORIAS)[number];
export type Sentido = (typeof SENTIDOS)[number];

// Textos exibidos na tela para cada valor guardado no banco.
export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  receita: "Receita do negócio",
  despesa: "Despesa do negócio",
  pessoal: "Pessoal",
  transferencia: "Transferência entre contas",
  imposto: "Imposto (DAS)",
};
export const ROTULO_CATEGORIA_CURTO: Record<Categoria, string> = {
  receita: "Receita",
  despesa: "Despesa",
  pessoal: "Pessoal",
  transferencia: "Transferência",
  imposto: "Imposto",
};
export const ROTULO_SENTIDO: Record<Sentido, string> = { entrada: "Entrada", saida: "Saída" };
export const SEM_CLASSIFICACAO = "Sem classificação";

const DATA_MINIMA = "1900-01-01";
// Teto de um lançamento: R$ 1 bilhão. Evita erro de digitação e número que o banco não guarda.
const VALOR_MAXIMO = 100_000_000_000;

const descricao = z
  .string()
  .trim()
  .min(1, "Informe a descrição.")
  .max(300, "Use no máximo 300 caracteres.");
const contraparteNome = z.string().trim().max(200, "Use no máximo 200 caracteres.");
// Vazio = sem classificação.
const categoria = z.union([z.enum(CATEGORIAS), z.literal("")]);

/** Campos que valem para qualquer lançamento, importado ou manual. */
export const lancamentoEditavelSchema = z.object({ descricao, contraparteNome, categoria });

/** Lançamento manual: o formulário inteiro. Data e valor chegam como o usuário digitou. */
export const lancamentoSchema = lancamentoEditavelSchema.extend({
  data: z
    .string()
    .trim()
    .min(1, { error: "Informe a data.", abort: true })
    .refine((valor) => parseDataBr(valor) !== null, {
      error: "Data inválida. Use o formato dd/mm/aaaa.",
      abort: true,
    })
    .refine((valor) => {
      const iso = parseDataBr(valor);
      return iso !== null && iso >= DATA_MINIMA && iso <= hojeIso();
    }, "A data não pode estar no futuro."),
  sentido: z.enum(SENTIDOS, "Escolha se é entrada ou saída."),
  valor: z
    .string()
    .trim()
    .min(1, { error: "Informe o valor.", abort: true })
    .refine((valor) => centavosDeTexto(valor) !== null, {
      error: "Valor inválido. Use o formato 1.234,56.",
      abort: true,
    })
    .refine((valor) => {
      const centavos = centavosDeTexto(valor);
      return centavos !== null && centavos > 0 && centavos <= VALOR_MAXIMO;
    }, "Informe um valor maior que zero, sem sinal."),
});

export type LancamentoEditavel = z.infer<typeof lancamentoEditavelSchema>;
export type LancamentoDados = z.infer<typeof lancamentoSchema>;

const id = z.uuid();

/** Classificação de vários lançamentos de uma vez. */
export const classificacaoEmLoteSchema = z.object({
  ids: z.array(id).min(1).max(500),
  categoria,
});

// --- Importação de extrato (OFX e CSV) ---

const LANCAMENTOS_POR_ARQUIVO = 5000;

export const lancamentoImportadoSchema = z.object({
  idExterno: z.string().min(1).max(300),
  data: z.string().refine(dataIsoValida),
  valorCentavos: z.number().int().min(1).max(VALOR_MAXIMO),
  sentido: z.enum(SENTIDOS),
  descricao: z.string().min(1).max(300),
  contraparteNome: z.string().min(1).max(200).nullable(),
});

export const extratoSchema = z.object({
  nome: z.string().min(1).max(255),
  tipo: z.enum(["OFX", "CSV"]),
  // SHA-256 do conteúdo do arquivo, calculado no navegador.
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  lancamentos: z.array(lancamentoImportadoSchema).max(LANCAMENTOS_POR_ARQUIVO),
  /** Linhas que o navegador não conseguiu ler. */
  erros: z.number().int().min(0).max(100_000),
});

export type Extrato = z.infer<typeof extratoSchema>;

const coluna = z.number().int().min(0).max(39);

export const mapeamentoCsvSchema = z
  .object({
    assinatura: z.string().min(1).max(1000),
    colunaData: coluna,
    colunaDescricao: coluna,
    colunaValor: coluna.nullable(),
    colunaCredito: coluna.nullable(),
    colunaDebito: coluna.nullable(),
  })
  // Valor numa coluna só, ou crédito e débito juntos; nunca os dois modos.
  .refine(
    (dados) =>
      dados.colunaValor !== null
        ? dados.colunaCredito === null && dados.colunaDebito === null
        : dados.colunaCredito !== null && dados.colunaDebito !== null,
  );

export type MapeamentoCsvDados = z.infer<typeof mapeamentoCsvSchema>;

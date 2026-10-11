// Leitura dos valores legais vigentes na tabela `parametro`.
// Equivale a um Repository (ou a um scope do Eloquent como Parametro::vigentes()) no Laravel.
import "server-only";
import { hojeIso } from "@/lib/datas";
import type { Parametros } from "@/lib/regras/limite";
import { createClient } from "@/lib/supabase/server";

export type ParametrosVigentes = {
  /** { chave: valor } dos parâmetros em vigor. */
  valores: Parametros;
  /** Chaves cujo valor ainda não foi conferido com o contador. */
  aConfirmar: string[];
};

/** Devolve os parâmetros em vigor na data (padrão: hoje). */
export async function parametrosVigentes(data: string = hojeIso()): Promise<ParametrosVigentes> {
  const supabase = await createClient();

  const { data: linhas, error } = await supabase
    .from("parametro")
    .select("chave, valor, a_confirmar")
    .lte("vigencia_inicio", data)
    .or(`vigencia_fim.is.null,vigencia_fim.gte.${data}`);

  if (error) throw new Error(`Não foi possível ler os parâmetros: ${error.message}`);

  return {
    valores: Object.fromEntries(linhas.map((linha) => [linha.chave, linha.valor])),
    aConfirmar: linhas.filter((linha) => linha.a_confirmar).map((linha) => linha.chave),
  };
}

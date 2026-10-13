// Leitura do DAS da empresa: as guias gravadas e os meses do ano prontos para a tela.
// Equivale a um Repository + Service no Laravel (GuiaDas::doAno() e a montagem do calendário).
// Junta três fontes: a tabela `guia_das`, as notas (receita do mês) e a tabela `parametro`.
import "server-only";
import { anoDe, hojeIso } from "@/lib/datas";
import type { EmpresaAtual } from "@/lib/empresa";
import { notasDoPeriodo } from "@/lib/notas";
import { parametrosVigentes } from "@/lib/parametros";
import { mesesDoDas, type GuiaSalva, type MesDoDas } from "@/lib/regras/das";
import {
  faturamentoPorMes,
  receitaUltimos12Meses,
  type NotaDoPainel,
} from "@/lib/regras/faturamento";
import { createClient } from "@/lib/supabase/server";

/** Guias gravadas com competência no ano. */
export async function guiasDoAno(empresaId: string, ano: number): Promise<GuiaSalva[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guia_das")
    .select("competencia, vencimento, valor_centavos, pago_em")
    .eq("empresa_id", empresaId)
    .gte("competencia", `${ano}-01-01`)
    .lte("competencia", `${ano}-12-01`)
    .order("competencia");

  if (error) throw new Error(`Não foi possível ler as guias do DAS: ${error.message}`);

  return data.map((linha) => ({
    // No banco a competência é o dia 1 do mês; nas regras, só "aaaa-mm".
    competencia: linha.competencia.slice(0, 7),
    vencimento: linha.vencimento,
    valorCentavos: linha.valor_centavos,
    pagoEm: linha.pago_em,
  }));
}

export type DasDoAno = {
  meses: MesDoDas[];
  /** Alíquota da sugestão, em centésimos de por cento (600 = 6,00%). */
  aliquotaSugerida: number;
  /** Receita em 12 meses até a qual a alíquota sugerida vale. */
  tetoDaSugestaoCentavos: number;
  /** Falso quando a receita de 12 meses passou do teto: a tela para de sugerir. */
  sugerindo: boolean;
};

function parametro(valores: Record<string, number>, chave: string): number {
  const valor = valores[chave];
  if (valor === undefined) throw new Error(`Parâmetro "${chave}" não encontrado para a vigência.`);
  return valor;
}

/**
 * Os meses do DAS de um ano, com receita, porte, situação e sugestão de valor.
 * `notas` pode ser passado por quem já buscou as notas (o painel), para não ler duas vezes;
 * precisa cobrir o ano pedido e os últimos 12 meses.
 */
export async function dasDoAno(
  empresa: EmpresaAtual,
  ano: number,
  notas?: NotaDoPainel[],
): Promise<DasDoAno> {
  const hoje = hojeIso();
  const anoAtual = anoDe(hoje);

  const [guias, parametros, notasDoAno] = await Promise.all([
    guiasDoAno(empresa.id, ano),
    parametrosVigentes(hoje),
    notas ??
      notasDoPeriodo(empresa.id, `${Math.min(ano, anoAtual - 1)}-01-01`, `${anoAtual}-12-31`),
  ]);

  const aliquotaSugerida = parametro(parametros.valores, "das_aliquota_sugerida_me");
  const tetoDaSugestaoCentavos = parametro(
    parametros.valores,
    "das_teto_receita_12m_aliquota_sugerida",
  );
  const sugerindo = receitaUltimos12Meses(notasDoAno, hoje) <= tetoDaSugestaoCentavos;

  return {
    meses: mesesDoDas({
      ano,
      dataAbertura: empresa.dataAbertura,
      hoje,
      guias,
      receitaPorMes: faturamentoPorMes(notasDoAno, ano),
      periodos: empresa.enquadramentos,
      diaDeVencimento: parametro(parametros.valores, "das_dia_vencimento"),
      aliquotaSugerida,
      sugerir: sugerindo,
    }),
    aliquotaSugerida,
    tetoDaSugestaoCentavos,
    sugerindo,
  };
}

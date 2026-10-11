// Regras da tela de Lançamentos: mês exibido, filtro por categoria e totais.
// Equivale a uma classe de Service/Domain no Laravel: funções puras, sem banco e sem tela.
import { dataIsoValida } from "@/lib/datas";
import { CATEGORIAS, type Categoria, type Sentido } from "@/lib/validacao/lancamento";

/** Filtro de categoria: uma categoria, "sem" (sem classificação) ou null (todas). */
export type FiltroDeCategoria = Categoria | "sem" | null;

type ParaTotais = { valorCentavos: number; sentido: Sentido; categoria: Categoria | null };

/** Confere se o texto é um mês "aaaa-mm" que existe. */
export function mesValido(mes: string): boolean {
  return /^\d{4}-\d{2}$/.test(mes) && dataIsoValida(`${mes}-01`);
}

/** Primeiro e último dia do mês "aaaa-mm", como "aaaa-mm-dd". */
export function limitesDoMes(mes: string): { de: string; ate: string } {
  const [ano, numero] = mes.split("-").map(Number);
  // Dia 0 do mês seguinte é o último dia deste mês.
  const ultimoDia = new Date(Date.UTC(ano, numero, 0)).getUTCDate();
  return { de: `${mes}-01`, ate: `${mes}-${String(ultimoDia).padStart(2, "0")}` };
}

/** Mês a `distancia` meses de distância: ("2026-01", -1) vira "2025-12". */
export function deslocarMes(mes: string, distancia: number): string {
  const [ano, numero] = mes.split("-").map(Number);
  const total = ano * 12 + (numero - 1) + distancia;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Lê o filtro de categoria da URL; qualquer valor desconhecido vira "todas". */
export function filtroDeCategoria(valor: unknown): FiltroDeCategoria {
  if (valor === "sem") return "sem";
  return CATEGORIAS.find((categoria) => categoria === valor) ?? null;
}

/** Aplica o filtro de categoria. */
export function filtrarPorCategoria<T extends { categoria: Categoria | null }>(
  lancamentos: T[],
  filtro: FiltroDeCategoria,
): T[] {
  if (filtro === null) return lancamentos;
  if (filtro === "sem") return lancamentos.filter((item) => item.categoria === null);
  return lancamentos.filter((item) => item.categoria === filtro);
}

export type Totais = {
  entradasCentavos: number;
  saidasCentavos: number;
  /** Quantos ainda não têm categoria. */
  semClassificacao: number;
};

/** Soma de entradas e de saídas e a quantidade sem classificação. */
export function totais(lancamentos: ParaTotais[]): Totais {
  const resultado: Totais = { entradasCentavos: 0, saidasCentavos: 0, semClassificacao: 0 };
  for (const item of lancamentos) {
    if (item.sentido === "entrada") resultado.entradasCentavos += item.valorCentavos;
    else resultado.saidasCentavos += item.valorCentavos;
    if (item.categoria === null) resultado.semClassificacao += 1;
  }
  return resultado;
}

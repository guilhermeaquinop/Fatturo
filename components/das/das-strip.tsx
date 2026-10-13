// Faixa com os meses do DAS do ano, um quadrado por mês (componentes.md, "DasStrip").
// Equivale a um componente Blade <x-das-strip>. Os estados diferem pela forma, não só pela cor:
// pago é preenchido, em aberto tem contorno forte, a vencer e sem valor são tracejados.
import { nomeDoMes } from "@/lib/datas";
import type { MesDoDas, SituacaoDaGuia } from "@/lib/regras/das";
import { cn } from "@/lib/utils";

const INICIAIS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const ESTILO: Record<SituacaoDaGuia, string> = {
  paga: "bg-surface-tint-strong",
  pendente: "border-2 border-ink font-bold",
  vencida: "border-2 border-ink font-bold",
  a_vencer: "border border-dashed border-border-dashed text-ink-muted",
  sem_valor: "border border-dashed border-border-dashed text-ink-muted",
};

const ROTULO: Record<SituacaoDaGuia, string> = {
  paga: "pago",
  pendente: "pendente",
  vencida: "vencido",
  a_vencer: "a vencer",
  sem_valor: "sem valor informado",
};

export function DasStrip({ meses }: { meses: MesDoDas[] }) {
  // Para leitor de tela: a situação de cada mês por extenso.
  const descricao = meses.map((mes) => `${nomeDoMes(mes.mes)} ${ROTULO[mes.situacao]}`).join(", ");

  return (
    <div role="img" aria-label={`Situação do DAS por mês: ${descricao}`} className="flex flex-wrap gap-1.5">
      {meses.map((mes) => (
        <div
          key={mes.competencia}
          className={cn(
            "flex h-7 flex-[1_1_22px] items-center justify-center rounded-sm text-caption font-semibold text-ink",
            ESTILO[mes.situacao],
          )}
        >
          {INICIAIS[mes.mes - 1]}
        </div>
      ))}
    </div>
  );
}

/** Frase curta abaixo da faixa: "9 pagos · outubro pendente". */
export function resumoEmTexto(meses: MesDoDas[]): string {
  const pagos = meses.filter((mes) => mes.situacao === "paga").length;
  const vencidos = meses.filter((mes) => mes.situacao === "vencida");
  const pendentes = meses.filter((mes) => mes.situacao === "pendente");

  const partes = [`${pagos} ${pagos === 1 ? "pago" : "pagos"}`];
  if (vencidos.length === 1) partes.push(`${nomeDoMes(vencidos[0].mes)} vencido`);
  if (vencidos.length > 1) partes.push(`${vencidos.length} vencidos`);
  if (pendentes.length === 1) partes.push(`${nomeDoMes(pendentes[0].mes)} pendente`);
  if (pendentes.length > 1) partes.push(`${pendentes.length} pendentes`);
  return partes.join(" · ");
}

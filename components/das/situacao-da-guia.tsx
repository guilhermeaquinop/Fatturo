// Etiqueta curta com a situação da guia do DAS. Equivale a um componente Blade <x-situacao>.
// As situações diferem pela forma, como na fita dos meses: paga é preenchida, pendente tem
// contorno forte, a vencer e sem valor são tracejadas, e vencida usa a família de erro com ícone.
import { ErrorIcon } from "@/components/ui/icons";
import type { SituacaoDaGuia as Situacao } from "@/lib/regras/das";
import { cn } from "@/lib/utils";

export const ROTULO_DA_SITUACAO: Record<Situacao, string> = {
  paga: "Paga",
  pendente: "Pendente",
  vencida: "Vencida",
  a_vencer: "A vencer",
  sem_valor: "Sem valor informado",
};

const ESTILO: Record<Situacao, string> = {
  paga: "bg-surface-tint-strong text-ink",
  pendente: "border-[1.5px] border-ink text-ink",
  vencida: "bg-error-surface text-error-ink",
  a_vencer: "border border-dashed border-border-dashed text-ink-muted",
  sem_valor: "border border-dashed border-border-dashed text-ink-muted",
};

export function SituacaoDaGuia({ situacao }: { situacao: Situacao }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-pill px-2.5 text-caption font-semibold whitespace-nowrap",
        ESTILO[situacao],
      )}
    >
      {situacao === "vencida" ? <ErrorIcon width={14} height={14} className="flex-none" /> : null}
      {ROTULO_DA_SITUACAO[situacao]}
    </span>
  );
}

"use client";

// Botão de olho que esconde e mostra os valores em reais. Equivale a um componente Blade
// com um pouco de JavaScript (Alpine, por exemplo). O ícone mostra o estado atual:
// olho aberto com os valores visíveis, olho riscado com os valores ocultos.
import { OlhoIcon, OlhoRiscadoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { definirValoresOcultos, useValoresOcultos } from "@/lib/use-valores-ocultos";

export function OcultarValores({ className }: { className?: string }) {
  const ocultos = useValoresOcultos();

  return (
    <button
      type="button"
      aria-pressed={ocultos}
      aria-label="Ocultar valores"
      title={ocultos ? "Mostrar valores" : "Ocultar valores"}
      onClick={() => definirValoresOcultos(!ocultos)}
      className={cn(
        "inline-flex size-control-sm flex-none cursor-pointer items-center justify-center rounded-pill text-ink hover:bg-surface-tint",
        className,
      )}
    >
      {ocultos ? <OlhoRiscadoIcon width={22} height={22} /> : <OlhoIcon width={22} height={22} />}
    </button>
  );
}

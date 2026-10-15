"use client";

// Botão de olho que esconde e mostra os valores em reais. Equivale a um componente Blade
// com um pouco de JavaScript (Alpine, por exemplo). O ícone mostra o estado atual:
// olho aberto com os valores visíveis, olho riscado com os valores ocultos.
import { OlhoIcon, OlhoRiscadoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { definirValoresOcultos, useValoresOcultos } from "@/lib/use-valores-ocultos";

type OcultarValoresProps = {
  /**
   * "icone": só o olho, com 44 px (barra superior do celular).
   * "item": olho e texto, como um item do menu da barra lateral.
   */
  variante?: "icone" | "item";
  className?: string;
};

export function OcultarValores({ variante = "icone", className }: OcultarValoresProps) {
  const ocultos = useValoresOcultos();
  const Icone = ocultos ? OlhoRiscadoIcon : OlhoIcon;
  const alternar = () => definirValoresOcultos(!ocultos);

  if (variante === "item") {
    // O texto diz o que o clique vai fazer, então não leva aria-pressed.
    return (
      <button type="button" onClick={alternar} className={className}>
        <Icone className="flex-none" />
        {ocultos ? "Mostrar valores" : "Ocultar valores"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={ocultos}
      aria-label="Ocultar valores"
      title={ocultos ? "Mostrar valores" : "Ocultar valores"}
      onClick={alternar}
      className={cn(
        "inline-flex size-control-sm flex-none cursor-pointer items-center justify-center rounded-pill text-ink hover:bg-surface-tint",
        className,
      )}
    >
      <Icone width={22} height={22} />
    </button>
  );
}

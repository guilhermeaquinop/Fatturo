"use client";

// Item "Mais" da barra inferior do celular: abre uma folha com o perfil e as outras páginas.
// Equivale a um dropdown de menu do Bootstrap. O conteúdo da folha vem pronto do servidor
// (children); aqui fica só o abrir e fechar.
import { MaisIcon } from "@/components/ui/icons";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type MenuMaisProps = {
  /** Fica marcado nas páginas que só se abrem por aqui (Lançamentos e Configurações). */
  ativo: boolean;
  /** Classes do item e do indicador, as mesmas dos outros itens da barra. */
  classeDoItem: string;
  classeDoIndicador: string;
  children: React.ReactNode;
};

export function MenuMais({ ativo, classeDoItem, classeDoIndicador, children }: MenuMaisProps) {
  return (
    <Sheet>
      <SheetTrigger className={classeDoItem} aria-current={ativo ? "page" : undefined}>
        <span className={classeDoIndicador}>
          <MaisIcon width={24} height={24} />
        </span>
        Mais
      </SheetTrigger>
      <SheetContent titulo="Mais">{children}</SheetContent>
    </Sheet>
  );
}

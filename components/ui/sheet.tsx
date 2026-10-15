"use client";

// Folha que sobe da parte de baixo da tela, com alça, título e botão de fechar.
// Equivale a um modal do Bootstrap ou a um componente Blade de modal. Usa o Dialog do
// radix-ui (foco preso dentro, Esc e toque no fundo fecham) com as cores dos tokens.
import { Dialog } from "radix-ui";
import * as React from "react";
import { FecharIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
/** Fecha a folha. Com asChild, envolve um link: o toque navega e fecha. */
const SheetClose = Dialog.Close;

type SheetContentProps = {
  titulo: string;
  children: React.ReactNode;
  /** Ações fixas embaixo, fora da rolagem (ex.: Limpar e Filtrar). */
  rodape?: React.ReactNode;
  className?: string;
};

function SheetContent({ titulo, children, rodape, className }: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-t-xl bg-surface text-ink outline-none",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-6 motion-reduce:animate-none",
          className,
        )}
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 flex-none rounded-pill bg-border-dashed" />
        <div className="flex flex-none items-center justify-between gap-2 py-2 pr-2 pl-5">
          <Dialog.Title className="text-section-title">{titulo}</Dialog.Title>
          <Dialog.Close
            aria-label="Fechar"
            className="inline-flex size-control-sm cursor-pointer items-center justify-center rounded-pill hover:bg-surface-tint"
          >
            <FecharIcon width={22} height={22} />
          </Dialog.Close>
        </div>
        <div
          className={cn(
            "flex flex-col gap-5 overflow-y-auto px-5",
            rodape ? "pb-5" : "pb-[calc(24px+env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </div>
        {rodape ? (
          <div className="flex flex-none gap-2 border-t border-border px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] *:flex-1">
            {rodape}
          </div>
        ) : null}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };

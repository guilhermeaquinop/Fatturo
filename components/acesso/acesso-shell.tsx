// Moldura das telas de acesso: painel ink à esquerda e formulário de até 380px à direita.
// Equivale ao layouts/guest.blade.php do Laravel. Empilha no celular (flex-wrap); ali o painel
// escuro encolhe para a logo e o título, para o formulário caber na primeira tela.
import { Logo } from "@/components/logo";
import * as React from "react";

type AcessoShellProps = {
  /** Conteúdo do meio do painel escuro. Padrão: a frase de apresentação do login. */
  painel?: React.ReactNode;
  children: React.ReactNode;
};

function AcessoShell({ painel = <PainelApresentacao />, children }: AcessoShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface sm:flex-row sm:flex-wrap">
      <aside className="flex flex-none flex-col justify-between gap-6 bg-ink p-6 text-on-ink sm:flex-[1_1_360px] sm:gap-12 sm:p-12">
        <Logo tom="escuro" className="h-8 self-start" />
        <div className="max-w-[440px]">{painel}</div>
        <div className="hidden text-caption text-on-ink-muted sm:block">Para MEI e ME no Simples Nacional</div>
      </aside>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:flex-[1_1_420px] sm:items-center sm:px-8 sm:py-12">
        <div className="w-full max-w-form">{children}</div>
      </main>
    </div>
  );
}

function PainelApresentacao() {
  return (
    <>
      <div className="text-page-title sm:text-hero">
        Faturamento, limite e DAS <span className="text-accent">sob controle.</span>
      </div>
      <div className="mt-4 hidden text-lead text-on-ink-muted sm:block">
        Importe suas notas e extratos e acompanhe sua empresa num painel só.
      </div>
    </>
  );
}

const PASSOS = [
  "Crie sua conta",
  "Informe os dados e o enquadramento da empresa",
  "Importe suas notas e extratos",
];

function PainelPassos() {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-page-title sm:text-hero">
        Comece em <span className="text-accent">três passos.</span>
      </div>
      <ol className="hidden flex-col gap-3.5 text-lead text-on-ink-muted sm:flex">
        {PASSOS.map((passo, indice) => (
          <li key={passo} className="flex items-baseline gap-3">
            <span className="font-bold text-accent">{indice + 1}</span>
            <span>{passo}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Título (h1) e subtítulo no topo de cada formulário de acesso. */
function AcessoTitulo({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-page-title">{titulo}</h1>
      {children ? <div className="text-ink-muted">{children}</div> : null}
    </div>
  );
}

export { AcessoShell, AcessoTitulo, PainelApresentacao, PainelPassos };

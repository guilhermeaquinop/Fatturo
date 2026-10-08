// Moldura das telas de acesso: painel ink à esquerda e formulário de até 380px à direita.
// Equivale ao layouts/guest.blade.php do Laravel. Empilha no celular (flex-wrap).
import * as React from "react";

type AcessoShellProps = {
  /** Conteúdo do meio do painel escuro. Padrão: a frase de apresentação do login. */
  painel?: React.ReactNode;
  children: React.ReactNode;
};

function AcessoShell({ painel = <PainelApresentacao />, children }: AcessoShellProps) {
  return (
    <div className="flex min-h-screen flex-wrap bg-surface">
      <aside className="flex flex-[1_1_360px] flex-col justify-between gap-12 bg-ink p-12 text-on-ink">
        <div className="text-wordmark-lg">Fatturo</div>
        <div className="max-w-[440px]">{painel}</div>
        <div className="text-caption text-on-ink-muted">Para MEI e ME no Simples Nacional</div>
      </aside>
      <main className="flex flex-[1_1_420px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-form">{children}</div>
      </main>
    </div>
  );
}

function PainelApresentacao() {
  return (
    <>
      <div className="text-hero">
        Faturamento, limite e DAS <span className="text-accent">sob controle.</span>
      </div>
      <div className="mt-4 text-lead text-on-ink-muted">
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
      <div className="text-hero">
        Comece em <span className="text-accent">três passos.</span>
      </div>
      <ol className="flex flex-col gap-3.5 text-lead text-on-ink-muted">
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

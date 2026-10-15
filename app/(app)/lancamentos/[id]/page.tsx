// Página /lancamentos/[id]: edição e exclusão de um lançamento.
// Equivale à rota GET /lancamentos/{lancamento}/edit de um LancamentoController.
// O [id] na pasta é o parâmetro da rota, como o {lancamento} do Laravel.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { empresaAtual } from "@/lib/empresa";
import { lancamentoPorId } from "@/lib/lancamentos";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { LancamentoForm } from "../lancamento-form";

export const metadata: Metadata = { title: "Editar lançamento" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditarLancamentoPage({ params }: PageProps<"/lancamentos/[id]">) {
  return (
    <AppShell ativa="lancamentos" voltar={{ href: "/lancamentos", titulo: "Lançamentos" }}>
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
        <h1 className="text-page-title">Editar lançamento</h1>
        <Suspense fallback={<div className="text-ink-muted">Carregando…</div>}>
          <Formulario params={params} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Formulario({ params }: Pick<PageProps<"/lancamentos/[id]">, "params">) {
  if (!(await empresaAtual())) redirect(ROTA_CONFIGURACAO);

  const { id } = await params;
  // Id malformado ou de outra empresa (o RLS esconde): página não encontrada.
  const lancamento = UUID.test(id) ? await lancamentoPorId(id) : null;
  if (!lancamento) notFound();

  return (
    <LancamentoForm
      // A key recria o formulário quando o lançamento muda, em vez de reaproveitar o estado
      // de uma visita anterior (o Next mantém páginas visitadas ocultas).
      key={JSON.stringify(lancamento)}
      lancamento={lancamento}
      voltarPara={`/lancamentos?mes=${lancamento.data.slice(0, 7)}`}
    />
  );
}

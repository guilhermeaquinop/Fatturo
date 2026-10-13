// Página /lancamentos/novo: formulário do lançamento manual.
// Equivale à rota GET /lancamentos/create de um LancamentoController.
// Aceita data passada, para registrar entradas e saídas anteriores ao uso do Fatturo.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { empresaAtual } from "@/lib/empresa";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { LancamentoForm } from "../lancamento-form";

export const metadata: Metadata = { title: "Novo lançamento" };

export default function NovoLancamentoPage() {
  return (
    <AppShell ativa="lancamentos">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
        <div>
          <h1 className="text-page-title">Novo lançamento</h1>
          <div className="text-ink-muted">
            Para o que não veio num extrato, como um recebimento em dinheiro.
          </div>
        </div>
        <Suspense fallback={<div className="text-ink-muted">Carregando…</div>}>
          <Formulario />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Formulario() {
  if (!(await empresaAtual())) redirect(ROTA_CONFIGURACAO);
  return <LancamentoForm voltarPara="/lancamentos" />;
}

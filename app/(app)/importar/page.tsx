// Página /importar: importação de XML de NFS-e e de extratos em OFX ou CSV.
// Equivale à rota GET /importacoes/create. Quem ainda não configurou a empresa é mandado
// a /configuracao.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { empresaAtual } from "@/lib/empresa";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { ImportarForm } from "./importar-form";

export const metadata: Metadata = { title: "Importar arquivos" };

export default function ImportarPage() {
  return (
    <AppShell ativa="importar">
      <div>
        <h1 className="text-page-title">Importar arquivos</h1>
        <div className="text-ink-muted">
          Envie os XML das NFS-e emitidas, baixados no Emissor Nacional, e os extratos do banco em
          OFX ou CSV.
        </div>
      </div>
      <Suspense fallback={<div className="text-ink-muted">Carregando…</div>}>
        <Importacao />
      </Suspense>
    </AppShell>
  );
}

async function Importacao() {
  if (!(await empresaAtual())) redirect(ROTA_CONFIGURACAO);
  return <ImportarForm />;
}

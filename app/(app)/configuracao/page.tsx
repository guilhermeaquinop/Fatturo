// Página /configuracao: configuração inicial da empresa, feita uma única vez.
// Equivale à rota GET /empresa/create com a view do formulário. Quem já tem empresa
// é mandado ao painel. Mockup: docs/mockups/configuracao.html.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app/app-header";
import { formatarReaisCurto } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { parametrosVigentes } from "@/lib/parametros";
import { ROTA_INICIAL } from "@/lib/rotas";
import { ConfiguracaoForm } from "./configuracao-form";

export const metadata: Metadata = { title: "Configure sua empresa" };

export default function ConfiguracaoPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <AppHeader />
      <main className="flex justify-center px-5 pt-12 pb-16">
        <div className="flex w-full max-w-[560px] flex-col gap-7">
          <div>
            <h1 className="text-page-title">Configure sua empresa</h1>
            <div className="text-ink-muted">
              Essas informações definem o limite e o DAS mostrados no painel.
            </div>
          </div>
          {/* O formulário depende do usuário logado e da tabela de parâmetros, lidos na
              requisição; o Suspense mostra o resto da página enquanto isso chega. */}
          <Suspense
            fallback={
              <div className="rounded-xl border border-border bg-surface p-7 text-ink-muted">
                Carregando…
              </div>
            }
          >
            <Configuracao />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Configuracao() {
  if (await empresaAtual()) redirect(ROTA_INICIAL);

  // Os limites exibidos nos cartões de porte vêm da tabela `parametro`, nunca do código.
  const { valores: parametros } = await parametrosVigentes();
  const limites = {
    MEI: formatarReaisCurto(parametros.limite_anual_mei),
    ME: formatarReaisCurto(parametros.limite_anual_me),
  };

  return <ConfiguracaoForm limites={limites} />;
}

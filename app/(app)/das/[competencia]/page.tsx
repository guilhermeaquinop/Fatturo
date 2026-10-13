// Página /das/[competencia]: a guia do DAS de um mês (ex.: /das/2026-07).
// Equivale à rota GET /das/{competencia}/edit de um GuiaDasController.
// O [competencia] na pasta é o parâmetro da rota, como o {competencia} do Laravel.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Metric } from "@/components/ui/metric";
import { dasDoAno } from "@/lib/das";
import { anoDe, hojeIso, nomeDoMes } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { mesValido } from "@/lib/regras/lancamentos";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { GuiaForm } from "../guia-form";

export const metadata: Metadata = { title: "Guia do DAS" };

export default function GuiaDasPage({ params }: PageProps<"/das/[competencia]">) {
  return (
    <AppShell ativa="das">
      <div className="flex w-full max-w-[560px] flex-col gap-5">
        <Suspense fallback={<div className="text-ink-muted">Carregando…</div>}>
          <Guia params={params} />
        </Suspense>
      </div>
    </AppShell>
  );
}

async function Guia({ params }: Pick<PageProps<"/das/[competencia]">, "params">) {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const { competencia } = await params;
  const hoje = hojeIso();
  // Mês malformado, anterior à abertura ou de um ano futuro: página não encontrada.
  if (!mesValido(competencia) || anoDe(`${competencia}-01`) > anoDe(hoje)) notFound();

  const ano = anoDe(`${competencia}-01`);
  const { meses } = await dasDoAno(empresa, ano);
  const mes = meses.find((item) => item.competencia === competencia);
  if (!mes) notFound();

  return (
    <>
      <div>
        <h1 className="text-page-title">
          DAS de {nomeDoMes(mes.mes)} de {ano}
        </h1>
        <div className="text-ink-muted">
          {mes.porte === "MEI"
            ? "Neste mês a empresa era MEI: o DAS tem valor fixo."
            : "Neste mês a empresa era ME: o DAS varia com a receita."}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-12 gap-y-5 rounded-xl border border-border bg-surface p-6">
        <Metric
          label="Receita do mês"
          value={formatarReais(mes.receitaCentavos)}
          hint="Soma das notas emitidas, pela competência."
        />
        {mes.sugestaoCentavos !== null ? (
          <Metric
            label="Valor sugerido"
            value={formatarReais(mes.sugestaoCentavos)}
            hint="Pela alíquota da 1ª faixa do Anexo III."
          />
        ) : null}
      </div>

      <GuiaForm
        // A key recria o formulário quando a guia muda, em vez de reaproveitar o estado de uma
        // visita anterior (o Next mantém páginas visitadas ocultas).
        key={JSON.stringify([mes.competencia, mes.vencimento, mes.valorCentavos, mes.pagoEm])}
        competencia={mes.competencia}
        vencimento={mes.vencimento}
        valorCentavos={mes.valorCentavos}
        pagoEm={mes.pagoEm}
        sugestaoCentavos={mes.sugestaoCentavos}
        hoje={hoje}
        voltarPara={`/das?ano=${ano}`}
      />
    </>
  );
}

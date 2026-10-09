// Página /painel, PROVISÓRIA: mostra a empresa configurada e o limite do ano.
// Equivale à rota GET /dashboard. A etapa 3 troca o conteúdo pelo painel de verdade
// (docs/mockups/painel.html). Quem ainda não configurou a empresa é mandado a /configuracao.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/app/app-header";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { mascararCnpj } from "@/lib/cnpj";
import { anoDe, formatarDataBr, hojeIso } from "@/lib/datas";
import { formatarReaisInteiros } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { parametrosVigentes } from "@/lib/parametros";
import { limiteDoAno, mesesDeAtividade } from "@/lib/regras/limite";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import {
  ROTULO_ANEXO,
  ROTULO_ATIVIDADE,
  ROTULO_PORTE,
  ROTULO_REGIME,
} from "@/lib/validacao/empresa";

export const metadata: Metadata = { title: "Painel" };

export default function PainelPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <AppHeader />
      <main className="flex justify-center px-5 pt-12 pb-16">
        <div className="flex w-full max-w-[560px] flex-col gap-7">
          <Suspense fallback={<div className="text-ink-muted">Carregando sua empresa…</div>}>
            <ResumoDaEmpresa />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function ResumoDaEmpresa() {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const hoje = hojeIso();
  const ano = anoDe(hoje);
  const { porte, regime, anexo } = empresa.enquadramento;
  const parametros = await parametrosVigentes(hoje);
  const limite = limiteDoAno({
    porte,
    dataAbertura: empresa.dataAbertura,
    ano,
    parametros: parametros.valores,
  });
  const meses = mesesDeAtividade(empresa.dataAbertura, ano);

  const linhas: [string, string][] = [
    ["CNPJ", mascararCnpj(empresa.cnpj)],
    ["Data de abertura", formatarDataBr(empresa.dataAbertura)],
    ["Porte", ROTULO_PORTE[porte]],
    ["Regime tributário", ROTULO_REGIME[regime]],
    ["Atividade", ROTULO_ATIVIDADE[empresa.atividade]],
  ];
  if (anexo) linhas.push(["Anexo do Simples", ROTULO_ANEXO[anexo]]);

  return (
    <>
      <div>
        <h1 className="text-page-title">{empresa.nome}</h1>
        <div className="text-ink-muted">Empresa configurada.</div>
      </div>

      <section
        aria-label={`Limite de ${ano}`}
        className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-7"
      >
        <div>
          <div className="text-ink-muted">Limite de faturamento em {ano}</div>
          <div className="text-metric">{formatarReaisInteiros(limite)}</div>
          {meses < 12 ? (
            <div className="text-caption text-ink-muted">
              Proporcional a {meses} {meses === 1 ? "mês" : "meses"} de atividade no ano de
              abertura.
            </div>
          ) : null}
        </div>
        <dl className="flex flex-col">
          {linhas.map(([rotulo, valor]) => (
            <div
              key={rotulo}
              className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-divider py-3 last:border-b-0"
            >
              <dt className="text-ink-muted">{rotulo}</dt>
              <dd className="font-semibold">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      {parametros.aConfirmar.length > 0 ? (
        <Alert variant="warning">
          <AlertTitle>Limite a confirmar</AlertTitle>
          Os valores legais usados aqui ainda precisam ser conferidos com o contador.
        </Alert>
      ) : null}

      <Alert variant="info">
        <AlertTitle>Painel provisório</AlertTitle>
        O acumulado do ano, a projeção e a importação de notas chegam na próxima etapa.
      </Alert>
    </>
  );
}

// Página /lancamentos: entradas e saídas do mês, com filtro por categoria, classificação em
// lote e acesso ao lançamento manual. Equivale à rota GET /lancamentos (index) de um
// LancamentoController com uma view Blade. O mês e o filtro vêm da URL (?mes=2026-10&categoria=sem).
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { textLinkClassName } from "@/components/ui/text-link";
import { anoDe, hojeIso, mesDe, nomeDoMes } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { dataDoUltimoLancamento, lancamentosDoPeriodo } from "@/lib/lancamentos";
import {
  deslocarMes,
  filtrarPorCategoria,
  filtroDeCategoria,
  limitesDoMes,
  mesValido,
  totais,
  type FiltroDeCategoria,
} from "@/lib/regras/lancamentos";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { cn } from "@/lib/utils";
import { CATEGORIAS, ROTULO_CATEGORIA_CURTO, SEM_CLASSIFICACAO } from "@/lib/validacao/lancamento";
import { LancamentosTabela } from "./lancamentos-tabela";

export const metadata: Metadata = { title: "Lançamentos" };

const FILTRO =
  "flex min-h-control-sm items-center rounded-pill px-4 font-medium text-ink-muted aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink";

export default function LancamentosPage({ searchParams }: PageProps<"/lancamentos">) {
  return (
    <AppShell ativa="lancamentos">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page-title">Lançamentos</h1>
          <div className="text-ink-muted">
            Entradas e saídas da conta, vindas dos extratos ou digitadas.
          </div>
        </div>
        <Button asChild>
          <Link href="/lancamentos/novo">Novo lançamento</Link>
        </Button>
      </div>
      {/* A lista depende do usuário logado e da URL, lidos na requisição. */}
      <Suspense fallback={<div className="text-ink-muted">Carregando os lançamentos…</div>}>
        <Lancamentos searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

function nomeCompleto(mes: string): string {
  return `${nomeDoMes(mesDe(`${mes}-01`))} de ${anoDe(`${mes}-01`)}`;
}

function endereco(mes: string, filtro: FiltroDeCategoria): string {
  return `/lancamentos?mes=${mes}${filtro ? `&categoria=${filtro}` : ""}`;
}

async function Lancamentos({ searchParams }: Pick<PageProps<"/lancamentos">, "searchParams">) {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const parametros = await searchParams;
  const mesAtual = hojeIso().slice(0, 7);

  // Sem mês na URL, abre no mês do lançamento mais recente (ou no mês atual, se não houver).
  let mes = typeof parametros.mes === "string" && mesValido(parametros.mes) ? parametros.mes : null;
  if (!mes) mes = (await dataDoUltimoLancamento(empresa.id))?.slice(0, 7) ?? mesAtual;

  const filtro = filtroDeCategoria(parametros.categoria);
  const { de, ate } = limitesDoMes(mes);
  const doMes = await lancamentosDoPeriodo(empresa.id, de, ate);
  const exibidos = filtrarPorCategoria(doMes, filtro);
  const resumo = totais(doMes);

  const filtros: { rotulo: string; valor: FiltroDeCategoria }[] = [
    { rotulo: "Todos", valor: null },
    { rotulo: SEM_CLASSIFICACAO, valor: "sem" },
    ...CATEGORIAS.map((categoria) => ({
      rotulo: ROTULO_CATEGORIA_CURTO[categoria],
      valor: categoria,
    })),
  ];

  return (
    <>
      <Alert variant="info">
        <AlertTitle>Estes lançamentos ainda não somam no faturamento do painel</AlertTitle>
        Hoje o painel soma só as notas fiscais. Se somasse também o extrato, uma nota de R$ 3.200 e
        o Pix de R$ 3.200 que a pagou virariam R$ 6.400. Na próxima etapa você liga cada recebimento
        à sua nota, e o painel passa a contar os dois como uma receita só.
      </Alert>

      <Card hero aria-label={`Resumo de ${nomeCompleto(mes)}`}>
        <nav aria-label="Mês" className="flex flex-wrap items-center justify-between gap-3">
          <Link href={endereco(deslocarMes(mes, -1), filtro)} className={textLinkClassName}>
            ‹ {nomeDoMes(mesDe(`${deslocarMes(mes, -1)}-01`))}
          </Link>
          <h2 className="text-section-title">{nomeCompleto(mes)}</h2>
          {mes < mesAtual ? (
            <Link href={endereco(deslocarMes(mes, 1), filtro)} className={textLinkClassName}>
              {nomeDoMes(mesDe(`${deslocarMes(mes, 1)}-01`))} ›
            </Link>
          ) : (
            // Mantém o título centralizado quando não há mês seguinte.
            <span aria-hidden className="invisible">
              {nomeDoMes(mesDe(`${mes}-01`))} ›
            </span>
          )}
        </nav>
        <div className="flex flex-wrap gap-x-12 gap-y-5">
          <Metric label="Entradas" value={formatarReais(resumo.entradasCentavos)} />
          <Metric label="Saídas" value={formatarReais(resumo.saidasCentavos)} />
          <Metric
            label={SEM_CLASSIFICACAO}
            value={String(resumo.semClassificacao)}
            hint={`de ${doMes.length} ${doMes.length === 1 ? "lançamento" : "lançamentos"} no mês`}
          />
        </div>
      </Card>

      <Card aria-label="Lista de lançamentos">
        <nav aria-label="Categoria" className="flex flex-wrap gap-2">
          {filtros.map((item) => (
            <Link
              key={item.rotulo}
              href={endereco(mes, item.valor)}
              aria-current={item.valor === filtro ? "page" : undefined}
              className={cn(FILTRO)}
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        {exibidos.length > 0 ? (
          <LancamentosTabela lancamentos={exibidos} />
        ) : (
          <div className="text-ink-muted">
            {doMes.length === 0 ? (
              <>
                Nenhum lançamento em {nomeCompleto(mes)}.{" "}
                <Link href="/importar" className={textLinkClassName}>
                  Importe um extrato
                </Link>{" "}
                ou crie um lançamento manual.
              </>
            ) : (
              "Nenhum lançamento com este filtro neste mês."
            )}
          </div>
        )}
      </Card>
    </>
  );
}

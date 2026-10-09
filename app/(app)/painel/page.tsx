// Página /painel: faturamento do ano contra o limite, projeção, gráfico e origem do faturamento.
// Equivale à rota GET /dashboard com um Controller que busca os dados e uma view Blade.
// Os números vêm das NFS-e importadas, pela data de competência. Mockup: docs/mockups/painel.html.
// Pendências (etapa 5) e DAS (etapa 6) ainda aparecem como "em breve".
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { GraficoAcumulado } from "@/components/painel/grafico-acumulado";
import { LimitBar } from "@/components/painel/limit-bar";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Metric } from "@/components/ui/metric";
import { anoDe, hojeIso, mesDe, nomeCurtoDoMes, nomeDoMes } from "@/lib/datas";
import { formatarReaisInteiros } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { notasDoPeriodo } from "@/lib/notas";
import { parametrosVigentes } from "@/lib/parametros";
import {
  faturamentoPorMes,
  origemDoFaturamento,
  percentualDoLimite,
  projetar,
  receitaUltimos12Meses,
  serieDoGrafico,
} from "@/lib/regras/faturamento";
import { limiteDoAno, mesesDeAtividade } from "@/lib/regras/limite";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel" };

// Faixa em que o chip do limite vira alerta. As faixas configuráveis chegam na etapa 7.
const FAIXA_DE_ALERTA = 70;
// Quantos anos o seletor mostra, contando o atual.
const ANOS_NO_SELETOR = 6;

export default function PainelPage({ searchParams }: PageProps<"/painel">) {
  return (
    <AppShell ativa="painel">
      {/* Tudo aqui depende do usuário logado e da URL (?ano=), lidos na requisição. */}
      <Suspense fallback={<div className="text-ink-muted">Carregando o painel…</div>}>
        <Painel searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

async function Painel({ searchParams }: Pick<PageProps<"/painel">, "searchParams">) {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const hoje = hojeIso();
  const anoAtual = anoDe(hoje);
  const anoDeAbertura = anoDe(empresa.dataAbertura);

  // Ano escolhido no seletor (?ano=2025). Fora do intervalo válido, vale o ano atual.
  const pedido = Number((await searchParams).ano);
  const ano =
    Number.isInteger(pedido) && pedido >= anoDeAbertura && pedido <= anoAtual ? pedido : anoAtual;
  const anoCorrente = ano === anoAtual;

  // Parâmetros legais em vigor no ano exibido.
  const parametros = await parametrosVigentes(anoCorrente ? hoje : `${ano}-12-31`);
  const { porte } = empresa.enquadramento;
  const limite = limiteDoAno({
    porte,
    dataAbertura: empresa.dataAbertura,
    ano,
    parametros: parametros.valores,
  });
  const meses = mesesDeAtividade(empresa.dataAbertura, ano);

  // Busca o ano exibido e, para a receita de 12 meses, também o ano anterior ao atual.
  const notas = await notasDoPeriodo(
    empresa.id,
    `${Math.min(ano, anoAtual - 1)}-01-01`,
    `${anoAtual}-12-31`,
  );

  const porMes = faturamentoPorMes(notas, ano);
  const acumulado = porMes.reduce((soma, valor) => soma + valor, 0);
  const projecao = projetar({ porMes, ano, hoje, dataAbertura: empresa.dataAbertura });
  const percentual = percentualDoLimite(acumulado, limite);
  const percentualProjetado =
    anoCorrente && projecao.valorCentavos !== null
      ? percentualDoLimite(projecao.valorCentavos, limite)
      : null;
  const origem = origemDoFaturamento(notas, ano);
  const serie = serieDoGrafico({
    porMes,
    ano,
    hoje,
    projecaoCentavos: anoCorrente ? projecao.valorCentavos : null,
  });
  const pontos = serie.acumulado.map((valor, indice) => ({
    mes: nomeCurtoDoMes(indice + 1),
    acumulado: valor,
    projecao: serie.projecao[indice],
  }));

  const anos = Array.from(
    { length: Math.min(anoAtual - anoDeAbertura + 1, ANOS_NO_SELETOR) },
    (_, indice) => anoAtual - indice,
  ).reverse();

  return (
    <>
      {anos.length > 1 ? (
        <nav aria-label="Ano" className="flex flex-wrap justify-end gap-2">
          {anos.map((opcao) => (
            <Link
              key={opcao}
              href={opcao === anoAtual ? "/painel" : `/painel?ano=${opcao}`}
              aria-current={opcao === ano ? "page" : undefined}
              className={cn(
                "flex min-h-control-sm items-center rounded-pill px-4 font-medium text-ink-muted",
                "aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink",
              )}
            >
              {opcao}
            </Link>
          ))}
        </nav>
      ) : null}

      <Card hero aria-label={`Limite anual de ${ano}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-medium text-ink-muted">Faturamento em {ano}</h1>
            <div className="text-display">{formatarReaisInteiros(acumulado)}</div>
            <div className="text-ink-muted">
              de {formatarReaisInteiros(limite)} do limite anual
              {meses < 12
                ? `, proporcional a ${meses} ${meses === 1 ? "mês" : "meses"} de atividade`
                : ""}
            </div>
          </div>
          {percentual >= 100 ? (
            <Chip variant="error">
              Limite ultrapassado em {formatarReaisInteiros(acumulado - limite)}
            </Chip>
          ) : (
            <Chip variant={percentual >= FAIXA_DE_ALERTA ? "warning" : "default"}>
              {Math.floor(percentual)}% do limite utilizado
            </Chip>
          )}
        </div>

        <LimitBar
          percentual={percentual}
          projecao={percentualProjetado}
          rotuloAtual={anoCorrente ? "hoje" : "dezembro"}
        />

        <div className="flex flex-wrap gap-x-12 gap-y-5">
          <Metric label="Disponível" value={formatarReaisInteiros(Math.max(limite - acumulado, 0))} />
          {anoCorrente ? (
            <>
              <Metric
                label="Projeção até dezembro"
                value={
                  projecao.valorCentavos === null
                    ? "Sem base"
                    : formatarReaisInteiros(projecao.valorCentavos)
                }
                hint={
                  projecao.valorCentavos === null
                    ? "Aparece depois do primeiro mês fechado."
                    : undefined
                }
              />
              <Metric
                label={`Receita em ${nomeDoMes(mesDe(hoje))}`}
                value={formatarReaisInteiros(porMes[mesDe(hoje) - 1])}
              />
              {/* A receita de 12 meses define a faixa de alíquota do Simples (só ME). */}
              {porte === "ME" ? (
                <Metric
                  label="Receita em 12 meses"
                  value={formatarReaisInteiros(receitaUltimos12Meses(notas, hoje))}
                  hint={`Até ${nomeDoMes(mesDe(hoje) === 1 ? 12 : mesDe(hoje) - 1)}.`}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </Card>

      {parametros.aConfirmar.length > 0 ? (
        <Alert variant="warning">
          <AlertTitle>Limite a confirmar</AlertTitle>
          Os valores legais usados aqui ainda precisam ser conferidos com o contador.
        </Alert>
      ) : null}

      {acumulado === 0 ? (
        <Alert variant="info">
          <AlertTitle>Nenhuma nota em {ano}</AlertTitle>
          Importe os XML das NFS-e emitidas para ver o faturamento, a projeção e a origem.
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-5">
        <Card aria-label="Faturamento acumulado e limite" className="flex-[3_1_440px]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <CardTitle>Acumulado no ano e limite</CardTitle>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-caption text-ink-muted">
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-[18px] rounded-pill bg-accent-strong" />
                <span>Faturamento</span>
              </div>
              {anoCorrente ? (
                <div className="flex items-center gap-2">
                  <span className="w-[18px] border-t-[3px] border-dotted border-accent-strong" />
                  <span>Projeção</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <span className="w-[18px] border-t border-dashed border-ink" />
                <span>Limite</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div
              className="min-w-[480px]"
              role="img"
              aria-label={`Faturamento acumulado em ${ano}: ${formatarReaisInteiros(acumulado)} de ${formatarReaisInteiros(limite)} do limite.`}
            >
              <GraficoAcumulado
                pontos={pontos}
                limiteCentavos={limite}
                indiceAtual={serie.indiceAtual}
              />
            </div>
          </div>
        </Card>

        <Card aria-label="Origem do faturamento" className="flex-[2_1_260px]">
          <CardTitle>Origem do faturamento</CardTitle>
          {origem.length > 0 ? (
            <ul className="flex flex-col">
              {origem.map((item) => (
                <li
                  key={item.nome}
                  className="flex justify-between gap-3 border-b border-divider py-3 last:border-b-0"
                >
                  <span className="min-w-0 break-words">{item.nome}</span>
                  <span className="font-semibold">{item.percentual}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-ink-muted">Aparece depois da primeira nota importada.</div>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-5">
        <Card aria-label="Pendências" className="flex-[3_1_440px] gap-4">
          <CardTitle>Pendências</CardTitle>
          <div className="text-ink-muted">
            Em breve. Os lançamentos sem classificação e as notas sem recebimento aparecem aqui.
          </div>
        </Card>
        <Card aria-label="DAS" className="flex-[2_1_260px] gap-4">
          <CardTitle>DAS</CardTitle>
          <div className="text-ink-muted">Em breve. O calendário das guias do ano aparece aqui.</div>
        </Card>
      </div>

    </>
  );
}

// Página /painel: faturamento do ano contra o limite, projeção, gráfico e origem do faturamento.
// Equivale à rota GET /dashboard com um Controller que busca os dados e uma view Blade.
// Os números vêm das NFS-e importadas, pela data de competência. Mockup: docs/mockups/painel.html.
// As pendências (etapa 5) ainda aparecem como "em breve".
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { DasStrip, resumoEmTexto } from "@/components/das/das-strip";
import { GraficoAcumulado } from "@/components/painel/grafico-acumulado";
import { LimitBar } from "@/components/painel/limit-bar";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Metric } from "@/components/ui/metric";
import { Valor } from "@/components/valor";
import { dasDoAno } from "@/lib/das";
import { anoDe, formatarDataBr, hojeIso, mesDe, nomeCurtoDoMes, nomeDoMes } from "@/lib/datas";
import { empresaAtual } from "@/lib/empresa";
import { notasDoPeriodo } from "@/lib/notas";
import { parametrosVigentes } from "@/lib/parametros";
import { dasPagoAcumulado, diasEntre, resumoDoDas } from "@/lib/regras/das";
import { enquadramentoEm, mudancaDePorteNoAno } from "@/lib/regras/enquadramento";
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

  // Data de referência do ano exibido: hoje, ou 31 de dezembro nos anos fechados.
  const referencia = anoCorrente ? hoje : `${ano}-12-31`;
  // Parâmetros legais em vigor no ano exibido.
  const parametros = await parametrosVigentes(referencia);
  // Porte daquele ano, pelo histórico: quem foi MEI e virou ME vê cada ano com o seu limite.
  // No ano da mudança vale o porte novo, contra o faturamento do ano inteiro, com um aviso.
  const { porte } = enquadramentoEm(empresa.enquadramentos, referencia);
  const mudanca = mudancaDePorteNoAno(empresa.enquadramentos, ano, referencia);
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
  // DAS do ano exibido: a faixa de meses do cartão e a linha do DAS pago no gráfico.
  const das = await dasDoAno(empresa, ano, notas);
  const resumoDas = resumoDoDas(das.meses);
  const dasPago = dasPagoAcumulado(das.meses, anoCorrente ? mesDe(hoje) : 12);
  const diasParaVencer = resumoDas.proxima ? diasEntre(hoje, resumoDas.proxima.vencimento) : null;

  const pontos = serie.acumulado.map((valor, indice) => ({
    mes: nomeCurtoDoMes(indice + 1),
    acumulado: valor,
    projecao: serie.projecao[indice],
    das: dasPago[indice],
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
            <div className="text-display-sm sm:text-display">
              <Valor centavos={acumulado} formato="inteiro" />
            </div>
            <div className="text-ink-muted">
              de <Valor centavos={limite} formato="inteiro" /> do limite anual
              {meses < 12
                ? `, proporcional a ${meses} ${meses === 1 ? "mês" : "meses"} de atividade`
                : ""}
            </div>
          </div>
          {percentual >= 100 ? (
            <Chip variant="error">
              Limite ultrapassado em <Valor centavos={acumulado - limite} formato="inteiro" />
            </Chip>
          ) : (
            // Vira alerta a partir da primeira faixa escolhida em Configurações.
            <Chip variant={percentual >= empresa.alertaFaixas[0] ? "warning" : "default"}>
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
          <Metric label="Disponível" value={<Valor centavos={Math.max(limite - acumulado, 0)} formato="inteiro" />} />
          {anoCorrente ? (
            <>
              <Metric
                label="Projeção até dezembro"
                value={
                  projecao.valorCentavos === null
                    ? "Sem base"
                    : <Valor centavos={projecao.valorCentavos} formato="inteiro" />
                }
                hint={
                  projecao.valorCentavos === null
                    ? "Aparece depois do primeiro mês fechado."
                    : undefined
                }
              />
              <Metric
                label={`Receita em ${nomeDoMes(mesDe(hoje))}`}
                value={<Valor centavos={porMes[mesDe(hoje) - 1]} formato="inteiro" />}
              />
              {/* A receita de 12 meses define a faixa de alíquota do Simples (só ME). */}
              {porte === "ME" ? (
                <Metric
                  label="Receita em 12 meses"
                  value={<Valor centavos={receitaUltimos12Meses(notas, hoje)} formato="inteiro" />}
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

      {mudanca ? (
        <Alert variant="info">
          <AlertTitle>
            {mudanca.porteAnterior} até {nomeDoMes(mesDe(mudanca.ate))} de {ano}
          </AlertTitle>
          A empresa passou de {mudanca.porteAnterior} para {porte} neste ano. O limite mostrado é o
          da {porte}, contra o faturamento do ano inteiro.
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
              <div className="flex items-center gap-2">
                <span className="h-[3px] w-[18px] rounded-pill bg-brand-deep" />
                <span>DAS pago</span>
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
              aria-label={`Faturamento acumulado em ${ano}: ${Math.floor(percentual)}% do limite.`}
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
          {resumoDas.proxima && diasParaVencer !== null ? (
            <div>
              <div className="text-ink-muted">
                {diasParaVencer < 0
                  ? `Guia vencida há ${-diasParaVencer} ${diasParaVencer === -1 ? "dia" : "dias"}`
                  : diasParaVencer === 0
                    ? "Próximo vencimento, hoje"
                    : `Próximo vencimento, em ${diasParaVencer} ${diasParaVencer === 1 ? "dia" : "dias"}`}
              </div>
              <div className="text-metric">
                {formatarDataBr(resumoDas.proxima.vencimento).slice(0, 5)}
                {resumoDas.proxima.valorCentavos !== null ? (
                  <>
                    {" · "}
                    <Valor centavos={resumoDas.proxima.valorCentavos} />
                  </>
                ) : resumoDas.proxima.sugestaoCentavos !== null ? (
                  <>
                    {" · cerca de "}
                    <Valor centavos={resumoDas.proxima.sugestaoCentavos} />
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-ink-muted">Nenhuma guia em aberto em {ano}.</div>
          )}
          <DasStrip meses={das.meses} />
          <div className="text-caption text-ink-muted">
            {resumoEmTexto(das.meses)} · <Valor centavos={resumoDas.pagoCentavos} /> pagos em {ano}
          </div>
          <div>
            <Button asChild variant="tint">
              <Link
                href={resumoDas.proxima ? `/das/${resumoDas.proxima.competencia}` : `/das?ano=${ano}`}
              >
                {resumoDas.proxima
                  ? `Informar o pagamento de ${nomeDoMes(resumoDas.proxima.mes)}`
                  : "Ver o DAS"}
              </Link>
            </Button>
          </div>
        </Card>
      </div>

    </>
  );
}

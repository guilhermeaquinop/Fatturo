// Página /das: os meses do DAS do ano, com receita, vencimento, valor e situação de cada guia.
// Equivale à rota GET /das (index) de um GuiaDasController com uma view Blade.
// O ano vem da URL (?ano=2026). Cada mês leva a /das/[competencia], onde se informa o valor
// e o pagamento.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { SeletorDeAno } from "@/components/app/pilulas";
import { DasStrip, resumoEmTexto } from "@/components/das/das-strip";
import { SituacaoDaGuia } from "@/components/das/situacao-da-guia";
import { Alert, AlertSaibaMais, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SetaDireitaIcon } from "@/components/ui/icons";
import { Metric } from "@/components/ui/metric";
import { textLinkClassName } from "@/components/ui/text-link";
import { Valor } from "@/components/valor";
import { dasDoAno } from "@/lib/das";
import { anoDe, formatarDataBr, hojeIso, nomeDoMes } from "@/lib/datas";
import { empresaAtual } from "@/lib/empresa";
import { diasEntre, resumoDoDas, type MesDoDas } from "@/lib/regras/das";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";

export const metadata: Metadata = { title: "DAS" };

const CELULA = "border-b border-divider px-3 py-3.5 align-top";
const CABECALHO =
  "border-b border-border px-3 py-2.5 text-left text-caption font-semibold text-ink-muted";
// Quantos anos o seletor mostra, contando o atual.
const ANOS_NO_SELETOR = 6;

export default function DasPage({ searchParams }: PageProps<"/das">) {
  return (
    <AppShell ativa="das">
      <div>
        <h1 className="text-page-title">DAS</h1>
        <div className="text-ink-muted">
          A guia mensal do Simples Nacional: quanto venceu, quanto foi pago e o que falta.
        </div>
      </div>
      {/* A lista depende do usuário logado e da URL, lidos na requisição. */}
      <Suspense fallback={<div className="text-ink-muted">Carregando o DAS…</div>}>
        <Das searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

/** "em 7 dias", "hoje" ou "há 22 dias". */
function prazo(vencimento: string, hoje: string): string {
  const dias = diasEntre(hoje, vencimento);
  if (dias === 0) return "hoje";
  if (dias > 0) return `em ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return `há ${-dias} ${dias === -1 ? "dia" : "dias"}`;
}

/** Grupos da lista do celular: o que pede atenção primeiro, as pagas por último. */
const GRUPOS: { titulo: string; filtro: (mes: MesDoDas) => boolean; recentesPrimeiro?: boolean }[] = [
  { titulo: "Em aberto", filtro: (mes) => mes.situacao === "vencida" || mes.situacao === "pendente" },
  { titulo: "A vencer", filtro: (mes) => mes.situacao === "a_vencer" },
  { titulo: "Sem valor informado", filtro: (mes) => mes.situacao === "sem_valor" },
  { titulo: "Pagas", filtro: (mes) => mes.situacao === "paga", recentesPrimeiro: true },
];

/** Uma guia na lista do celular: a linha inteira abre o mês. */
function LinhaDaGuia({ mes }: { mes: MesDoDas }) {
  return (
    <Link
      href={`/das/${mes.competencia}`}
      className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-x-3 gap-y-0.5 border-b border-divider px-5 py-3 last:border-b-0 hover:bg-surface-muted sm:px-6"
    >
      <span className="font-semibold first-letter:uppercase">{nomeDoMes(mes.mes)}</span>
      <span className="text-right font-semibold whitespace-nowrap">
        {mes.valorCentavos !== null ? (
          <Valor centavos={mes.valorCentavos} />
        ) : mes.sugestaoCentavos !== null ? (
          <span className="font-medium text-ink-muted">
            cerca de <Valor centavos={mes.sugestaoCentavos} />
          </span>
        ) : (
          <span className="font-medium text-ink-muted">Não informado</span>
        )}
      </span>
      <SetaDireitaIcon className="row-span-2 text-ink-muted" />
      <span className="min-w-0 text-caption text-ink-muted">
        {mes.porte}
        {mes.pagoEm ? (
          <> · pago em {formatarDataBr(mes.pagoEm).slice(0, 5)}</>
        ) : (
          <>
            {" · vence "}
            {formatarDataBr(mes.vencimento).slice(0, 5)}
            {mes.receitaCentavos > 0 ? (
              <>
                {" · receita "}
                <Valor centavos={mes.receitaCentavos} />
              </>
            ) : null}
          </>
        )}
      </span>
      <span className="justify-self-end">
        <SituacaoDaGuia situacao={mes.situacao} />
      </span>
    </Link>
  );
}

async function Das({ searchParams }: Pick<PageProps<"/das">, "searchParams">) {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const hoje = hojeIso();
  const anoAtual = anoDe(hoje);
  const anoDeAbertura = anoDe(empresa.dataAbertura);

  // Ano escolhido no seletor (?ano=2025). Fora do intervalo válido, vale o ano atual.
  const pedido = Number((await searchParams).ano);
  const ano =
    Number.isInteger(pedido) && pedido >= anoDeAbertura && pedido <= anoAtual ? pedido : anoAtual;

  const { meses, aliquotaSugerida, tetoDaSugestaoCentavos, sugerindo } = await dasDoAno(empresa, ano);
  const resumo = resumoDoDas(meses);
  const semValor = meses.filter((mes) => mes.situacao === "sem_valor");
  const temMei = meses.some((mes) => mes.porte === "MEI");
  const temMe = meses.some((mes) => mes.porte === "ME");
  const percentual = (aliquotaSugerida / 100).toLocaleString("pt-BR");

  const anos = Array.from(
    { length: Math.min(anoAtual - anoDeAbertura + 1, ANOS_NO_SELETOR) },
    (_, indice) => anoAtual - indice,
  ).reverse();

  // Explicações do valor sugerido e do valor fixo do MEI, embaixo da tabela ou da lista.
  const notasDeRodape = (
    <div className="flex flex-col gap-1 text-caption text-ink-muted">
      {temMe ? (
        sugerindo ? (
          <div>
            Nos meses de ME, “cerca de” é uma sugestão: {percentual}% da receita do mês, a
            alíquota da 1ª faixa do Anexo III. Ela vale enquanto a receita de 12 meses ficar até{" "}
            <Valor centavos={tetoDaSugestaoCentavos} formato="inteiro" />. O valor certo é o da guia.
          </div>
        ) : (
          <div>
            A receita de 12 meses passou de{" "}
            <Valor centavos={tetoDaSugestaoCentavos} formato="inteiro" />, e a alíquota de{" "}
            {percentual}% deixou de valer. Informe o valor que está na guia.
          </div>
        )
      ) : null}
      {temMei ? (
        <div>
          Nos meses de MEI o DAS tem valor fixo, que muda a cada ano. Informe o valor que está na
          guia ou no comprovante.
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {/* DAS vencido é erro (README, "Estados"), como o chip do painel. */}
      {resumo.vencidas.length > 0 ? (
        <Alert variant="error">
          <AlertTitle>
            {resumo.vencidas.length === 1
              ? `A guia de ${nomeDoMes(resumo.vencidas[0].mes)} está vencida`
              : `${resumo.vencidas.length} guias vencidas em ${ano}`}
          </AlertTitle>
          Se já pagou, abra o mês e informe a data do pagamento.
          <AlertSaibaMais>
            Guia paga depois do vencimento tem multa e juros: gere uma nova no Portal do Simples
            Nacional.
          </AlertSaibaMais>
        </Alert>
      ) : null}

      <Card hero aria-label={`Resumo do DAS de ${ano}`}>
        {anos.length > 1 ? (
          <SeletorDeAno
            anos={anos}
            ano={ano}
            href={(opcao) => (opcao === anoAtual ? "/das" : `/das?ano=${opcao}`)}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-12">
          <Metric
            label={`Pago em ${ano}`}
            value={<Valor centavos={resumo.pagoCentavos} />}
            hint={`${resumo.pagas} ${resumo.pagas === 1 ? "guia paga" : "guias pagas"}`}
          />
          {resumo.proxima ? (
            <Metric
              label={resumo.proxima.situacao === "vencida" ? "Guia vencida" : "Próximo vencimento"}
              // No celular o valor fica só com a data, e o prazo desce para a linha de baixo.
              value={
                <>
                  {formatarDataBr(resumo.proxima.vencimento).slice(0, 5)}
                  <span className="max-sm:hidden"> · {prazo(resumo.proxima.vencimento, hoje)}</span>
                </>
              }
              hint={
                <>
                  <span className="sm:hidden">{prazo(resumo.proxima.vencimento, hoje)} · </span>
                  {nomeDoMes(resumo.proxima.mes)}
                  {resumo.proxima.valorCentavos !== null ? (
                    <>
                      {" · "}
                      <Valor centavos={resumo.proxima.valorCentavos} />
                    </>
                  ) : resumo.proxima.sugestaoCentavos !== null ? (
                    <>
                      {" · cerca de "}
                      <Valor centavos={resumo.proxima.sugestaoCentavos} />
                    </>
                  ) : (
                    " · valor não informado"
                  )}
                </>
              }
            />
          ) : (
            <Metric label="Próximo vencimento" value="Nada em aberto" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <DasStrip meses={meses} />
          <div className="text-caption text-ink-muted">{resumoEmTexto(meses)}</div>
        </div>
      </Card>

      {semValor.length > 0 ? (
        <Alert variant="info">
          <AlertTitle>
            {semValor.length === 1
              ? "1 mês sem valor informado"
              : `${semValor.length} meses sem valor informado`}
          </AlertTitle>
          São meses que já venceram e ainda não têm registro aqui. Abra cada um e informe o valor e
          a data em que pagou, para o total do ano ficar completo.
        </Alert>
      ) : null}

      {/* Celular: lista em grupos, a linha inteira abre o mês. */}
      <div className="flex flex-col gap-4 lg:hidden">
        {GRUPOS.map((grupo) => {
          const doGrupo = meses.filter(grupo.filtro);
          if (doGrupo.length === 0) return null;
          if (grupo.recentesPrimeiro) doGrupo.reverse();
          return (
            <section key={grupo.titulo} aria-label={grupo.titulo} className="flex flex-col gap-2">
              <h2 className="px-1 text-label text-ink-muted">{grupo.titulo}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {doGrupo.map((mes) => (
                  <LinhaDaGuia key={mes.competencia} mes={mes} />
                ))}
              </div>
            </section>
          );
        })}
        <div className="px-1">{notasDeRodape}</div>
      </div>

      {/* Desktop: a tabela dos 12 meses. */}
      <Card aria-label={`Guias de ${ano}`} className="max-lg:hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th scope="col" className={CABECALHO}>
                  Competência
                </th>
                <th scope="col" className={`${CABECALHO} text-right`}>
                  Receita do mês
                </th>
                <th scope="col" className={CABECALHO}>
                  Vencimento
                </th>
                <th scope="col" className={`${CABECALHO} text-right`}>
                  Valor da guia
                </th>
                <th scope="col" className={CABECALHO}>
                  Situação
                </th>
                <th scope="col" className={CABECALHO}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {meses.map((mes) => (
                <tr key={mes.competencia}>
                  <td className={CELULA}>
                    <div className="font-semibold first-letter:uppercase">{nomeDoMes(mes.mes)}</div>
                    <div className="text-caption text-ink-muted">{mes.porte}</div>
                  </td>
                  <td className={`${CELULA} text-right whitespace-nowrap tabular-nums`}>
                    <Valor centavos={mes.receitaCentavos} />
                  </td>
                  <td className={`${CELULA} whitespace-nowrap tabular-nums`}>
                    {formatarDataBr(mes.vencimento)}
                  </td>
                  <td className={`${CELULA} text-right whitespace-nowrap tabular-nums`}>
                    {mes.valorCentavos !== null ? (
                      <span className="font-semibold"><Valor centavos={mes.valorCentavos} /></span>
                    ) : mes.sugestaoCentavos !== null ? (
                      <span className="text-ink-muted">
                        cerca de <Valor centavos={mes.sugestaoCentavos} />
                      </span>
                    ) : (
                      <span className="text-ink-muted">Não informado</span>
                    )}
                  </td>
                  <td className={CELULA}>
                    <SituacaoDaGuia situacao={mes.situacao} />
                    {mes.pagoEm ? (
                      <div className="mt-1 text-caption text-ink-muted tabular-nums">
                        em {formatarDataBr(mes.pagoEm)}
                      </div>
                    ) : null}
                  </td>
                  <td className={`${CELULA} text-right whitespace-nowrap`}>
                    <Link
                      href={`/das/${mes.competencia}`}
                      className={`text-label ${textLinkClassName}`}
                      aria-label={`${mes.valorCentavos === null ? "Informar" : "Editar"} a guia de ${nomeDoMes(mes.mes)}`}
                    >
                      {mes.valorCentavos === null ? "Informar" : "Editar"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {notasDeRodape}
      </Card>
    </>
  );
}

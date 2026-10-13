// Página /das: os meses do DAS do ano, com receita, vencimento, valor e situação de cada guia.
// Equivale à rota GET /das (index) de um GuiaDasController com uma view Blade.
// O ano vem da URL (?ano=2026). Cada mês leva a /das/[competencia], onde se informa o valor
// e o pagamento.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { DasStrip, resumoEmTexto } from "@/components/das/das-strip";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { textLinkClassName } from "@/components/ui/text-link";
import { dasDoAno } from "@/lib/das";
import { anoDe, formatarDataBr, hojeIso, nomeDoMes } from "@/lib/datas";
import { formatarReais, formatarReaisInteiros } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { diasEntre, resumoDoDas, type MesDoDas, type SituacaoDaGuia } from "@/lib/regras/das";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";

export const metadata: Metadata = { title: "DAS" };

const FILTRO =
  "flex min-h-control-sm items-center rounded-pill px-4 font-medium text-ink-muted aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink";
const CELULA = "border-b border-divider px-3 py-3.5 align-top";
const CABECALHO =
  "border-b border-border px-3 py-2.5 text-left text-caption font-semibold text-ink-muted";
// Quantos anos o seletor mostra, contando o atual.
const ANOS_NO_SELETOR = 6;

const ROTULO: Record<SituacaoDaGuia, string> = {
  paga: "Paga",
  pendente: "Pendente",
  vencida: "Vencida",
  a_vencer: "A vencer",
  sem_valor: "Sem valor informado",
};

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

/** "20/10 · em 7 dias", "20/10 · hoje" ou "21/09 · há 22 dias". */
function prazo(vencimento: string, hoje: string): string {
  const dias = diasEntre(hoje, vencimento);
  const data = formatarDataBr(vencimento).slice(0, 5);
  if (dias === 0) return `${data} · hoje`;
  if (dias > 0) return `${data} · em ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return `${data} · há ${-dias} ${dias === -1 ? "dia" : "dias"}`;
}

function Situacao({ mes }: { mes: MesDoDas }) {
  // Paga é a etiqueta cheia; o resto usa o contorno tracejado. Vencida leva o texto por extenso.
  return mes.situacao === "paga" ? (
    <Badge>{ROTULO.paga}</Badge>
  ) : (
    <Badge variant="pendente" className={mes.situacao === "vencida" ? "text-ink" : undefined}>
      {ROTULO[mes.situacao]}
    </Badge>
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

  return (
    <>
      {resumo.vencidas.length > 0 ? (
        <Alert variant="warning">
          <AlertTitle>
            {resumo.vencidas.length === 1
              ? `A guia de ${nomeDoMes(resumo.vencidas[0].mes)} está vencida`
              : `${resumo.vencidas.length} guias vencidas em ${ano}`}
          </AlertTitle>
          Se já pagou, abra o mês e informe a data do pagamento. Guia paga depois do vencimento tem
          multa e juros: gere uma nova no Portal do Simples Nacional.
        </Alert>
      ) : null}

      <Card hero aria-label={`Resumo do DAS de ${ano}`}>
        {anos.length > 1 ? (
          <nav aria-label="Ano" className="flex flex-wrap gap-2">
            {anos.map((opcao) => (
              <Link
                key={opcao}
                href={opcao === anoAtual ? "/das" : `/das?ano=${opcao}`}
                aria-current={opcao === ano ? "page" : undefined}
                className={FILTRO}
              >
                {opcao}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex flex-wrap gap-x-12 gap-y-5">
          <Metric
            label={`Pago em ${ano}`}
            value={formatarReais(resumo.pagoCentavos)}
            hint={`${resumo.pagas} ${resumo.pagas === 1 ? "guia paga" : "guias pagas"}`}
          />
          {resumo.proxima ? (
            <Metric
              label={resumo.proxima.situacao === "vencida" ? "Guia vencida" : "Próximo vencimento"}
              value={prazo(resumo.proxima.vencimento, hoje)}
              hint={`${nomeDoMes(resumo.proxima.mes)}${
                resumo.proxima.valorCentavos !== null
                  ? ` · ${formatarReais(resumo.proxima.valorCentavos)}`
                  : resumo.proxima.sugestaoCentavos !== null
                    ? ` · cerca de ${formatarReais(resumo.proxima.sugestaoCentavos)}`
                    : " · valor não informado"
              }`}
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

      <Card aria-label={`Guias de ${ano}`}>
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
                    {formatarReais(mes.receitaCentavos)}
                  </td>
                  <td className={`${CELULA} whitespace-nowrap tabular-nums`}>
                    {formatarDataBr(mes.vencimento)}
                  </td>
                  <td className={`${CELULA} text-right whitespace-nowrap tabular-nums`}>
                    {mes.valorCentavos !== null ? (
                      <span className="font-semibold">{formatarReais(mes.valorCentavos)}</span>
                    ) : mes.sugestaoCentavos !== null ? (
                      <span className="text-ink-muted">
                        cerca de {formatarReais(mes.sugestaoCentavos)}
                      </span>
                    ) : (
                      <span className="text-ink-muted">Não informado</span>
                    )}
                  </td>
                  <td className={CELULA}>
                    <Situacao mes={mes} />
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

        <div className="flex flex-col gap-1 text-caption text-ink-muted">
          {temMe ? (
            sugerindo ? (
              <div>
                Nos meses de ME, “cerca de” é uma sugestão: {percentual}% da receita do mês, a
                alíquota da 1ª faixa do Anexo III. Ela vale enquanto a receita de 12 meses ficar até{" "}
                {formatarReaisInteiros(tetoDaSugestaoCentavos)}. O valor certo é o da guia.
              </div>
            ) : (
              <div>
                A receita de 12 meses passou de {formatarReaisInteiros(tetoDaSugestaoCentavos)}, e a
                alíquota de {percentual}% deixou de valer. Informe o valor que está na guia.
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
      </Card>
    </>
  );
}

// Página /notas: as NFS-e importadas, uma por linha, com filtro por ano e situação.
// Equivale à rota GET /notas (index) de um NotaFiscalController com uma view Blade.
// O ano e o filtro vêm da URL (?ano=2026&situacao=cancelada). As notas entram pela importação
// de XML; aqui só a situação pode mudar.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { textLinkClassName } from "@/components/ui/text-link";
import { mascararCnpj } from "@/lib/cnpj";
import { anoDe, formatarDataBr, hojeIso } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { todasAsNotas } from "@/lib/notas";
import {
  anosComNota,
  filtroDeSituacao,
  listarNumeros,
  numerosFaltando,
  totaisDasNotas,
  type FiltroDeSituacao,
} from "@/lib/regras/notas";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { alterarSituacaoDaNota } from "./actions";

export const metadata: Metadata = { title: "Notas" };

const FILTRO =
  "flex min-h-control-sm items-center rounded-pill px-4 font-medium text-ink-muted aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink";
const CELULA = "border-b border-divider px-3 py-3.5 align-top";
const CABECALHO =
  "border-b border-border px-3 py-2.5 text-left text-caption font-semibold text-ink-muted";
// Acima disso a lista de números que faltam vira só a quantidade.
const FALTANDO_EXIBIDOS = 20;

export default function NotasPage({ searchParams }: PageProps<"/notas">) {
  return (
    <AppShell ativa="notas">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page-title">Notas</h1>
          <div className="text-ink-muted">As NFS-e emitidas pela empresa, importadas dos XML.</div>
        </div>
        <Button asChild>
          <Link href="/importar">Importar notas</Link>
        </Button>
      </div>
      {/* A lista depende do usuário logado e da URL, lidos na requisição. */}
      <Suspense fallback={<div className="text-ink-muted">Carregando as notas…</div>}>
        <Notas searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}

/** CPF (11 dígitos) ou CNPJ (14), com máscara. */
function mascararDocumento(documento: string): string {
  if (documento.length !== 11) return mascararCnpj(documento);
  return documento.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function endereco(ano: number, filtro: FiltroDeSituacao): string {
  return `/notas?ano=${ano}${filtro ? `&situacao=${filtro}` : ""}`;
}

async function Notas({ searchParams }: Pick<PageProps<"/notas">, "searchParams">) {
  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  const notas = await todasAsNotas(empresa.id);
  if (notas.length === 0) {
    return (
      <Alert variant="info">
        <AlertTitle>Nenhuma nota importada</AlertTitle>
        Baixe os XML das NFS-e no Emissor Nacional, em “NFS-e emitidas”, e{" "}
        <Link href="/importar" className="font-semibold underline">
          importe os arquivos
        </Link>
        .
      </Alert>
    );
  }

  const parametros = await searchParams;
  const anos = anosComNota(notas);
  // Sem ano válido na URL, abre no ano atual se houver nota nele; senão, no mais recente.
  const pedido = Number(parametros.ano);
  const anoAtual = anoDe(hojeIso());
  const ano = anos.includes(pedido)
    ? pedido
    : anos.includes(anoAtual)
      ? anoAtual
      : anos[anos.length - 1];
  const filtro = filtroDeSituacao(parametros.situacao);

  const doAno = notas.filter((nota) => anoDe(nota.dataCompetencia) === ano);
  const exibidas = filtro ? doAno.filter((nota) => nota.situacao === filtro) : doAno;
  const resumo = totaisDasNotas(doAno);
  const faltando = numerosFaltando(notas.map((nota) => nota.numero));

  const filtros: { rotulo: string; valor: FiltroDeSituacao }[] = [
    { rotulo: "Todas", valor: null },
    { rotulo: "Emitidas", valor: "emitida" },
    { rotulo: "Canceladas", valor: "cancelada" },
  ];

  return (
    <>
      {faltando.length > 0 ? (
        <Alert variant="warning">
          <AlertTitle>
            {faltando.length === 1
              ? "Falta 1 nota na sequência"
              : `Faltam ${faltando.length} notas na sequência`}
          </AlertTitle>
          {faltando.length <= FALTANDO_EXIBIDOS
            ? `${faltando.length === 1 ? "A nota de número" : "As notas de número"} ${listarNumeros(faltando)} não ${faltando.length === 1 ? "foi importada" : "foram importadas"}. `
            : `Há números sem nota entre a ${faltando[0]} e a ${faltando[faltando.length - 1]}. `}
          Se foram canceladas, não há o que fazer. Se foram emitidas, baixe os XML no Emissor
          Nacional e importe, para o faturamento ficar completo.
        </Alert>
      ) : null}

      <Card hero aria-label={`Resumo de ${ano}`}>
        <nav aria-label="Ano" className="flex flex-wrap gap-2">
          {anos.map((opcao) => (
            <Link
              key={opcao}
              href={endereco(opcao, filtro)}
              aria-current={opcao === ano ? "page" : undefined}
              className={FILTRO}
            >
              {opcao}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-x-12 gap-y-5">
          <Metric
            label={`Emitido em ${ano}`}
            value={formatarReais(resumo.valorEmitidoCentavos)}
            hint="Pela data de competência, como no painel."
          />
          <Metric label="Notas emitidas" value={String(resumo.emitidas)} />
          <Metric
            label="Canceladas"
            value={String(resumo.canceladas)}
            hint="Não entram no faturamento."
          />
        </div>
      </Card>

      <Card aria-label="Lista de notas">
        <nav aria-label="Situação" className="flex flex-wrap gap-2">
          {filtros.map((item) => (
            <Link
              key={item.rotulo}
              href={endereco(ano, item.valor)}
              aria-current={item.valor === filtro ? "page" : undefined}
              className={FILTRO}
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        {exibidas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th scope="col" className={CABECALHO}>
                    Nº
                  </th>
                  <th scope="col" className={CABECALHO}>
                    Competência
                  </th>
                  <th scope="col" className={CABECALHO}>
                    Emissão
                  </th>
                  <th scope="col" className={CABECALHO}>
                    Tomador
                  </th>
                  <th scope="col" className={CABECALHO}>
                    Situação
                  </th>
                  <th scope="col" className={`${CABECALHO} text-right`}>
                    Valor
                  </th>
                  <th scope="col" className={`${CABECALHO} text-right`}>
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {exibidas.map((nota) => {
                  const cancelada = nota.situacao === "cancelada";
                  return (
                    <tr key={nota.id}>
                      <td className={`${CELULA} font-semibold tabular-nums`}>{nota.numero}</td>
                      <td className={`${CELULA} whitespace-nowrap tabular-nums`}>
                        {formatarDataBr(nota.dataCompetencia)}
                      </td>
                      <td className={`${CELULA} whitespace-nowrap tabular-nums text-ink-muted`}>
                        {formatarDataBr(nota.dataEmissao)}
                      </td>
                      <td className={`${CELULA} min-w-0`}>
                        <div className="font-semibold break-words">
                          {nota.tomadorNome ?? "Tomador não identificado"}
                        </div>
                        {nota.tomadorDoc ? (
                          <div className="text-caption text-ink-muted tabular-nums">
                            {mascararDocumento(nota.tomadorDoc)}
                          </div>
                        ) : null}
                      </td>
                      <td className={CELULA}>
                        {cancelada ? (
                          <Badge variant="pendente">Cancelada</Badge>
                        ) : (
                          <Badge>Emitida</Badge>
                        )}
                      </td>
                      {/* O valor da cancelada aparece riscado, além da etiqueta: não é só cor. */}
                      <td
                        className={`${CELULA} text-right font-semibold whitespace-nowrap tabular-nums ${cancelada ? "text-ink-muted line-through" : ""}`}
                      >
                        {formatarReais(nota.valorCentavos)}
                      </td>
                      <td className={`${CELULA} text-right whitespace-nowrap`}>
                        {/* Formulário que chama a Server Action, como um PATCH /notas/{id}. */}
                        <form
                          action={alterarSituacaoDaNota.bind(
                            null,
                            nota.id,
                            cancelada ? "emitida" : "cancelada",
                          )}
                        >
                          <button
                            type="submit"
                            className={`cursor-pointer text-label ${textLinkClassName}`}
                            aria-label={`${cancelada ? "Desfazer o cancelamento da" : "Marcar como cancelada a"} nota ${nota.numero}`}
                          >
                            {cancelada ? "Desfazer cancelamento" : "Marcar como cancelada"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-ink-muted">Nenhuma nota com este filtro em {ano}.</div>
        )}
      </Card>
    </>
  );
}

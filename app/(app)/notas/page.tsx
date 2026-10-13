// Página /notas: as NFS-e importadas, uma por linha, com filtros e rolagem na lista.
// Equivale à rota GET /notas (index) de um NotaFiscalController com uma view Blade.
// Todos os filtros vêm da URL (?ano=2026&situacao=cancelada&tomador=...), como numa busca
// feita com <form method="GET">. As notas entram pela importação de XML; aqui só a situação
// pode mudar.
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Metric } from "@/components/ui/metric";
import { SelectField } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { textLinkClassName } from "@/components/ui/text-link";
import { mascararCnpj } from "@/lib/cnpj";
import { anoDe, dataIsoValida, formatarDataBr, hojeIso } from "@/lib/datas";
import { centavosDeTexto, formatarReais } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { todasAsNotas } from "@/lib/notas";
import {
  anosComNota,
  filtrarNotas,
  filtroDeSituacao,
  listarNumeros,
  numerosFaltando,
  tomadores,
  totaisDasNotas,
  type FiltroDeSituacao,
  type FiltrosDeNotas,
} from "@/lib/regras/notas";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { alterarSituacaoDaNota } from "./actions";

export const metadata: Metadata = { title: "Notas" };

const FILTRO =
  "flex min-h-control-sm items-center rounded-pill px-4 font-medium text-ink-muted aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink";
const CELULA = "border-b border-divider px-3 py-3.5 align-top";
// sticky: o cabeçalho fica parado no topo enquanto a lista rola por baixo dele.
const CABECALHO =
  "sticky top-0 z-10 border-b border-border bg-surface px-3 py-2.5 text-left text-caption font-semibold text-ink-muted";
// Acima disso a lista de números que faltam vira só a quantidade.
const FALTANDO_EXIBIDOS = 20;
// Valor do filtro de ano que mostra todos os anos juntos.
const TODOS_OS_ANOS = "todos";

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

/** Um parâmetro da URL como texto; lista ou ausência viram texto vazio. */
function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/** O que o usuário digitou nos campos de filtro, como está na URL. */
type Campos = {
  tomador: string;
  competenciaDe: string;
  competenciaAte: string;
  emissaoDe: string;
  emissaoAte: string;
  valorDe: string;
  valorAte: string;
};
const CAMPOS: (keyof Campos)[] = [
  "tomador", "competenciaDe", "competenciaAte", "emissaoDe", "emissaoAte", "valorDe", "valorAte",
];

/** Monta o endereço da lista mantendo os filtros preenchidos. */
function endereco(ano: number | null, situacao: FiltroDeSituacao, campos: Campos): string {
  const parametros = new URLSearchParams({ ano: ano === null ? TODOS_OS_ANOS : String(ano) });
  if (situacao) parametros.set("situacao", situacao);
  for (const campo of CAMPOS) {
    if (campos[campo] !== "") parametros.set(campo, campos[campo]);
  }
  return `/notas?${parametros}`;
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
  const ano =
    parametros.ano === TODOS_OS_ANOS
      ? null
      : anos.includes(pedido)
        ? pedido
        : anos.includes(anoAtual)
          ? anoAtual
          : anos[anos.length - 1];
  const situacao = filtroDeSituacao(parametros.situacao);

  const campos = Object.fromEntries(CAMPOS.map((campo) => [campo, texto(parametros[campo])])) as Campos;
  const listaDeTomadores = tomadores(notas);
  // Valor que não dá para ler (data impossível, texto no lugar do valor) é ignorado.
  const data = (valor: string) => (dataIsoValida(valor) ? valor : null);
  const valor = (digitado: string) => {
    const centavos = centavosDeTexto(digitado);
    return centavos !== null && centavos >= 0 ? centavos : null;
  };
  const filtros: FiltrosDeNotas = {
    ano,
    situacao,
    tomador: listaDeTomadores.some((item) => item.chave === campos.tomador) ? campos.tomador : null,
    competenciaDe: data(campos.competenciaDe),
    competenciaAte: data(campos.competenciaAte),
    emissaoDe: data(campos.emissaoDe),
    emissaoAte: data(campos.emissaoAte),
    valorMinimoCentavos: valor(campos.valorDe),
    valorMaximoCentavos: valor(campos.valorAte),
  };
  const temFiltro = CAMPOS.some((campo) => campos[campo] !== "");

  // O resumo do topo é do ano inteiro; a lista obedece a todos os filtros.
  const doAno = ano === null ? notas : notas.filter((nota) => anoDe(nota.dataCompetencia) === ano);
  const resumo = totaisDasNotas(doAno);
  const exibidas = filtrarNotas(notas, filtros);
  const totalExibido = totaisDasNotas(exibidas);
  const faltando = numerosFaltando(notas.map((nota) => nota.numero));
  const periodo = ano === null ? "todos os anos" : String(ano);

  const situacoes: { rotulo: string; valor: FiltroDeSituacao }[] = [
    { rotulo: "Todas", valor: null },
    { rotulo: "Emitidas", valor: "emitida" },
    { rotulo: "Canceladas", valor: "cancelada" },
  ];

  return (
    <>
      {faltando.length > 0 ? (
        // Informação, não alerta: número que falta costuma ser nota cancelada, que não se importa.
        <Alert variant="info">
          <AlertTitle>
            {faltando.length === 1
              ? "Falta 1 nota na sequência"
              : `Faltam ${faltando.length} notas na sequência`}
          </AlertTitle>
          {faltando.length <= FALTANDO_EXIBIDOS
            ? `${faltando.length === 1 ? "A nota de número" : "As notas de número"} ${listarNumeros(faltando)} não ${faltando.length === 1 ? "foi importada" : "foram importadas"}. `
            : `Há números sem nota entre a ${faltando[0]} e a ${faltando[faltando.length - 1]}. `}
          Nota cancelada não precisa ser importada. Se alguma delas foi emitida e está válida,
          baixe o XML no Emissor Nacional e importe, para o faturamento ficar completo.
        </Alert>
      ) : null}

      <Card hero aria-label={`Resumo de ${periodo}`}>
        <nav aria-label="Ano" className="flex flex-wrap gap-2">
          {anos.map((opcao) => (
            <Link
              key={opcao}
              href={endereco(opcao, situacao, campos)}
              aria-current={opcao === ano ? "page" : undefined}
              className={FILTRO}
            >
              {opcao}
            </Link>
          ))}
          {anos.length > 1 ? (
            <Link
              href={endereco(null, situacao, campos)}
              aria-current={ano === null ? "page" : undefined}
              className={FILTRO}
            >
              Todos
            </Link>
          ) : null}
        </nav>
        <div className="flex flex-wrap gap-x-12 gap-y-5">
          <Metric
            label={ano === null ? "Emitido em todos os anos" : `Emitido em ${ano}`}
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
          {situacoes.map((item) => (
            <Link
              key={item.rotulo}
              href={endereco(ano, item.valor, campos)}
              aria-current={item.valor === situacao ? "page" : undefined}
              className={FILTRO}
            >
              {item.rotulo}
            </Link>
          ))}
        </nav>

        {/* <Form> do Next: um <form method="GET"> que põe os campos na URL sem recarregar a
            página. Os campos escondidos mantêm o ano e a situação já escolhidos. */}
        <Form
          // A key recria os campos quando os filtros da URL mudam (ao limpar, por exemplo).
          key={JSON.stringify(campos)}
          action="/notas"
          className="flex flex-col gap-4 border-t border-divider pt-5"
        >
          <input type="hidden" name="ano" value={ano === null ? TODOS_OS_ANOS : ano} />
          {situacao ? <input type="hidden" name="situacao" value={situacao} /> : null}
          {/* Grade: os campos dividem a largura por igual e quebram de linha juntos. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-[18px] gap-y-4">
            <div className="min-w-0">
              <SelectField label="Tomador" name="tomador" defaultValue={filtros.tomador ?? ""}>
                <option value="">Todos</option>
                {listaDeTomadores.map((item) => (
                  <option key={item.chave} value={item.chave}>
                    {item.nome}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="min-w-0">
              <TextField
                label="Competência de"
                type="date"
                name="competenciaDe"
                defaultValue={filtros.competenciaDe ?? ""}
              />
            </div>
            <div className="min-w-0">
              <TextField
                label="Competência até"
                type="date"
                name="competenciaAte"
                defaultValue={filtros.competenciaAte ?? ""}
              />
            </div>
            <div className="min-w-0">
              <TextField
                label="Emissão de"
                type="date"
                name="emissaoDe"
                defaultValue={filtros.emissaoDe ?? ""}
              />
            </div>
            <div className="min-w-0">
              <TextField
                label="Emissão até"
                type="date"
                name="emissaoAte"
                defaultValue={filtros.emissaoAte ?? ""}
              />
            </div>
            <div className="min-w-0">
              <TextField
                label="Valor de (R$)"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                autoComplete="off"
                name="valorDe"
                defaultValue={campos.valorDe}
              />
            </div>
            <div className="min-w-0">
              <TextField
                label="Valor até (R$)"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                autoComplete="off"
                name="valorAte"
                defaultValue={campos.valorAte}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
            {temFiltro ? (
              <Link
                href={endereco(ano, situacao, Object.fromEntries(CAMPOS.map((campo) => [campo, ""])) as Campos)}
                className={`text-label ${textLinkClassName}`}
              >
                Limpar filtros
              </Link>
            ) : null}
            <div className="text-ink-muted" aria-live="polite">
              {exibidas.length} {exibidas.length === 1 ? "nota" : "notas"} ·{" "}
              {formatarReais(totalExibido.valorEmitidoCentavos)} emitidos
            </div>
          </div>
        </Form>

        {exibidas.length > 0 ? (
          // A lista rola dentro desta caixa, na vertical e na horizontal; o cabeçalho fica fixo.
          // tabIndex deixa rolar pelo teclado.
          <div
            tabIndex={0}
            role="region"
            aria-label="Notas, lista rolável"
            className="relative max-h-[560px] overflow-auto"
          >
            <table className="w-full min-w-[760px] border-separate border-spacing-0">
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
          <div className="text-ink-muted">Nenhuma nota com estes filtros em {periodo}.</div>
        )}
      </Card>
    </>
  );
}

"use client";

// Área de importação: XML de NFS-e e extratos em OFX ou CSV, arrastando ou escolhendo vários.
// Equivale a um formulário de upload em Blade + JavaScript, com uma diferença importante:
// os arquivos são lidos AQUI, no navegador. Ao servidor vão só os dados extraídos
// (notas e lançamentos); o arquivo original nunca sai do computador.
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CheckIcon, ErrorIcon } from "@/components/ui/icons";
import {
  abrirCsv,
  lerCsv,
  mapeamentoCabe,
  type MapeamentoCsv,
  type TabelaCsv,
} from "@/lib/importacao/csv";
import { lerNfse } from "@/lib/importacao/nfse";
import { lerOfx, type ExtratoLido } from "@/lib/importacao/ofx";
import { decodificarTexto, sha256 } from "@/lib/importacao/texto";
import { cn } from "@/lib/utils";
import {
  importarExtrato,
  importarNfse,
  mapeamentoCsvSalvo,
  salvarMapeamentoCsv,
} from "./actions";
import { MapeamentoCsvCard } from "./mapeamento-csv";

type Resumo = {
  tipo: string;
  lidos: number;
  novos: number;
  duplicados: number;
  erros: number;
  mensagens: string[];
};
type Linha = Resumo & { id: number; nome: string; estado: "lendo" | "pronto" };

/** CSV esperando o usuário dizer o que é cada coluna. */
type MapeamentoPendente = {
  nome: string;
  tabela: TabelaCsv;
  responder: (mapeamento: MapeamentoCsv | null) => void;
};
type PedirMapeamento = (nome: string, tabela: TabelaCsv) => Promise<MapeamentoCsv | null>;

const TAMANHO_MAXIMO_NOTA = 2 * 1024 * 1024;
const TAMANHO_MAXIMO_EXTRATO = 5 * 1024 * 1024;
// Quantos erros de leitura aparecem por arquivo; o resto vira "e mais N".
const ERROS_EXIBIDOS = 5;

function plural(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function falha(tipo: string, mensagem: string): Resumo {
  return { tipo, lidos: 0, novos: 0, duplicados: 0, erros: 1, mensagens: [mensagem] };
}

function resumirErros(erros: string[]): string[] {
  if (erros.length <= ERROS_EXIBIDOS) return erros;
  return [...erros.slice(0, ERROS_EXIBIDOS), `E mais ${erros.length - ERROS_EXIBIDOS} linhas com problema.`];
}

async function processarNota(arquivo: File): Promise<Resumo> {
  if (arquivo.size > TAMANHO_MAXIMO_NOTA) {
    return falha("NFS-e", "Arquivo maior que 2 MB. O XML de uma NFS-e é bem menor que isso.");
  }

  const conteudo = await arquivo.arrayBuffer();
  const leitura = lerNfse(new TextDecoder("utf-8").decode(conteudo));
  if (leitura.tipo === "erro") return falha("NFS-e", leitura.mensagem);

  const resultado = await importarNfse({
    nome: arquivo.name,
    hash: await sha256(conteudo),
    notas: leitura.tipo === "nota" ? [leitura.nota] : [],
    cancelamentos: leitura.tipo === "cancelamento" ? [leitura.chave] : [],
  });
  if (!resultado.ok) return falha("NFS-e", resultado.erro);

  return {
    tipo: leitura.tipo === "cancelamento" ? "Cancelamento de NFS-e" : "NFS-e",
    lidos: 1,
    novos: resultado.novos + resultado.cancelados,
    duplicados: resultado.duplicados,
    erros: resultado.erros,
    mensagens: resultado.mensagens,
  };
}

/** Lê o CSV com o mapeamento guardado; na primeira vez de um formato, pergunta ao usuário. */
async function lerCsvComMapeamento(
  nome: string,
  tabela: TabelaCsv,
  pedirMapeamento: PedirMapeamento,
): Promise<ExtratoLido> {
  const salvo = await mapeamentoCsvSalvo(tabela.assinatura);
  if (salvo && mapeamentoCabe(salvo, tabela.colunas.length)) {
    const leitura = await lerCsv(tabela, salvo);
    // Se o mapeamento guardado não achou nada, vale perguntar de novo.
    if (leitura.tipo === "extrato") return leitura;
  }

  const escolhido = await pedirMapeamento(nome, tabela);
  if (!escolhido) return { tipo: "erro", mensagem: "Arquivo pulado: as colunas não foram mapeadas." };

  const leitura = await lerCsv(tabela, escolhido);
  // Só guarda o mapeamento que conseguiu ler alguma coisa.
  if (leitura.tipo === "extrato") {
    await salvarMapeamentoCsv({ assinatura: tabela.assinatura, ...escolhido });
  }
  return leitura;
}

async function processarExtrato(
  arquivo: File,
  tipo: "OFX" | "CSV",
  pedirMapeamento: PedirMapeamento,
): Promise<Resumo> {
  const rotulo = `Extrato ${tipo}`;
  if (arquivo.size > TAMANHO_MAXIMO_EXTRATO) {
    return falha(rotulo, "Arquivo maior que 5 MB. Exporte um período menor e tente de novo.");
  }

  const conteudo = await arquivo.arrayBuffer();
  const texto = decodificarTexto(conteudo);

  let leitura: ExtratoLido;
  if (tipo === "OFX") {
    leitura = lerOfx(texto);
  } else {
    const tabela = abrirCsv(texto);
    if ("erro" in tabela) return falha(rotulo, tabela.erro);
    leitura = await lerCsvComMapeamento(arquivo.name, tabela, pedirMapeamento);
  }
  if (leitura.tipo === "erro") return falha(rotulo, leitura.mensagem);

  const resultado = await importarExtrato({
    nome: arquivo.name,
    tipo,
    hash: await sha256(conteudo),
    lancamentos: leitura.lancamentos,
    erros: leitura.erros.length,
  });
  if (!resultado.ok) return falha(rotulo, resultado.erro);

  return {
    tipo: rotulo,
    lidos: leitura.lancamentos.length + leitura.erros.length,
    novos: resultado.novos,
    duplicados: resultado.duplicados,
    erros: leitura.erros.length,
    mensagens: resumirErros(leitura.erros),
  };
}

// Lê um arquivo e devolve o resumo dele. Um arquivo com problema não interrompe os outros.
async function processar(arquivo: File, pedirMapeamento: PedirMapeamento): Promise<Resumo> {
  const extensao = arquivo.name.split(".").pop()?.toLowerCase();
  if (extensao === "xml") return processarNota(arquivo);
  if (extensao === "ofx") return processarExtrato(arquivo, "OFX", pedirMapeamento);
  if (extensao === "csv") return processarExtrato(arquivo, "CSV", pedirMapeamento);
  return falha("Desconhecido", "Tipo de arquivo não aceito. Envie XML de NFS-e, OFX ou CSV.");
}

export function ImportarForm() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const proximoId = useRef(0);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [importando, setImportando] = useState(false);
  const [sobre, setSobre] = useState(false);
  const [pendente, setPendente] = useState<MapeamentoPendente | null>(null);

  // Pausa a importação até o usuário mapear as colunas (ou pular o arquivo).
  const pedirMapeamento: PedirMapeamento = (nome, tabela) =>
    new Promise((resolver) => {
      setPendente({
        nome,
        tabela,
        responder: (mapeamento) => {
          setPendente(null);
          resolver(mapeamento);
        },
      });
    });

  async function importar(arquivos: File[]) {
    if (arquivos.length === 0 || importando) return;
    setImportando(true);

    const novas: Linha[] = arquivos.map((arquivo) => ({
      id: proximoId.current++,
      nome: arquivo.name,
      estado: "lendo",
      tipo: "",
      lidos: 0,
      novos: 0,
      duplicados: 0,
      erros: 0,
      mensagens: [],
    }));
    setLinhas((atuais) => [...novas, ...atuais]);

    // Um por vez, para o resumo aparecer na ordem e o servidor não receber uma rajada.
    for (const [indice, arquivo] of arquivos.entries()) {
      let resumo: Resumo;
      try {
        resumo = await processar(arquivo, pedirMapeamento);
      } catch {
        resumo = falha("Arquivo", "Não foi possível ler o arquivo. Tente de novo.");
      }
      const id = novas[indice].id;
      setLinhas((atuais) =>
        atuais.map((linha) => (linha.id === id ? { ...linha, ...resumo, estado: "pronto" } : linha)),
      );
    }

    setImportando(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const prontas = linhas.filter((linha) => linha.estado === "pronto");
  const totalNovos = prontas.reduce((soma, linha) => soma + linha.novos, 0);
  const temExtrato = prontas.some((linha) => linha.tipo.startsWith("Extrato") && linha.novos > 0);
  const temNota = prontas.some((linha) => !linha.tipo.startsWith("Extrato") && linha.novos > 0);

  return (
    <>
      <div
        onDragOver={(evento) => {
          evento.preventDefault();
          setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(evento) => {
          evento.preventDefault();
          setSobre(false);
          void importar([...evento.dataTransfer.files]);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-dashed px-6 py-12 text-center",
          sobre && "bg-surface-tint",
        )}
      >
        <div className="text-section-title">Arraste os arquivos para cá</div>
        <div className="text-ink-muted">
          XML de NFS-e e extratos em OFX ou CSV, vários de uma vez. Os arquivos são lidos no seu
          navegador e não são enviados ao servidor.
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".xml,.ofx,.csv,text/xml,application/xml,text/csv"
          multiple
          className="sr-only"
          onChange={(evento) => void importar([...(evento.target.files ?? [])])}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={importando}
          onClick={() => inputRef.current?.click()}
        >
          {importando ? "Importando…" : "Escolher arquivos"}
        </Button>
      </div>

      {pendente ? (
        <MapeamentoCsvCard
          // A key recria o formulário a cada arquivo, com o palpite do arquivo certo.
          key={`${pendente.nome}:${pendente.tabela.assinatura}`}
          nome={pendente.nome}
          tabela={pendente.tabela}
          onConfirmar={(mapeamento) => pendente.responder(mapeamento)}
          onCancelar={() => pendente.responder(null)}
        />
      ) : null}

      {!importando && totalNovos > 0 ? (
        <Alert variant="success">
          <AlertTitle>Importação concluída</AlertTitle>
          {plural(totalNovos, "registro novo", "registros novos")} nesta sessão.{" "}
          {temNota ? (
            <Link href="/painel" className="font-semibold underline">
              Ver o painel
            </Link>
          ) : null}
          {temNota && temExtrato ? " · " : null}
          {temExtrato ? (
            <Link href="/lancamentos" className="font-semibold underline">
              Ver os lançamentos
            </Link>
          ) : null}
        </Alert>
      ) : null}

      {linhas.length > 0 ? (
        <Card aria-label="Arquivos importados">
          <CardTitle>Arquivos</CardTitle>
          <ul className="flex flex-col" aria-live="polite">
            {linhas.map((linha) => (
              <li
                key={linha.id}
                className="flex flex-col gap-1 border-b border-divider py-3.5 last:border-b-0"
              >
                <div className="font-semibold break-all">{linha.nome}</div>
                {linha.estado === "lendo" ? (
                  <div className="text-caption text-ink-muted">Lendo…</div>
                ) : (
                  <>
                    <div className="text-caption text-ink-muted">
                      {linha.tipo} · {plural(linha.lidos, "lido", "lidos")} ·{" "}
                      {plural(linha.novos, "novo", "novos")} ·{" "}
                      {plural(linha.duplicados, "duplicado ignorado", "duplicados ignorados")} ·{" "}
                      {plural(linha.erros, "erro", "erros")}
                    </div>
                    {linha.mensagens.map((mensagem, indice) => (
                      <div
                        key={indice}
                        className="flex items-center gap-1.5 text-caption font-semibold text-error-ink"
                      >
                        <ErrorIcon className="flex-none" />
                        {mensagem}
                      </div>
                    ))}
                    {linha.erros === 0 ? (
                      <div className="flex items-center gap-1.5 text-caption font-semibold">
                        <CheckIcon className="flex-none text-accent-strong" />
                        {linha.novos > 0 ? "Importado." : "Já estava importado. Nada mudou."}
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

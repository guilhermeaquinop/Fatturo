"use client";

// Área de importação de XML de NFS-e: arrastar e soltar ou escolher vários arquivos.
// Equivale a um formulário de upload em Blade + JavaScript, com uma diferença importante:
// os arquivos são lidos AQUI, no navegador. Ao servidor vão só os dados extraídos
// (número, datas, tomador, valor); o arquivo original nunca sai do computador.
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CheckIcon, ErrorIcon } from "@/components/ui/icons";
import { lerNfse } from "@/lib/importacao/nfse";
import { cn } from "@/lib/utils";
import { importarNfse } from "./actions";

type Linha = {
  id: number;
  nome: string;
  estado: "lendo" | "pronto";
  tipo: string;
  lidos: number;
  novos: number;
  duplicados: number;
  erros: number;
  mensagens: string[];
};

const TAMANHO_MAXIMO = 2 * 1024 * 1024;

async function sha256(conteudo: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", conteudo);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function plural(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

// Lê um arquivo e devolve o resumo dele. Um arquivo com problema não interrompe os outros.
async function processar(arquivo: File): Promise<Omit<Linha, "id" | "nome" | "estado">> {
  const erro = (tipo: string, mensagem: string) => ({
    tipo,
    lidos: 0,
    novos: 0,
    duplicados: 0,
    erros: 1,
    mensagens: [mensagem],
  });

  const extensao = arquivo.name.split(".").pop()?.toLowerCase();
  if (extensao === "ofx" || extensao === "csv") {
    return erro(extensao.toUpperCase(), "Extratos em OFX e CSV ainda não são aceitos.");
  }
  if (extensao !== "xml") {
    return erro("Desconhecido", "Tipo de arquivo não aceito. Envie o XML da NFS-e.");
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return erro("NFS-e", "Arquivo maior que 2 MB. O XML de uma NFS-e é bem menor que isso.");
  }

  const conteudo = await arquivo.arrayBuffer();
  const leitura = lerNfse(new TextDecoder("utf-8").decode(conteudo));
  if (leitura.tipo === "erro") return erro("NFS-e", leitura.mensagem);

  const resultado = await importarNfse({
    nome: arquivo.name,
    hash: await sha256(conteudo),
    notas: leitura.tipo === "nota" ? [leitura.nota] : [],
    cancelamentos: leitura.tipo === "cancelamento" ? [leitura.chave] : [],
  });
  if (!resultado.ok) return erro("NFS-e", resultado.erro);

  return {
    tipo: leitura.tipo === "cancelamento" ? "Cancelamento de NFS-e" : "NFS-e",
    lidos: 1,
    novos: resultado.novos + resultado.cancelados,
    duplicados: resultado.duplicados,
    erros: resultado.erros,
    mensagens: resultado.mensagens,
  };
}

export function ImportarForm() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const proximoId = useRef(0);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [importando, setImportando] = useState(false);
  const [sobre, setSobre] = useState(false);

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
      let resumo: Awaited<ReturnType<typeof processar>>;
      try {
        resumo = await processar(arquivo);
      } catch {
        resumo = {
          tipo: "NFS-e",
          lidos: 0,
          novos: 0,
          duplicados: 0,
          erros: 1,
          mensagens: ["Não foi possível ler o arquivo. Tente de novo."],
        };
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
        <div className="text-section-title">Arraste os XML das notas para cá</div>
        <div className="text-ink-muted">
          Pode soltar vários de uma vez. Os arquivos são lidos no seu navegador e não são
          enviados ao servidor.
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".xml,text/xml,application/xml"
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

      {!importando && totalNovos > 0 ? (
        <Alert variant="success">
          <AlertTitle>Importação concluída</AlertTitle>
          {plural(totalNovos, "registro novo", "registros novos")} nesta sessão.{" "}
          <Link href="/painel" className="font-semibold underline">
            Ver o painel
          </Link>
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
                    {linha.mensagens.map((mensagem) => (
                      <div
                        key={mensagem}
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

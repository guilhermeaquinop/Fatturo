"use client";

// Tabela de lançamentos com seleção e classificação em lote.
// Equivale a uma tabela Blade com checkboxes e um form de ação em massa (ou a um componente
// Livewire). É componente de cliente porque guarda quais linhas estão marcadas.
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatarDataBr } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import type { Lancamento } from "@/lib/lancamentos";
import {
  CATEGORIAS,
  ROTULO_CATEGORIA,
  ROTULO_CATEGORIA_CURTO,
  SEM_CLASSIFICACAO,
  type Categoria,
} from "@/lib/validacao/lancamento";
import { classificarEmLote } from "./actions";

const CELULA = "border-b border-divider px-3 py-3.5 align-top";
const CABECALHO = "border-b border-border px-3 py-2.5 text-left text-caption font-semibold text-ink-muted";

export function LancamentosTabela({ lancamentos }: { lancamentos: Lancamento[] }) {
  const seletorId = useId();
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [categoria, setCategoria] = useState<Categoria | "" | "escolher">("escolher");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  // Só contam as marcações de linhas que ainda estão na lista (o filtro pode ter mudado).
  const selecionados = lancamentos.filter((item) => marcados.has(item.id)).map((item) => item.id);
  const todosMarcados = lancamentos.length > 0 && selecionados.length === lancamentos.length;

  function alternar(id: string) {
    setMarcados((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(id)) novos.delete(id);
      else novos.add(id);
      return novos;
    });
  }

  function classificar() {
    if (categoria === "escolher" || selecionados.length === 0) return;
    setErro(null);
    iniciar(async () => {
      const resultado = await classificarEmLote({ ids: selecionados, categoria });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setMarcados(new Set());
      setCategoria("escolher");
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {selecionados.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-tint px-4 py-3">
          <label htmlFor={seletorId} className="font-semibold">
            {selecionados.length === 1
              ? "1 lançamento selecionado"
              : `${selecionados.length} lançamentos selecionados`}
          </label>
          <Select
            id={seletorId}
            value={categoria}
            onChange={(evento) => setCategoria(evento.target.value as typeof categoria)}
            className="h-control-sm w-auto flex-[0_1_260px]"
          >
            <option value="escolher" disabled>
              Classificar como…
            </option>
            {CATEGORIAS.map((opcao) => (
              <option key={opcao} value={opcao}>
                {ROTULO_CATEGORIA[opcao]}
              </option>
            ))}
            <option value="">{SEM_CLASSIFICACAO}</option>
          </Select>
          <Button type="button" disabled={enviando || categoria === "escolher"} onClick={classificar}>
            {enviando ? "Classificando…" : "Classificar"}
          </Button>
        </div>
      ) : null}

      {erro ? <Alert variant="error">{erro}</Alert> : null}

      {/* relative: o texto só para leitor de tela (sr-only) é posicionado dentro desta caixa;
          sem isso ele escaparia da rolagem e alargaria a página no celular. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr>
              <th scope="col" className={`${CABECALHO} w-10`}>
                <Checkbox
                  aria-label="Selecionar todos"
                  checked={todosMarcados}
                  onChange={() =>
                    setMarcados(todosMarcados ? new Set() : new Set(lancamentos.map((item) => item.id)))
                  }
                />
              </th>
              <th scope="col" className={CABECALHO}>
                Data
              </th>
              <th scope="col" className={CABECALHO}>
                Descrição
              </th>
              <th scope="col" className={CABECALHO}>
                Categoria
              </th>
              <th scope="col" className={CABECALHO}>
                Origem
              </th>
              <th scope="col" className={`${CABECALHO} text-right`}>
                Valor
              </th>
              <th scope="col" className={CABECALHO}>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((item) => (
              <tr key={item.id}>
                <td className={CELULA}>
                  <Checkbox
                    aria-label={`Selecionar ${item.descricao}`}
                    checked={marcados.has(item.id)}
                    onChange={() => alternar(item.id)}
                  />
                </td>
                <td className={`${CELULA} whitespace-nowrap tabular-nums`}>
                  {formatarDataBr(item.data)}
                </td>
                <td className={`${CELULA} min-w-0`}>
                  <div className="font-semibold break-words">{item.descricao}</div>
                  {item.contraparteNome ? (
                    <div className="text-caption break-words text-ink-muted">
                      {item.contraparteNome}
                    </div>
                  ) : null}
                </td>
                <td className={CELULA}>
                  {item.categoria ? (
                    <Badge>{ROTULO_CATEGORIA_CURTO[item.categoria]}</Badge>
                  ) : (
                    <Badge variant="pendente">{SEM_CLASSIFICACAO}</Badge>
                  )}
                </td>
                <td className={`${CELULA} text-caption whitespace-nowrap text-ink-muted`}>
                  {item.origem === "arquivo" ? "Extrato" : "Manual"}
                </td>
                {/* O sinal vai escrito: entrada e saída não se distinguem só pela cor. */}
                <td className={`${CELULA} text-right font-semibold whitespace-nowrap tabular-nums`}>
                  {item.sentido === "entrada" ? "+ " : "− "}
                  {formatarReais(item.valorCentavos)}
                </td>
                <td className={`${CELULA} text-right`}>
                  <Link
                    href={`/lancamentos/${item.id}`}
                    className={`text-label ${textLinkClassName}`}
                    aria-label={`Editar ${item.descricao}`}
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

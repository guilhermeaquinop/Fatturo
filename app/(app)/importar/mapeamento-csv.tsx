"use client";

// Passo de mapeamento do CSV: o usuário diz qual coluna é a data, a descrição e o valor.
// Equivale a um formulário Blade intermediário num fluxo de importação.
// Aparece só na primeira vez de cada formato de arquivo; a resposta fica guardada.
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField } from "@/components/ui/select";
import { sugerirMapeamento, type MapeamentoCsv, type TabelaCsv } from "@/lib/importacao/csv";

type MapeamentoCsvCardProps = {
  nome: string;
  tabela: TabelaCsv;
  onConfirmar: (mapeamento: MapeamentoCsv) => void;
  onCancelar: () => void;
};

const LINHAS_DE_AMOSTRA = 3;

// Os selects guardam texto: "" enquanto nada foi escolhido, ou a posição da coluna.
const paraTexto = (coluna: number | null | undefined) => (coluna == null ? "" : String(coluna));
const paraNumero = (texto: string) => (texto === "" ? null : Number(texto));

export function MapeamentoCsvCard({ nome, tabela, onConfirmar, onCancelar }: MapeamentoCsvCardProps) {
  const [palpite] = useState(() => sugerirMapeamento(tabela.colunas));
  const [data, setData] = useState(paraTexto(palpite.colunaData));
  const [descricao, setDescricao] = useState(paraTexto(palpite.colunaDescricao));
  const [emDuasColunas, setEmDuasColunas] = useState(palpite.colunaCredito != null);
  const [valor, setValor] = useState(paraTexto(palpite.colunaValor));
  const [credito, setCredito] = useState(paraTexto(palpite.colunaCredito));
  const [debito, setDebito] = useState(paraTexto(palpite.colunaDebito));
  const [erro, setErro] = useState<string | null>(null);

  const opcoes = (
    <>
      <option value="">Selecione</option>
      {tabela.colunas.map((coluna, indice) => (
        <option key={indice} value={indice}>
          {coluna}
        </option>
      ))}
    </>
  );

  function confirmar() {
    const mapeamento = {
      colunaData: paraNumero(data),
      colunaDescricao: paraNumero(descricao),
      colunaValor: emDuasColunas ? null : paraNumero(valor),
      colunaCredito: emDuasColunas ? paraNumero(credito) : null,
      colunaDebito: emDuasColunas ? paraNumero(debito) : null,
    };
    const faltaValor = emDuasColunas
      ? mapeamento.colunaCredito === null || mapeamento.colunaDebito === null
      : mapeamento.colunaValor === null;
    if (mapeamento.colunaData === null || mapeamento.colunaDescricao === null || faltaValor) {
      setErro("Escolha uma coluna para cada campo.");
      return;
    }
    onConfirmar({ ...mapeamento, colunaData: mapeamento.colunaData, colunaDescricao: mapeamento.colunaDescricao });
  }

  return (
    <Card aria-label="Mapeamento de colunas do CSV">
      <div>
        <CardTitle>Diga o que é cada coluna</CardTitle>
        <div className="text-ink-muted">
          É a primeira vez que um CSV neste formato aparece ({nome}). O Fatturo guarda a sua
          resposta para os próximos extratos do mesmo banco.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-caption">
          <thead>
            <tr>
              {tabela.colunas.map((coluna, indice) => (
                <th
                  key={indice}
                  scope="col"
                  className="border-b border-border px-2.5 py-2 text-left font-semibold whitespace-nowrap"
                >
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.linhas.slice(0, LINHAS_DE_AMOSTRA).map((linha, numero) => (
              <tr key={numero}>
                {tabela.colunas.map((_, indice) => (
                  <td
                    key={indice}
                    className="border-b border-divider px-2.5 py-2 whitespace-nowrap text-ink-muted"
                  >
                    {linha[indice] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-[18px]">
        <div className="flex-[1_1_200px]">
          <SelectField label="Data" value={data} onChange={(evento) => setData(evento.target.value)}>
            {opcoes}
          </SelectField>
        </div>
        <div className="flex-[1_1_200px]">
          <SelectField
            label="Descrição"
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
          >
            {opcoes}
          </SelectField>
        </div>
        <div className="flex-[1_1_200px]">
          <SelectField
            label="Como o valor aparece"
            value={emDuasColunas ? "duas" : "uma"}
            onChange={(evento) => setEmDuasColunas(evento.target.value === "duas")}
          >
            <option value="uma">Numa coluna só (saída com sinal de menos)</option>
            <option value="duas">Em duas colunas: crédito e débito</option>
          </SelectField>
        </div>
        {emDuasColunas ? (
          <>
            <div className="flex-[1_1_200px]">
              <SelectField
                label="Crédito (entradas)"
                value={credito}
                onChange={(evento) => setCredito(evento.target.value)}
              >
                {opcoes}
              </SelectField>
            </div>
            <div className="flex-[1_1_200px]">
              <SelectField
                label="Débito (saídas)"
                value={debito}
                onChange={(evento) => setDebito(evento.target.value)}
              >
                {opcoes}
              </SelectField>
            </div>
          </>
        ) : (
          <div className="flex-[1_1_200px]">
            <SelectField label="Valor" value={valor} onChange={(evento) => setValor(evento.target.value)}>
              {opcoes}
            </SelectField>
          </div>
        )}
      </div>

      {erro ? <Alert variant="error">{erro}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={confirmar}>
          Salvar e importar
        </Button>
        <Button type="button" variant="secondary" onClick={onCancelar}>
          Pular este arquivo
        </Button>
      </div>
    </Card>
  );
}

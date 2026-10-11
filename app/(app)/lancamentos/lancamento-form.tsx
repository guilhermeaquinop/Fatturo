"use client";

// Formulário de lançamento: serve para criar um lançamento manual e para editar um existente.
// Equivale a uma view Blade de create/edit compartilhada (o _form.blade.php).
// Lançamento vindo de extrato mantém data, valor e sentido do banco: esses campos ficam travados.
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { formatarDataBr, mascararData } from "@/lib/datas";
import { formatarValorParaCampo } from "@/lib/dinheiro";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import type { Lancamento } from "@/lib/lancamentos";
import {
  CATEGORIAS,
  ROTULO_CATEGORIA,
  ROTULO_SENTIDO,
  SEM_CLASSIFICACAO,
  SENTIDOS,
  lancamentoSchema,
  type LancamentoDados,
} from "@/lib/validacao/lancamento";
import { atualizarLancamento, criarLancamento, excluirLancamento } from "./actions";

type LancamentoFormProps = {
  /** Lançamento a editar. Sem ele, o formulário cria um lançamento manual. */
  lancamento?: Lancamento;
  /** Para onde o "Cancelar" volta. */
  voltarPara: string;
};

export function LancamentoForm({ lancamento, voltarPara }: LancamentoFormProps) {
  const importado = lancamento?.origem === "arquivo";
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LancamentoDados>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: lancamento
      ? {
          data: formatarDataBr(lancamento.data),
          sentido: lancamento.sentido,
          valor: formatarValorParaCampo(lancamento.valorCentavos),
          descricao: lancamento.descricao,
          contraparteNome: lancamento.contraparteNome ?? "",
          categoria: lancamento.categoria ?? "",
        }
      : { data: "", sentido: "entrada", valor: "", descricao: "", contraparteNome: "", categoria: "" },
  });

  useResetAoOcultar(() => {
    reset();
    setConfirmandoExclusao(false);
  });

  const onSubmit = handleSubmit(async (dados) => {
    // Só volta daqui em caso de erro; no sucesso a action redireciona para a lista.
    const resultado = lancamento
      ? await atualizarLancamento(lancamento.id, dados)
      : await criarLancamento(dados);
    if (resultado?.erro) setError("root", { message: resultado.erro });
  });

  async function excluir() {
    if (!lancamento) return;
    setExcluindo(true);
    const resultado = await excluirLancamento(lancamento.id);
    if (resultado?.erro) {
      setError("root", { message: resultado.erro });
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  // A máscara ajusta o texto antes de o React Hook Form guardar o valor.
  const data = register("data");
  const travado = importado ? "Vem do extrato do banco e não pode ser alterado." : undefined;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-[18px] rounded-xl border border-border bg-surface p-7"
    >
      <div className="flex flex-wrap gap-[18px]">
        <div className="flex-[1_1_160px]">
          <TextField
            label="Data"
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            autoComplete="off"
            readOnly={importado}
            hint={travado ?? "Pode ser uma data passada."}
            error={errors.data?.message}
            {...data}
            onChange={(evento) => {
              evento.target.value = mascararData(evento.target.value);
              return data.onChange(evento);
            }}
          />
        </div>
        <div className="flex-[1_1_160px]">
          {importado ? (
            <TextField
              label="Tipo"
              type="text"
              readOnly
              value={ROTULO_SENTIDO[lancamento.sentido]}
              hint={travado}
            />
          ) : (
            <SelectField label="Tipo" error={errors.sentido?.message} {...register("sentido")}>
              {SENTIDOS.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {ROTULO_SENTIDO[opcao]}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        <div className="flex-[1_1_160px]">
          <TextField
            label="Valor (R$)"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            readOnly={importado}
            hint={travado}
            error={errors.valor?.message}
            {...register("valor")}
          />
        </div>
      </div>

      <TextField
        label="Descrição"
        type="text"
        placeholder="Ex.: Pix recebido pelo serviço de setembro"
        autoComplete="off"
        error={errors.descricao?.message}
        {...register("descricao")}
      />
      <TextField
        label="Remetente ou destinatário"
        type="text"
        placeholder="Opcional"
        autoComplete="off"
        error={errors.contraparteNome?.message}
        {...register("contraparteNome")}
      />
      <SelectField label="Categoria" error={errors.categoria?.message} {...register("categoria")}>
        <option value="">{SEM_CLASSIFICACAO}</option>
        {CATEGORIAS.map((opcao) => (
          <option key={opcao} value={opcao}>
            {ROTULO_CATEGORIA[opcao]}
          </option>
        ))}
      </SelectField>

      {errors.root?.message ? <Alert variant="error">{errors.root.message}</Alert> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting || excluindo}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href={voltarPara}>Cancelar</Link>
        </Button>
      </div>

      {lancamento ? (
        <div className="flex flex-col gap-3 border-t border-divider pt-[18px]">
          {confirmandoExclusao ? (
            <>
              <Alert variant="warning">
                Excluir este lançamento? Isso não pode ser desfeito.
                {importado
                  ? " Se você importar de novo um extrato que traga este lançamento, ele volta."
                  : ""}
              </Alert>
              <div className="flex flex-wrap gap-3">
                <Button
                  key="confirmar"
                  type="button"
                  variant="secondary"
                  disabled={excluindo}
                  onClick={excluir}
                >
                  {excluindo ? "Excluindo…" : "Confirmar exclusão"}
                </Button>
                <Button
                  key="desistir"
                  type="button"
                  variant="tint"
                  disabled={excluindo}
                  onClick={() => setConfirmandoExclusao(false)}
                >
                  Manter lançamento
                </Button>
              </div>
            </>
          ) : (
            <div>
              <Button
                key="excluir"
                type="button"
                variant="secondary"
                onClick={() => setConfirmandoExclusao(true)}
              >
                Excluir lançamento
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

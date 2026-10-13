"use client";

// Formulário da guia do DAS de um mês: valor, vencimento e data do pagamento.
// Equivale a uma view Blade de edit com um <form method="POST"> e @method('PUT').
// Deixar "Pago em" vazio mantém (ou volta) a guia como não paga.
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatarDataBr, mascararData } from "@/lib/datas";
import { formatarValorParaCampo } from "@/lib/dinheiro";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import { guiaDasSchema, type GuiaDasDados } from "@/lib/validacao/das";
import { salvarGuia } from "./actions";

type GuiaFormProps = {
  /** Mês de competência, "aaaa-mm". */
  competencia: string;
  vencimento: string;
  valorCentavos: number | null;
  pagoEm: string | null;
  /** Valor sugerido para a guia da ME, quando houver. */
  sugestaoCentavos: number | null;
  /** Hoje, "aaaa-mm-dd", para o atalho "Paguei hoje". */
  hoje: string;
  voltarPara: string;
};

export function GuiaForm(props: GuiaFormProps) {
  const { competencia, sugestaoCentavos, hoje, voltarPara } = props;
  // O campo já vem com o valor gravado ou, na falta dele, com a sugestão.
  const valorInicial = props.valorCentavos ?? sugestaoCentavos;

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GuiaDasDados>({
    resolver: zodResolver(guiaDasSchema),
    defaultValues: {
      valor: valorInicial === null ? "" : formatarValorParaCampo(valorInicial),
      vencimento: formatarDataBr(props.vencimento),
      pagoEm: props.pagoEm ? formatarDataBr(props.pagoEm) : "",
    },
  });

  useResetAoOcultar(() => reset());

  const onSubmit = handleSubmit(async (dados) => {
    // Só volta daqui em caso de erro; no sucesso a action redireciona para a lista.
    const resultado = await salvarGuia(competencia, dados);
    if (resultado?.erro) setError("root", { message: resultado.erro });
  });

  // As máscaras ajustam o texto antes de o React Hook Form guardar o valor.
  const vencimento = register("vencimento");
  const pagoEm = register("pagoEm");
  const usandoSugestao = props.valorCentavos === null && sugestaoCentavos !== null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-[18px] rounded-xl border border-border bg-surface p-7"
    >
      <TextField
        label="Valor da guia (R$)"
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        autoComplete="off"
        hint={
          usandoSugestao
            ? "Valor sugerido pela receita do mês. Confira com a guia antes de salvar."
            : "O valor total do documento, como aparece na guia."
        }
        error={errors.valor?.message}
        {...register("valor")}
      />
      <TextField
        label="Vencimento"
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        autoComplete="off"
        hint="Dia 20 do mês seguinte, ou o próximo dia útil. Ajuste se a guia trouxer outra data."
        error={errors.vencimento?.message}
        {...vencimento}
        onChange={(evento) => {
          evento.target.value = mascararData(evento.target.value);
          return vencimento.onChange(evento);
        }}
      />
      <TextField
        label="Pago em"
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        autoComplete="off"
        hint="Deixe em branco se a guia ainda não foi paga."
        error={errors.pagoEm?.message}
        labelAside={
          <button
            type="button"
            className="cursor-pointer text-label font-semibold text-link underline hover:text-brand-deep"
            onClick={() => setValue("pagoEm", formatarDataBr(hoje), { shouldValidate: true })}
          >
            Paguei hoje
          </button>
        }
        {...pagoEm}
        onChange={(evento) => {
          evento.target.value = mascararData(evento.target.value);
          return pagoEm.onChange(evento);
        }}
      />

      {errors.root?.message ? <Alert variant="error">{errors.root.message}</Alert> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href={voltarPara}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}

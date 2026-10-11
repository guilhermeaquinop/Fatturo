"use client";

// Formulário da configuração inicial em três passos: Empresa, Enquadramento e Revisão.
// Equivale a um wizard em Blade + Livewire. Nada vai ao servidor antes do "Salvar" da
// revisão; os passos só trocam o que aparece na tela. Mockup: docs/mockups/configuracao.html.
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { OptionCard } from "@/components/ui/option-card";
import { SelectField } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { FieldError, TextField } from "@/components/ui/text-field";
import { mascararCnpj } from "@/lib/cnpj";
import { mascararData } from "@/lib/datas";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import {
  ANEXOS,
  ATIVIDADES,
  PORTES,
  ROTULO_ANEXO,
  ROTULO_ATIVIDADE,
  ROTULO_PORTE,
  ROTULO_REGIME,
  empresaSchema,
  type EmpresaDados,
  type Porte,
} from "@/lib/validacao/empresa";
import { salvarEmpresa } from "./actions";

const PASSOS = ["Empresa", "Enquadramento", "Revisão"] as const;
const PASSO_REVISAO = PASSOS.length - 1;

// Campos conferidos ao clicar em "Continuar" em cada passo.
const CAMPOS_DO_PASSO: (keyof EmpresaDados)[][] = [
  ["cnpj", "nome", "dataAbertura"],
  ["porte", "regime", "atividade", "anexo"],
];

type ConfiguracaoFormProps = {
  /** Texto do limite anual de cada porte, já formatado a partir da tabela `parametro`. */
  limites: Record<Porte, string>;
};

export function ConfiguracaoForm({ limites }: ConfiguracaoFormProps) {
  const [passo, setPasso] = useState(0);
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    setError,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmpresaDados>({
    resolver: zodResolver(empresaSchema),
    // O porte começa sem escolha: o usuário precisa decidir.
    defaultValues: {
      cnpj: "",
      nome: "",
      dataAbertura: "",
      regime: "SIMPLES",
      atividade: "servico",
      anexo: "",
    },
  });

  const porte = useWatch({ control, name: "porte" });

  useResetAoOcultar(() => {
    reset();
    setPasso(0);
  });

  async function continuar() {
    const valido = await trigger(CAMPOS_DO_PASSO[passo]);
    if (valido) setPasso(passo + 1);
  }

  const onSubmit = handleSubmit(async (dados) => {
    // Só volta daqui em caso de erro; no sucesso a action redireciona.
    const resultado = await salvarEmpresa(dados);
    if (resultado?.erro) setError("root", { message: resultado.erro });
  });

  // As máscaras ajustam o texto antes de o React Hook Form guardar o valor.
  const cnpj = register("cnpj");
  const dataAbertura = register("dataAbertura");

  return (
    <>
      <Stepper steps={PASSOS} current={passo} />

      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-7"
      >
        {passo === 0 ? (
          <div className="flex flex-col gap-[18px]">
            <TextField
              label="CNPJ"
              type="text"
              placeholder="00.000.000/0000-00"
              autoComplete="off"
              error={errors.cnpj?.message}
              {...cnpj}
              onChange={(evento) => {
                evento.target.value = mascararCnpj(evento.target.value);
                return cnpj.onChange(evento);
              }}
            />
            <TextField
              label="Nome da empresa"
              type="text"
              placeholder="Razão social ou nome fantasia"
              autoComplete="organization"
              error={errors.nome?.message}
              {...register("nome")}
            />
            <TextField
              label="Data de abertura"
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              autoComplete="off"
              hint="Usada para calcular o limite proporcional no ano de abertura."
              error={errors.dataAbertura?.message}
              {...dataAbertura}
              onChange={(evento) => {
                evento.target.value = mascararData(evento.target.value);
                return dataAbertura.onChange(evento);
              }}
            />
          </div>
        ) : null}

        {passo === 1 ? (
          <div className="flex flex-col gap-[18px]">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-label">Porte</legend>
              <div className="flex flex-wrap gap-2.5">
                {PORTES.map((opcao) => (
                  <OptionCard
                    key={opcao}
                    title={ROTULO_PORTE[opcao]}
                    description={`Até ${limites[opcao]} por ano`}
                    selected={porte === opcao}
                    onClick={() => setValue("porte", opcao, { shouldValidate: true })}
                  />
                ))}
              </div>
              {errors.porte?.message ? <FieldError>{errors.porte.message}</FieldError> : null}
            </fieldset>

            <SelectField
              label="Regime tributário"
              error={errors.regime?.message}
              {...register("regime")}
            >
              <option value="SIMPLES">{ROTULO_REGIME.SIMPLES}</option>
              <option disabled>Lucro Presumido (em breve)</option>
            </SelectField>

            <SelectField
              label="Atividade"
              error={errors.atividade?.message}
              {...register("atividade")}
            >
              {ATIVIDADES.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {ROTULO_ATIVIDADE[opcao]}
                </option>
              ))}
            </SelectField>

            {porte === "ME" ? (
              <SelectField
                label="Anexo do Simples"
                hint="Na dúvida, confira com seu contador. Você pode alterar depois em Configurações."
                error={errors.anexo?.message}
                {...register("anexo")}
              >
                <option value="">Selecione</option>
                {ANEXOS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {ROTULO_ANEXO[opcao]}
                  </option>
                ))}
              </SelectField>
            ) : null}

            {porte === "MEI" ? (
              <div className="rounded-md bg-surface-tint px-3.5 py-3 text-label font-normal">
                O DAS do MEI tem valor fixo e será preenchido automaticamente conforme a
                atividade.
              </div>
            ) : null}
          </div>
        ) : null}

        {passo === PASSO_REVISAO ? (
          <Revisao dados={getValues()} erro={errors.root?.message} />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-5">
          {passo > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              onClick={() => setPasso(passo - 1)}
            >
              Voltar
            </Button>
          ) : (
            <span />
          )}

          {/* As keys diferentes obrigam o React a criar um botão novo em cada caso. Sem
              elas, ele reaproveitaria o mesmo botão: o clique em "Continuar" terminaria
              num botão que já virou "Salvar" e enviaria o formulário sem passar pela revisão. */}
          {passo === PASSO_REVISAO ? (
            <Button key="salvar" type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Salvando…" : "Salvar"}
            </Button>
          ) : (
            <Button key="continuar" type="button" size="lg" onClick={continuar}>
              Continuar
            </Button>
          )}
        </div>
      </form>
    </>
  );
}

function Revisao({ dados, erro }: { dados: EmpresaDados; erro?: string }) {
  const linhas: [string, string][] = [
    ["CNPJ", dados.cnpj],
    ["Nome da empresa", dados.nome],
    ["Data de abertura", dados.dataAbertura],
    ["Porte", ROTULO_PORTE[dados.porte]],
    ["Regime tributário", ROTULO_REGIME[dados.regime]],
    ["Atividade", ROTULO_ATIVIDADE[dados.atividade]],
  ];
  if (dados.porte === "ME" && dados.anexo !== "") {
    linhas.push(["Anexo do Simples", ROTULO_ANEXO[dados.anexo]]);
  }

  return (
    <div className="flex flex-col gap-4">
      {erro ? <Alert variant="error">{erro}</Alert> : null}
      <div>
        <h2 className="text-section-title">Confira os dados</h2>
        <div className="text-ink-muted">
          Se algo estiver errado, volte e corrija. Depois de salvar, as alterações são feitas na
          tela de Configurações.
        </div>
      </div>
      <dl className="flex flex-col">
        {linhas.map(([rotulo, valor]) => (
          <div
            key={rotulo}
            className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-divider py-3 last:border-b-0"
          >
            <dt className="text-ink-muted">{rotulo}</dt>
            <dd className="font-semibold">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

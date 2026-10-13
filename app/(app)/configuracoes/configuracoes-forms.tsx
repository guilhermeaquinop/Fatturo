"use client";

// Formulários da tela de Configurações, um por cartão: empresa, enquadramento, alertas,
// senha e conta. Equivalem aos <form> de uma view Blade de "settings", cada um com o seu
// botão Salvar e a sua mensagem de retorno. São componentes de cliente por causa da
// validação enquanto se digita e das mensagens de sucesso e erro sem recarregar a página.
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch, type FieldValues, type UseFormSetError } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { mascararData } from "@/lib/datas";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import {
  PALAVRA_DE_EXCLUSAO,
  alertasSchema,
  anexoSchema,
  dadosDaEmpresaSchema,
  exclusaoDaContaSchema,
  inativacaoDaContaSchema,
  mudancaDeEnquadramentoSchema,
  trocaDeSenhaSchema,
  type AlertasDados,
  type AnexoDados,
  type DadosDaEmpresa,
  type ExclusaoDaContaDados,
  type InativacaoDaContaDados,
  type MudancaDeEnquadramento,
  type TrocaDeSenhaDados,
} from "@/lib/validacao/configuracoes";
import {
  ANEXOS,
  ATIVIDADES,
  PORTES,
  ROTULO_ANEXO,
  ROTULO_ATIVIDADE,
  ROTULO_PORTE,
  type Anexo,
  type Atividade,
  type Porte,
} from "@/lib/validacao/empresa";
import {
  corrigirAnexo,
  desfazerMudancaDeEnquadramento,
  excluirConta,
  inativarConta,
  registrarMudancaDeEnquadramento,
  salvarAlertas,
  salvarDadosDaEmpresa,
  trocarSenha,
  type Resultado,
} from "./actions";

const FORM = "flex flex-col gap-[18px]";

/** Chama a action e mostra o erro dela no formulário. Devolve true se deu certo. */
async function enviar<T extends FieldValues>(
  acao: () => Promise<Resultado>,
  setError: UseFormSetError<T>,
): Promise<boolean> {
  const resultado = await acao();
  if (!resultado.ok) setError("root", { message: resultado.erro });
  return resultado.ok;
}

function Retorno({ erro, sucesso }: { erro?: string; sucesso: string | null }) {
  if (erro) return <Alert variant="error">{erro}</Alert>;
  if (sucesso) return <Alert variant="success">{sucesso}</Alert>;
  return null;
}

// --- Empresa ---

export function EmpresaForm({ nome, atividade }: { nome: string; atividade: Atividade }) {
  const [sucesso, setSucesso] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DadosDaEmpresa>({
    resolver: zodResolver(dadosDaEmpresaSchema),
    defaultValues: { nome, atividade },
  });
  useResetAoOcultar(() => {
    reset();
    setSucesso(null);
  });

  const onSubmit = handleSubmit(async (dados) => {
    setSucesso(null);
    if (await enviar(() => salvarDadosDaEmpresa(dados), setError)) {
      reset(dados);
      setSucesso("Dados da empresa salvos.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={FORM}>
      <TextField
        label="Nome da empresa"
        type="text"
        autoComplete="organization"
        error={errors.nome?.message}
        {...register("nome")}
      />
      <SelectField label="Atividade" error={errors.atividade?.message} {...register("atividade")}>
        {ATIVIDADES.map((opcao) => (
          <option key={opcao} value={opcao}>
            {ROTULO_ATIVIDADE[opcao]}
          </option>
        ))}
      </SelectField>
      <Retorno erro={errors.root?.message} sucesso={sucesso} />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

// --- Enquadramento ---

type EnquadramentoFormProps = {
  porteAtual: Porte;
  anexoAtual: Anexo | null;
  /** Há um período anterior para onde voltar. */
  podeDesfazer: boolean;
};

export function EnquadramentoForm({ porteAtual, anexoAtual, podeDesfazer }: EnquadramentoFormProps) {
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [desfazendo, setDesfazendo] = useState(false);
  const [confirmandoDesfazer, setConfirmandoDesfazer] = useState(false);

  // Sugere o porte contrário ao atual: quem é MEI costuma estar registrando a virada para ME.
  const mudanca = useForm<MudancaDeEnquadramento>({
    resolver: zodResolver(mudancaDeEnquadramentoSchema),
    defaultValues: { porte: porteAtual === "MEI" ? "ME" : "MEI", anexo: "", inicioEm: "" },
  });
  const anexo = useForm<AnexoDados>({
    resolver: zodResolver(anexoSchema),
    defaultValues: { anexo: anexoAtual ?? "III" },
  });
  const porteEscolhido = useWatch({ control: mudanca.control, name: "porte" });

  // Depois de uma mudança ou de um desfazer, o anexo em vigor é outro: o campo acompanha.
  const { reset: resetAnexo } = anexo;
  useEffect(() => {
    resetAnexo({ anexo: anexoAtual ?? "III" });
  }, [anexoAtual, resetAnexo]);

  useResetAoOcultar(() => {
    mudanca.reset();
    anexo.reset();
    setSucesso(null);
    setConfirmandoDesfazer(false);
  });

  const registrar = mudanca.handleSubmit(async (dados) => {
    setSucesso(null);
    if (await enviar(() => registrarMudancaDeEnquadramento(dados), mudanca.setError)) {
      mudanca.reset({ porte: dados.porte === "MEI" ? "ME" : "MEI", anexo: "", inicioEm: "" });
      setSucesso("Mudança de enquadramento registrada.");
    }
  });

  const corrigir = anexo.handleSubmit(async (dados) => {
    setSucesso(null);
    if (await enviar(() => corrigirAnexo(dados), anexo.setError)) {
      anexo.reset(dados);
      setSucesso("Anexo corrigido.");
    }
  });

  async function desfazer() {
    setSucesso(null);
    setDesfazendo(true);
    const deuCerto = await enviar(() => desfazerMudancaDeEnquadramento(), mudanca.setError);
    setDesfazendo(false);
    setConfirmandoDesfazer(false);
    if (deuCerto) {
      // Volta a sugerir o porte contrário ao que passou a valer.
      mudanca.reset({ porte: porteAtual, anexo: "", inicioEm: "" });
      setSucesso("Última mudança desfeita.");
    }
  }

  const inicioEm = mudanca.register("inicioEm");

  return (
    <div className="flex flex-col gap-7">
      <Retorno erro={undefined} sucesso={sucesso} />

      {porteAtual === "ME" ? (
        <form onSubmit={corrigir} noValidate className={FORM}>
          <div>
            <div className="text-label">Corrigir o anexo atual</div>
            <div className="text-caption text-ink-muted">
              Para trocar o “Não sei” pelo anexo certo, sem registrar uma mudança de data.
            </div>
          </div>
          <SelectField
            label="Anexo do Simples"
            error={anexo.formState.errors.anexo?.message}
            {...anexo.register("anexo")}
          >
            {ANEXOS.map((opcao) => (
              <option key={opcao} value={opcao}>
                {ROTULO_ANEXO[opcao]}
              </option>
            ))}
          </SelectField>
          {anexo.formState.errors.root?.message ? (
            <Alert variant="error">{anexo.formState.errors.root.message}</Alert>
          ) : null}
          <div>
            <Button type="submit" variant="secondary" disabled={anexo.formState.isSubmitting}>
              {anexo.formState.isSubmitting ? "Salvando…" : "Corrigir anexo"}
            </Button>
          </div>
        </form>
      ) : null}

      <form onSubmit={registrar} noValidate className={`${FORM} border-t border-divider pt-[18px]`}>
        <div>
          <div className="text-label">Registrar uma mudança</div>
          <div className="text-caption text-ink-muted">
            Quando a empresa muda de porte ou de anexo a partir de uma data, como ao deixar de ser
            MEI. O período atual é encerrado na véspera e o histórico fica guardado.
          </div>
        </div>
        <div className="flex flex-wrap gap-[18px]">
          <div className="flex-[1_1_160px]">
            <SelectField
              label="Novo porte"
              error={mudanca.formState.errors.porte?.message}
              {...mudanca.register("porte")}
            >
              {PORTES.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {ROTULO_PORTE[opcao]}
                </option>
              ))}
            </SelectField>
          </div>
          {porteEscolhido === "ME" ? (
            <div className="flex-[1_1_160px]">
              <SelectField
                label="Novo anexo"
                error={mudanca.formState.errors.anexo?.message}
                {...mudanca.register("anexo")}
              >
                <option value="">Selecione</option>
                {ANEXOS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {ROTULO_ANEXO[opcao]}
                  </option>
                ))}
              </SelectField>
            </div>
          ) : null}
          <div className="flex-[1_1_160px]">
            <TextField
              label="A partir de"
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              autoComplete="off"
              error={mudanca.formState.errors.inicioEm?.message}
              {...inicioEm}
              onChange={(evento) => {
                evento.target.value = mascararData(evento.target.value);
                return inicioEm.onChange(evento);
              }}
            />
          </div>
        </div>
        {mudanca.formState.errors.root?.message ? (
          <Alert variant="error">{mudanca.formState.errors.root.message}</Alert>
        ) : null}
        <div>
          <Button type="submit" disabled={mudanca.formState.isSubmitting}>
            {mudanca.formState.isSubmitting ? "Registrando…" : "Registrar mudança"}
          </Button>
        </div>
      </form>

      {podeDesfazer ? (
        <div className="flex flex-col gap-3 border-t border-divider pt-[18px]">
          {confirmandoDesfazer ? (
            <>
              <Alert variant="warning">
                Desfazer a última mudança? O período atual é apagado e o anterior volta a valer.
              </Alert>
              <div className="flex flex-wrap gap-3">
                <Button
                  key="confirmar"
                  type="button"
                  variant="secondary"
                  disabled={desfazendo}
                  onClick={desfazer}
                >
                  {desfazendo ? "Desfazendo…" : "Confirmar"}
                </Button>
                <Button
                  key="desistir"
                  type="button"
                  variant="tint"
                  disabled={desfazendo}
                  onClick={() => setConfirmandoDesfazer(false)}
                >
                  Manter como está
                </Button>
              </div>
            </>
          ) : (
            <div>
              <Button
                key="desfazer"
                type="button"
                variant="secondary"
                onClick={() => setConfirmandoDesfazer(true)}
              >
                Desfazer a última mudança
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// --- Alertas ---

type AlertasFormProps = {
  faixas: number[];
  email: string | null;
  /** E-mail de login, usado quando o campo fica vazio. */
  emailDeLogin: string;
};

export function AlertasForm({ faixas, email, emailDeLogin }: AlertasFormProps) {
  const [sucesso, setSucesso] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AlertasDados>({
    resolver: zodResolver(alertasSchema),
    defaultValues: {
      faixa1: String(faixas[0]),
      faixa2: String(faixas[1]),
      faixa3: String(faixas[2]),
      email: email ?? "",
    },
  });
  useResetAoOcultar(() => {
    reset();
    setSucesso(null);
  });

  const onSubmit = handleSubmit(async (dados) => {
    setSucesso(null);
    if (await enviar(() => salvarAlertas(dados), setError)) {
      reset(dados);
      setSucesso("Alertas salvos.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={FORM}>
      <div className="flex flex-wrap gap-[18px]">
        {(["faixa1", "faixa2", "faixa3"] as const).map((campo, indice) => (
          <div key={campo} className="flex-[1_1_140px]">
            <TextField
              label={`${indice + 1}ª faixa (%)`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              error={errors[campo]?.message}
              {...register(campo)}
            />
          </div>
        ))}
      </div>
      <TextField
        label="E-mail dos alertas"
        type="email"
        placeholder={emailDeLogin}
        autoComplete="email"
        hint={`Em branco, os alertas vão para ${emailDeLogin}.`}
        error={errors.email?.message}
        {...register("email")}
      />
      <Retorno erro={errors.root?.message} sucesso={sucesso} />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

// --- Senha ---

export function SenhaForm() {
  const [sucesso, setSucesso] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrocaDeSenhaDados>({
    resolver: zodResolver(trocaDeSenhaSchema),
    defaultValues: { senhaAtual: "", senha: "", confirmacao: "" },
  });
  useResetAoOcultar(() => {
    reset();
    setSucesso(null);
  });

  const onSubmit = handleSubmit(async (dados) => {
    setSucesso(null);
    if (await enviar(() => trocarSenha(dados), setError)) {
      reset();
      setSucesso("Senha trocada. As outras sessões foram encerradas.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className={FORM}>
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        error={errors.senhaAtual?.message}
        {...register("senhaAtual")}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 10 caracteres."
        error={errors.senha?.message}
        {...register("senha")}
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmacao?.message}
        {...register("confirmacao")}
      />
      <Retorno erro={errors.root?.message} sucesso={sucesso} />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Trocando…" : "Trocar senha"}
        </Button>
      </div>
    </form>
  );
}

// --- Conta: inativar e excluir ---

export function InativarContaForm() {
  const [aberto, setAberto] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InativacaoDaContaDados>({
    resolver: zodResolver(inativacaoDaContaSchema),
    defaultValues: { senha: "" },
  });
  useResetAoOcultar(() => {
    reset();
    setAberto(false);
  });

  // No sucesso a action redireciona para a tela de conta inativa.
  const onSubmit = handleSubmit(async (dados) => {
    await enviar(() => inativarConta(dados), setError);
  });

  if (!aberto) {
    return (
      <div>
        <Button key="abrir" type="button" variant="secondary" onClick={() => setAberto(true)}>
          Inativar conta
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={FORM}>
      <TextField
        label="Sua senha"
        type="password"
        autoComplete="current-password"
        error={errors.senha?.message}
        {...register("senha")}
      />
      {errors.root?.message ? <Alert variant="error">{errors.root.message}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button key="confirmar" type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? "Inativando…" : "Confirmar inativação"}
        </Button>
        <Button
          key="desistir"
          type="button"
          variant="tint"
          disabled={isSubmitting}
          onClick={() => {
            reset();
            setAberto(false);
          }}
        >
          Manter a conta ativa
        </Button>
      </div>
    </form>
  );
}

export function ExcluirContaForm() {
  const [aberto, setAberto] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExclusaoDaContaDados>({
    resolver: zodResolver(exclusaoDaContaSchema),
    defaultValues: { senha: "", confirmacao: "" },
  });
  useResetAoOcultar(() => {
    reset();
    setAberto(false);
  });

  // No sucesso a action redireciona para o login.
  const onSubmit = handleSubmit(async (dados) => {
    await enviar(() => excluirConta(dados), setError);
  });

  if (!aberto) {
    return (
      <div>
        <Button key="abrir" type="button" variant="secondary" onClick={() => setAberto(true)}>
          Excluir conta
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={FORM}>
      <Alert variant="warning">
        Isso apaga a empresa, as notas, os lançamentos e as guias do DAS. Não pode ser desfeito.
        Se quiser guardar uma cópia, exporte os dados antes.
      </Alert>
      <TextField
        label="Sua senha"
        type="password"
        autoComplete="current-password"
        error={errors.senha?.message}
        {...register("senha")}
      />
      <TextField
        label={`Digite ${PALAVRA_DE_EXCLUSAO} para confirmar`}
        type="text"
        autoComplete="off"
        error={errors.confirmacao?.message}
        {...register("confirmacao")}
      />
      {errors.root?.message ? <Alert variant="error">{errors.root.message}</Alert> : null}
      <div className="flex flex-wrap gap-3">
        <Button key="confirmar" type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? "Excluindo…" : "Excluir a conta de vez"}
        </Button>
        <Button
          key="desistir"
          type="button"
          variant="tint"
          disabled={isSubmitting}
          onClick={() => {
            reset();
            setAberto(false);
          }}
        >
          Manter a conta
        </Button>
      </div>
    </form>
  );
}

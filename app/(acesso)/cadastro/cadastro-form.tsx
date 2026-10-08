"use client";

// Formulário de cadastro. Equivale ao <form> da view auth/register.blade.php,
// com a validação do Form Request rodando também no navegador.
import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { FieldError, TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { SENHA_MINIMA, cadastroSchema, type CadastroDados } from "@/lib/validacao/acesso";
import { cadastrar } from "../actions";

export function CadastroForm() {
  const aceiteErroId = useId();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroDados>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: "", email: "", senha: "", confirmacao: "", aceite: false },
  });

  useResetAoOcultar(reset);

  const onSubmit = handleSubmit(async (dados) => {
    // Só volta daqui em caso de erro; no sucesso a action redireciona.
    const resultado = await cadastrar(dados);
    if (resultado?.erro) setError("root", { message: resultado.erro });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
      {errors.root?.message ? (
        <Alert variant="error">{errors.root.message}</Alert>
      ) : null}
      <TextField
        label="Nome"
        type="text"
        autoComplete="name"
        error={errors.nome?.message}
        {...register("nome")}
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com.br"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        hint={`Mínimo de ${SENHA_MINIMA} caracteres.`}
        error={errors.senha?.message}
        {...register("senha")}
      />
      <TextField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmacao?.message}
        {...register("confirmacao")}
      />
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2.5 text-label font-normal text-ink-muted">
          <Checkbox
            aria-invalid={errors.aceite ? true : undefined}
            aria-describedby={errors.aceite ? aceiteErroId : undefined}
            {...register("aceite")}
          />
          <span>
            Li e aceito os{" "}
            <TextLink href="/termos" target="_blank">
              termos de uso
            </TextLink>{" "}
            e a{" "}
            <TextLink href="/privacidade" target="_blank">
              política de privacidade
            </TextLink>
            .
          </span>
        </label>
        {errors.aceite?.message ? (
          <FieldError id={aceiteErroId}>{errors.aceite.message}</FieldError>
        ) : null}
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Criando conta…" : "Criar conta"}
      </Button>
      <div className="text-center text-ink-muted">
        Já tem conta? <TextLink href="/login">Entrar</TextLink>
      </div>
    </form>
  );
}

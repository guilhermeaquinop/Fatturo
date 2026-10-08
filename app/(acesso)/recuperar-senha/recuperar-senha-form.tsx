"use client";

// Formulário de recuperação de senha. Equivale ao <form> da view
// auth/forgot-password.blade.php. A resposta é a mesma exista ou não a conta.
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { recuperarSenhaSchema, type RecuperarSenhaDados } from "@/lib/validacao/acesso";
import { pedirRecuperacao } from "../actions";

export function RecuperarSenhaForm() {
  const [enviado, setEnviado] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecuperarSenhaDados>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: "" },
  });

  useResetAoOcultar(() => {
    reset();
    setEnviado(false);
  });

  const onSubmit = handleSubmit(async (dados) => {
    const resultado = await pedirRecuperacao(dados);
    if (resultado?.erro) {
      setError("root", { message: resultado.erro });
      return;
    }
    setEnviado(true);
  });

  if (enviado) {
    return (
      <div className="flex flex-col gap-5">
        <Alert variant="info">
          Se existir uma conta com esse e-mail, enviamos o link para criar uma nova senha. Ele
          vale por 1 hora.
        </Alert>
        <div className="text-center text-ink-muted">
          <TextLink href="/login">Voltar para o login</TextLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {errors.root?.message ? (
        <Alert variant="error">{errors.root.message}</Alert>
      ) : null}
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com.br"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link"}
      </Button>
      <div className="text-center text-ink-muted">
        Lembrou a senha? <TextLink href="/login">Entrar</TextLink>
      </div>
    </form>
  );
}

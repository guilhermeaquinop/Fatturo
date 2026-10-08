"use client";

// Formulário de login. Equivale ao <form> da view Blade, com a validação do
// Form Request rodando também no navegador (React Hook Form + Zod).
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { loginSchema, type LoginDados } from "@/lib/validacao/acesso";
import { entrar } from "../actions";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginDados>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  useResetAoOcultar(reset);

  const onSubmit = handleSubmit(async (dados) => {
    // Só volta daqui em caso de erro; no sucesso a action redireciona.
    const resultado = await entrar(dados);
    if (resultado?.erro) setError("root", { message: resultado.erro });
  });

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
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        labelAside={
          <TextLink href="/recuperar-senha" className="text-label">
            Esqueci minha senha
          </TextLink>
        }
        error={errors.senha?.message}
        {...register("senha")}
      />
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
      <div className="text-center text-ink-muted">
        Não tem conta? <TextLink href="/cadastro">Criar conta</TextLink>
      </div>
    </form>
  );
}

"use client";

// Formulário de nova senha. Equivale ao <form> da view auth/reset-password.blade.php.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useResetAoOcultar } from "@/lib/hooks/use-reset-ao-ocultar";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { TextField } from "@/components/ui/text-field";
import { SENHA_MINIMA, novaSenhaSchema, type NovaSenhaDados } from "@/lib/validacao/acesso";
import { definirNovaSenha } from "../actions";

export function NovaSenhaForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenhaDados>({
    resolver: zodResolver(novaSenhaSchema),
    defaultValues: { senha: "", confirmacao: "" },
  });

  useResetAoOcultar(reset);

  const onSubmit = handleSubmit(async (dados) => {
    // Só volta daqui em caso de erro; no sucesso a action redireciona.
    const resultado = await definirNovaSenha(dados);
    if (resultado?.erro) setError("root", { message: resultado.erro });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {errors.root?.message ? (
        <Alert variant="error">{errors.root.message}</Alert>
      ) : null}
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint={`Mínimo de ${SENHA_MINIMA} caracteres.`}
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
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}

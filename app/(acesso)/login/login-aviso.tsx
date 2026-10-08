"use client";

// Aviso no topo do login, escolhido pelo parâmetro ?aviso= da URL.
// Equivale a um session('status') exibido na view depois de um redirect.
import { useSearchParams } from "next/navigation";
import { Alert, AlertTitle } from "@/components/ui/alert";

export function LoginAviso() {
  const aviso = useSearchParams().get("aviso");

  if (aviso === "link-invalido") {
    return (
      <Alert variant="error">
        <AlertTitle>Link inválido ou expirado</AlertTitle>
        Entre com sua senha ou peça um novo link em Esqueci minha senha.
      </Alert>
    );
  }

  return null;
}

// Página /login. Equivale à rota GET /login com a view auth/login.blade.php.
// Mockup: docs/mockups/login.html.
import type { Metadata } from "next";
import { Suspense } from "react";
import { AcessoShell, AcessoTitulo } from "@/components/acesso/acesso-shell";
import { LoginAviso } from "./login-aviso";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AcessoShell>
      <div className="flex flex-col gap-5">
        <AcessoTitulo titulo="Entrar">Bem-vindo de volta.</AcessoTitulo>
        {/* O aviso lê a URL (?aviso=...), o que só existe na hora da requisição;
            o Suspense deixa o resto da página pronto antes disso. */}
        <Suspense fallback={null}>
          <LoginAviso />
        </Suspense>
        <LoginForm />
      </div>
    </AcessoShell>
  );
}

// Página /recuperar-senha. Equivale à view auth/forgot-password.blade.php.
// Sem mockup próprio: segue o layout do login (especificação, "Recuperar senha").
import type { Metadata } from "next";
import { AcessoShell, AcessoTitulo } from "@/components/acesso/acesso-shell";
import { RecuperarSenhaForm } from "./recuperar-senha-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <AcessoShell>
      <div className="flex flex-col gap-5">
        <AcessoTitulo titulo="Recuperar senha">
          Informe seu e-mail para receber o link de nova senha.
        </AcessoTitulo>
        <RecuperarSenhaForm />
      </div>
    </AcessoShell>
  );
}

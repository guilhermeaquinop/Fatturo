// Página /cadastro. Equivale à rota GET /register com a view auth/register.blade.php.
// Mockup: docs/mockups/cadastro.html.
import type { Metadata } from "next";
import { AcessoShell, AcessoTitulo, PainelPassos } from "@/components/acesso/acesso-shell";
import { CadastroForm } from "./cadastro-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <AcessoShell painel={<PainelPassos />}>
      <div className="flex flex-col gap-[18px]">
        <AcessoTitulo titulo="Criar conta">Leva menos de um minuto.</AcessoTitulo>
        <CadastroForm />
      </div>
    </AcessoShell>
  );
}

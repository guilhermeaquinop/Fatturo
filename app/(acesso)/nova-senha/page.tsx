// Página /nova-senha: destino do link de recuperação. Equivale à view
// auth/reset-password.blade.php. Exige sessão: o proxy.ts manda para o login quem
// chega sem passar pelo link (app/auth/confirm/route.ts cria a sessão).
import type { Metadata } from "next";
import { AcessoShell, AcessoTitulo } from "@/components/acesso/acesso-shell";
import { NovaSenhaForm } from "./nova-senha-form";

export const metadata: Metadata = { title: "Nova senha" };

export default function NovaSenhaPage() {
  return (
    <AcessoShell>
      <div className="flex flex-col gap-5">
        <AcessoTitulo titulo="Nova senha">Escolha uma senha que você ainda não usou aqui.</AcessoTitulo>
        <NovaSenhaForm />
      </div>
    </AcessoShell>
  );
}

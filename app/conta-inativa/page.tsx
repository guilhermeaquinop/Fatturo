// Página /conta-inativa: o que vê quem inativou a conta e entrou de novo.
// Equivale a uma view Blade mostrada por um middleware que barra contas inativas.
// Daqui só dá para reativar a conta ou sair; o resto do app manda de volta para cá.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { sair } from "@/app/(acesso)/actions";
import { AcessoShell, AcessoTitulo } from "@/components/acesso/acesso-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { textLinkClassName } from "@/components/ui/text-link";
import { formatarDataBr, dataEmSaoPaulo } from "@/lib/datas";
import { ROTA_INICIAL, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import { reativarConta } from "./actions";

export const metadata: Metadata = { title: "Conta inativa" };

export default function ContaInativaPage() {
  return (
    <AcessoShell>
      <div className="flex flex-col gap-6">
        <AcessoTitulo titulo="Sua conta está inativa">
          Seus dados continuam guardados. Reative para voltar a usar o Fatturo.
        </AcessoTitulo>
        {/* Depende do usuário logado, lido na requisição. */}
        <Suspense fallback={<div className="text-ink-muted">Carregando…</div>}>
          <Conteudo />
        </Suspense>
      </div>
    </AcessoShell>
  );
}

async function Conteudo() {
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims) redirect(ROTA_LOGIN);

  const { data: usuario } = await supabase
    .from("usuario")
    .select("inativa_em")
    .eq("id", sessao.claims.sub)
    .maybeSingle();
  // Conta ativa não tem o que fazer aqui.
  if (!usuario?.inativa_em) redirect(ROTA_INICIAL);

  return (
    <>
      <Alert variant="info">
        Conta inativada em {formatarDataBr(dataEmSaoPaulo(new Date(usuario.inativa_em)))}. Enquanto
        ela estiver inativa, nenhum alerta é enviado.
      </Alert>
      {/* Formulários que chamam Server Actions, como um POST /conta/reativar e um POST /logout. */}
      <form action={reativarConta}>
        <Button type="submit" size="lg" className="w-full">
          Reativar conta
        </Button>
      </form>
      <form action={sair} className="text-center">
        <button type="submit" className={`cursor-pointer ${textLinkClassName}`}>
          Sair
        </button>
      </form>
    </>
  );
}

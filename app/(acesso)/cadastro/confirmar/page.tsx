// Página /cadastro/confirmar: avisa que o e-mail de confirmação foi enviado.
// Equivale à view auth/verify-email.blade.php do Laravel.
import type { Metadata } from "next";
import { AcessoShell, AcessoTitulo, PainelPassos } from "@/components/acesso/acesso-shell";
import { Alert } from "@/components/ui/alert";
import { TextLink } from "@/components/ui/text-link";

export const metadata: Metadata = { title: "Confirme seu e-mail" };

export default function ConfirmarCadastroPage() {
  return (
    <AcessoShell painel={<PainelPassos />}>
      <div className="flex flex-col gap-5">
        <AcessoTitulo titulo="Confirme seu e-mail">Falta um passo para entrar.</AcessoTitulo>
        <Alert variant="info">
          Enviamos um link de confirmação para o e-mail informado. Abra a mensagem e clique no
          link para ativar a conta.
        </Alert>
        <div className="text-ink-muted">
          Não recebeu? Confira a caixa de spam. Se o e-mail já tiver uma conta, nenhuma mensagem
          nova é enviada.
        </div>
        <div className="text-center text-ink-muted">
          Já confirmou? <TextLink href="/login">Entrar</TextLink>
        </div>
      </div>
    </AcessoShell>
  );
}

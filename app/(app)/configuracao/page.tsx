// Página /configuracao, PROVISÓRIA: só confirma que o login funcionou.
// Equivale a uma rota protegida pelo middleware 'auth' com uma view simples.
// A etapa 2 troca o conteúdo pela configuração inicial (docs/mockups/configuracao.html).
import type { Metadata } from "next";
import { Suspense } from "react";
import { sair } from "@/app/(acesso)/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { textLinkClassName } from "@/components/ui/text-link";
import { usuarioAtual } from "@/lib/usuario";

export const metadata: Metadata = { title: "Configure sua empresa" };

export default function ConfiguracaoPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-8 py-4">
          <div className="text-wordmark">Fatturo</div>
          {/* Sair é um formulário que chama a Server Action, como um POST /logout. */}
          <form action={sair}>
            <button type="submit" className={`cursor-pointer text-label ${textLinkClassName}`}>
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="flex justify-center px-5 pt-12 pb-16">
        <div className="flex w-full max-w-[560px] flex-col gap-7">
          <div>
            <h1 className="text-page-title">Configure sua empresa</h1>
            <div className="text-ink-muted">
              Essas informações definem o limite e o DAS mostrados no painel.
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-7">
            {/* Ler o usuário depende do cookie da requisição, então fica atrás de um
                Suspense: o resto da página aparece antes e este trecho chega em seguida. */}
            <Suspense fallback={<div className="text-ink-muted">Carregando sua conta…</div>}>
              <Saudacao />
            </Suspense>
            <Alert variant="info">
              <AlertTitle>Tela provisória</AlertTitle>
              A configuração da empresa (dados, enquadramento e ponto de partida) chega na
              próxima etapa.
            </Alert>
          </div>
        </div>
      </main>
    </div>
  );
}

async function Saudacao() {
  const usuario = await usuarioAtual();
  return (
    <div>
      <div className="font-semibold">Você entrou como {usuario.nome}.</div>
      <div className="text-ink-muted">Sua conta está criada e o e-mail, confirmado.</div>
    </div>
  );
}

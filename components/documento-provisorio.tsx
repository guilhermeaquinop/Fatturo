// Página de documento legal ainda sem texto (termos de uso, política de privacidade).
// Equivale a uma view Blade simples reutilizada por duas rotas.
import { Alert, AlertTitle } from "@/components/ui/alert";
import { TextLink } from "@/components/ui/text-link";

export function DocumentoProvisorio({ titulo }: { titulo: string }) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-8 py-4">
          <div className="text-wordmark">Fatturo</div>
          <TextLink href="/cadastro" className="text-label">
            Criar conta
          </TextLink>
        </div>
      </header>
      <main className="flex justify-center px-5 pt-12 pb-16">
        <div className="flex w-full max-w-[560px] flex-col gap-7">
          <h1 className="text-page-title">{titulo}</h1>
          <Alert variant="warning">
            <AlertTitle>Texto a redigir</AlertTitle>
            Este documento ainda não foi escrito. Ele precisa estar pronto antes de o Fatturo ser
            aberto a outras pessoas.
          </Alert>
        </div>
      </main>
    </div>
  );
}

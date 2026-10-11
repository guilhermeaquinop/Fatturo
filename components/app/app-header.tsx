// Cabeçalho das telas internas sem barra lateral: nome do produto e o botão Sair.
// Equivale ao cabeçalho de um layout Blade (layouts/app.blade.php) com o form de logout.
import { sair } from "@/app/(acesso)/actions";
import { textLinkClassName } from "@/components/ui/text-link";

export function AppHeader() {
  return (
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
  );
}

// Moldura das telas de uso diário: barra lateral com o menu e área de conteúdo fluida.
// Equivale ao layouts/app.blade.php do Laravel com a navegação. No celular a barra
// empilha acima do conteúdo (flex-wrap). Mockup: docs/mockups/painel.html.
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Suspense } from "react";
import { sair } from "@/app/(acesso)/actions";
import { Button } from "@/components/ui/button";
import { textLinkClassName } from "@/components/ui/text-link";
import { mascararCnpj } from "@/lib/cnpj";
import { empresaAtual } from "@/lib/empresa";
import { cn } from "@/lib/utils";

type Secao = "painel" | "lancamentos" | "notas" | "das" | "importar";

// Telas que ainda não existem aparecem no menu, sem link, marcadas "em breve".
const ITENS: { rotulo: string; secao?: Secao; href?: string }[] = [
  { rotulo: "Painel", secao: "painel", href: "/painel" },
  { rotulo: "Lançamentos", secao: "lancamentos", href: "/lancamentos" },
  { rotulo: "Notas", secao: "notas", href: "/notas" },
  { rotulo: "DAS", secao: "das", href: "/das" },
  { rotulo: "Regras" },
];

const ITEM = "flex min-h-control-sm items-center justify-between rounded-md px-3";

export function AppShell({ ativa, children }: { ativa: Secao; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-surface">
      <nav
        aria-label="Navegação principal"
        className="flex flex-[1_1_220px] flex-col gap-7 border-r border-b border-border px-4 py-7"
      >
        <div className="px-3">
          <Logo />
        </div>

        <div className="flex flex-col gap-1">
          {ITENS.map((item) =>
            item.href ? (
              <Link
                key={item.rotulo}
                href={item.href}
                aria-current={item.secao === ativa ? "page" : undefined}
                className={cn(
                  ITEM,
                  "font-medium text-ink-muted",
                  "aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink",
                )}
              >
                {item.rotulo}
              </Link>
            ) : (
              <div key={item.rotulo} className={cn(ITEM, "font-medium text-ink-muted")}>
                <span>{item.rotulo}</span>
                <span className="text-caption">em breve</span>
              </div>
            ),
          )}
        </div>

        <Button asChild>
          <Link href="/importar" aria-current={ativa === "importar" ? "page" : undefined}>
            Importar arquivos
          </Link>
        </Button>

        <div className="mt-auto flex flex-col gap-3 px-3 text-caption text-ink-muted">
          {/* A empresa depende do usuário logado, lido na requisição; o menu aparece antes. */}
          <Suspense fallback={null}>
            <EmpresaNoMenu />
          </Suspense>
          {/* Sair é um formulário que chama a Server Action, como um POST /logout. */}
          <form action={sair}>
            <button type="submit" className={`cursor-pointer ${textLinkClassName}`}>
              Sair
            </button>
          </form>
        </div>
      </nav>

      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 p-8">{children}</main>
    </div>
  );
}

async function EmpresaNoMenu() {
  const empresa = await empresaAtual();
  if (!empresa) return null;

  return (
    <div>
      <div className="font-semibold text-ink">{empresa.nome}</div>
      <div>CNPJ {mascararCnpj(empresa.cnpj)}</div>
    </div>
  );
}

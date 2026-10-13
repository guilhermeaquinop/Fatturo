// Moldura das telas de uso diário: barra lateral com o menu e área de conteúdo fluida.
// Equivale ao layouts/app.blade.php do Laravel com a navegação. Mockup: docs/mockups/painel.html.
//
// Em telas largas a barra fica parada, com a altura da janela, e só o conteúdo rola: assim
// o perfil, as Configurações e o Sair ficam sempre à vista. No celular a barra empilha acima
// do conteúdo (flex-wrap) e rola junto com a página.
import Link from "next/link";
import { Suspense } from "react";
import { sair } from "@/app/(acesso)/actions";
import { Avatar, opcaoDeAvatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  ConfiguracoesIcon,
  DasIcon,
  ImportarIcon,
  LancamentosIcon,
  NotasIcon,
  PainelIcon,
  RegrasIcon,
  SairIcon,
} from "@/components/ui/icons";
import { mascararCnpj } from "@/lib/cnpj";
import { empresaAtual } from "@/lib/empresa";
import { usuarioAtual } from "@/lib/usuario";
import { cn } from "@/lib/utils";

type Secao = "painel" | "lancamentos" | "notas" | "das" | "importar" | "configuracoes";
type Icone = (props: { className?: string }) => React.ReactNode;

// Telas que ainda não existem aparecem no menu, sem link, marcadas "em breve".
const ITENS: { rotulo: string; icone: Icone; secao?: Secao; href?: string }[] = [
  { rotulo: "Painel", icone: PainelIcon, secao: "painel", href: "/painel" },
  { rotulo: "Lançamentos", icone: LancamentosIcon, secao: "lancamentos", href: "/lancamentos" },
  { rotulo: "Notas", icone: NotasIcon, secao: "notas", href: "/notas" },
  { rotulo: "DAS", icone: DasIcon, secao: "das", href: "/das" },
  { rotulo: "Regras", icone: RegrasIcon },
];

const ITEM = "flex min-h-control-sm items-center gap-3 rounded-md px-3 font-medium text-ink-muted";
const ITEM_ATIVO =
  "aria-[current=page]:bg-surface-tint aria-[current=page]:font-semibold aria-[current=page]:text-ink";

export function AppShell({ ativa, children }: { ativa: Secao; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-surface">
      <nav
        aria-label="Navegação principal"
        className={cn(
          "flex flex-[1_1_220px] flex-col gap-7 border-r border-b border-border px-4 py-7",
          // lg: barra e conteúdo lado a lado. A barra gruda no topo, ocupa a altura da janela
          // e, se o menu não couber, rola por dentro.
          "lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-b-0",
        )}
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
                className={cn(ITEM, ITEM_ATIVO)}
              >
                <item.icone className="flex-none" />
                {item.rotulo}
              </Link>
            ) : (
              <div key={item.rotulo} className={ITEM}>
                <item.icone className="flex-none" />
                <span className="flex-1">{item.rotulo}</span>
                <span className="text-caption font-normal">em breve</span>
              </div>
            ),
          )}
        </div>

        <Button asChild>
          <Link href="/importar" aria-current={ativa === "importar" ? "page" : undefined}>
            <ImportarIcon className="flex-none" />
            Importar arquivos
          </Link>
        </Button>

        <div className="mt-auto flex flex-col gap-1">
          {/* O perfil depende do usuário logado, lido na requisição; o menu aparece antes. */}
          <Suspense fallback={null}>
            <PerfilNoMenu />
          </Suspense>
          <Link
            href="/configuracoes"
            aria-current={ativa === "configuracoes" ? "page" : undefined}
            className={cn(ITEM, ITEM_ATIVO)}
          >
            <ConfiguracoesIcon className="flex-none" />
            Configurações
          </Link>
          {/* Sair é um formulário que chama a Server Action, como um POST /logout. */}
          <form action={sair}>
            <button type="submit" className={cn(ITEM, "w-full cursor-pointer")}>
              <SairIcon className="flex-none" />
              Sair
            </button>
          </form>
        </div>
      </nav>

      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 p-8">{children}</main>
    </div>
  );
}

/** Avatar, nome de quem está logado e a empresa. */
async function PerfilNoMenu() {
  const [usuario, empresa] = await Promise.all([usuarioAtual(), empresaAtual()]);

  return (
    // Nada é cortado: o nome quebra de linha ao lado do avatar, e a empresa e o CNPJ ficam
    // embaixo, usando a largura toda da barra.
    <div className="mb-2 flex flex-col gap-2.5 border-t border-divider px-3 pt-5">
      <div className="flex items-center gap-2.5">
        <Avatar opcao={opcaoDeAvatar(usuario.avatar)} />
        <div className="min-w-0 font-semibold break-words text-ink">{usuario.nome}</div>
      </div>
      {empresa ? (
        <div className="text-caption text-ink-muted">
          <div className="break-words">{empresa.nome}</div>
          <div className="whitespace-nowrap">{mascararCnpj(empresa.cnpj)}</div>
        </div>
      ) : null}
    </div>
  );
}

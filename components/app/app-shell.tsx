// Moldura das telas de uso diário. Equivale ao layouts/app.blade.php do Laravel com a navegação.
// Mockups: docs/mockups/painel.html (desktop) e docs/mockups/mobile/ (celular).
//
// A partir de 1024 px (lg): barra lateral parada, com a altura da janela, e só o conteúdo rola.
// O "Ocultar valores" fica ali como item do menu, junto de Configurações e Sair.
// Abaixo disso: barra superior fina (logo e olho, ou voltar nas telas internas) e barra
// inferior com Painel, Notas, Importar, DAS e Mais. O "Mais" abre uma folha com o perfil,
// Lançamentos, Regras, Configurações e Sair.
import Link from "next/link";
import { Suspense } from "react";
import { sair } from "@/app/(acesso)/actions";
import { MenuMais } from "@/components/app/menu-mais";
import { OcultarValores } from "@/components/app/ocultar-valores";
import { Avatar, opcaoDeAvatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
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
  VoltarIcon,
} from "@/components/ui/icons";
import { SheetClose } from "@/components/ui/sheet";
import { mascararCnpj } from "@/lib/cnpj";
import { empresaAtual } from "@/lib/empresa";
import { contarSemClassificacao } from "@/lib/lancamentos";
import { usuarioAtual } from "@/lib/usuario";
import { cn } from "@/lib/utils";

type Secao = "painel" | "lancamentos" | "notas" | "das" | "importar" | "configuracoes";
type Icone = (props: { className?: string; width?: number; height?: number }) => React.ReactNode;

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

// Barra inferior: ícone num indicador em pílula, rótulo embaixo. O ativo ganha surface-tint.
const ABA =
  "group flex min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 text-caption font-medium text-ink-muted aria-[current=page]:font-semibold aria-[current=page]:text-ink";
const INDICADOR =
  "flex h-8 w-14 items-center justify-center rounded-pill group-aria-[current=page]:bg-surface-tint";

// Botão só de ícone, com 44 px de área de toque.
const BOTAO_DE_ICONE =
  "inline-flex size-control-sm flex-none items-center justify-center rounded-pill text-ink hover:bg-surface-tint";

type AppShellProps = {
  ativa: Secao;
  /** Telas internas (guia do DAS, edição): no celular, a barra superior mostra "voltar". */
  voltar?: { href: string; titulo: string };
  children: React.ReactNode;
};

export function AppShell({ ativa, voltar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <BarraLateral ativa={ativa} />

      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior voltar={voltar} />
        <main
          className={cn(
            "mx-auto flex w-full max-w-content-narrow min-w-0 flex-col gap-4 px-4 pt-5",
            // A barra inferior é fixa: o fim do conteúdo precisa sobrar acima dela.
            "pb-[calc(var(--tabbar-height)+32px+env(safe-area-inset-bottom))] sm:gap-5 sm:pt-6",
            "lg:mx-0 lg:max-w-none lg:gap-5 lg:p-8",
          )}
        >
          {children}
        </main>
      </div>

      <BarraInferior ativa={ativa} />
    </div>
  );
}

/** Desktop (lg): logo e olho, menu, Importar, perfil, Configurações e Sair. */
function BarraLateral({ ativa }: { ativa: Secao }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 hidden h-screen w-sidebar flex-none flex-col gap-7 self-start overflow-y-auto border-r border-border px-4 py-7 lg:flex"
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
        <OcultarValores variante="item" className={cn(ITEM, "w-full cursor-pointer")} />
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
  );
}

/** Celular: logo e olho; nas telas internas, voltar, o nome da seção e o olho. */
function BarraSuperior({ voltar }: { voltar?: AppShellProps["voltar"] }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-topbar flex-none items-center gap-2 border-b border-border bg-surface pr-2 lg:hidden",
        voltar ? "pl-1" : "pl-4",
      )}
    >
      {voltar ? (
        <>
          <Link href={voltar.href} aria-label="Voltar" className={BOTAO_DE_ICONE}>
            <VoltarIcon width={22} height={22} />
          </Link>
          <span className="min-w-0 flex-1 truncate font-semibold">{voltar.titulo}</span>
        </>
      ) : (
        <>
          <Link href="/painel" aria-label="Fatturo: ir para o painel" className="flex h-control-sm items-center">
            <Logo className="h-[22px]" />
          </Link>
          <span className="flex-1" />
        </>
      )}
      <OcultarValores />
    </header>
  );
}

/** Celular: as quatro telas mais usadas a um toque, Importar no centro, e o Mais. */
function BarraInferior({ ativa }: { ativa: Secao }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 grid h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <Aba href="/painel" rotulo="Painel" icone={PainelIcon} ativa={ativa === "painel"} />
      <Aba href="/notas" rotulo="Notas" icone={NotasIcon} ativa={ativa === "notas"} />
      {/* Importar alimenta o resto: fica no centro e sempre em accent. */}
      <Link
        href="/importar"
        aria-current={ativa === "importar" ? "page" : undefined}
        className={cn(ABA, "font-semibold text-ink")}
      >
        <span
          className={cn(
            INDICADOR,
            "bg-accent group-aria-[current=page]:bg-accent group-aria-[current=page]:outline-2 group-aria-[current=page]:outline-offset-2 group-aria-[current=page]:outline-ink",
          )}
        >
          <ImportarIcon width={24} height={24} />
        </span>
        Importar
      </Link>
      <Aba href="/das" rotulo="DAS" icone={DasIcon} ativa={ativa === "das"} />
      <MenuMais
        ativo={ativa === "lancamentos" || ativa === "configuracoes"}
        classeDoItem={ABA}
        classeDoIndicador={INDICADOR}
      >
        <Suspense fallback={null}>
          <PerfilNoMais />
        </Suspense>
        <nav aria-label="Outras páginas" className="flex flex-col gap-1">
          <SheetClose asChild>
            <Link
              href="/lancamentos"
              aria-current={ativa === "lancamentos" ? "page" : undefined}
              className={cn(ITEM, ITEM_ATIVO, "text-ink")}
            >
              <LancamentosIcon width={20} height={20} className="flex-none" />
              <span className="flex-1">Lançamentos</span>
              <Suspense fallback={null}>
                <ContagemSemClassificacao />
              </Suspense>
            </Link>
          </SheetClose>
          <div className={ITEM}>
            <RegrasIcon width={20} height={20} className="flex-none" />
            <span className="flex-1">Regras</span>
            <span className="text-caption font-normal">em breve</span>
          </div>
          <SheetClose asChild>
            <Link
              href="/configuracoes"
              aria-current={ativa === "configuracoes" ? "page" : undefined}
              className={cn(ITEM, ITEM_ATIVO, "text-ink")}
            >
              <ConfiguracoesIcon width={20} height={20} className="flex-none" />
              Configurações
            </Link>
          </SheetClose>
          <hr className="my-2 border-divider" />
          <form action={sair}>
            <button type="submit" className={cn(ITEM, "w-full cursor-pointer text-ink")}>
              <SairIcon width={20} height={20} className="flex-none" />
              Sair
            </button>
          </form>
        </nav>
      </MenuMais>
    </nav>
  );
}

type AbaProps = { href: string; rotulo: string; icone: Icone; ativa: boolean };

/** Um item da barra inferior: ícone num indicador em pílula e o rótulo embaixo. */
function Aba({ href, rotulo, icone: Icone, ativa }: AbaProps) {
  return (
    <Link href={href} aria-current={ativa ? "page" : undefined} className={ABA}>
      <span className={INDICADOR}>
        <Icone width={24} height={24} />
      </span>
      {rotulo}
    </Link>
  );
}

/** Avatar, nome de quem está logado e a empresa, no pé da barra lateral. */
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

/** O mesmo perfil, no topo da folha "Mais" do celular. */
async function PerfilNoMais() {
  const [usuario, empresa] = await Promise.all([usuarioAtual(), empresaAtual()]);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-3">
      <Avatar opcao={opcaoDeAvatar(usuario.avatar)} className="size-10" />
      <div className="min-w-0">
        <div className="font-semibold break-words">{usuario.nome}</div>
        {empresa ? (
          <div className="text-caption text-ink-muted">
            <div className="break-words">{empresa.nome}</div>
            <div className="whitespace-nowrap">{mascararCnpj(empresa.cnpj)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Quantos lançamentos esperam classificação; nada quando não há nenhum. */
async function ContagemSemClassificacao() {
  const empresa = await empresaAtual();
  if (!empresa) return null;
  const quantidade = await contarSemClassificacao(empresa.id);
  if (quantidade === 0) return null;
  return <Badge aria-label={`${quantidade} sem classificação`}>{quantidade}</Badge>;
}

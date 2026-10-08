# Primeiro prompt para o Claude Code

Copie o texto abaixo na primeira sessão, com esta pasta aberta como projeto.

---

Leia o `CLAUDE.md` e todos os arquivos em `docs/`. Depois implemente a **Etapa 1 — Base** da seção "Ordem de implementação" da especificação:

1. Crie o projeto Next.js (App Router, TypeScript estrito, Tailwind, ESLint) nesta pasta, sem apagar `docs/` nem o `CLAUDE.md`.
2. Configure shadcn/ui e aplique os tokens do design system em `app/globals.css` e no `tailwind.config`, com a fonte Montserrat.
3. Configure o Supabase com `@supabase/ssr` (clients de servidor e navegador, `middleware.ts` protegendo as rotas do app) e a estrutura `supabase/migrations/`.
4. Crie as migrations de `usuario` e `parametro`, com RLS, e um seed com os parâmetros da especificação (marcados como "a confirmar").
5. Implemente as telas de login, cadastro, confirmação de e-mail, recuperar senha e nova senha, visualmente iguais a `docs/mockups/login.html` e `docs/mockups/cadastro.html`.
6. Depois do login, redirecione para uma página `/configuracao` provisória (a etapa 2 a implementa).
7. Configure Vitest e os scripts `test`, `lint` e `typecheck`.

Antes de começar, me mostre o plano e a lista de variáveis de ambiente que vou precisar criar no Supabase e na Vercel. Ao terminar, me diga como testar o fluxo completo localmente.

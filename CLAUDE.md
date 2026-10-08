# Fatturo

Painel gerencial para MEI e ME no Simples Nacional: importa XML de NFS-e e extratos (OFX/CSV), classifica lançamentos e mostra faturamento contra o limite do regime, projeção e DAS. A v1 é para uso próprio do autor, sem cobrança e sem IA.

## Documentos do projeto

Leia antes de qualquer tarefa:

- `docs/ESPECIFICACAO.md`: regras de negócio, telas, modelo de dados, importação, segurança, stack e ordem de implementação. É a fonte da verdade do produto.
- `docs/design-system/README.md`: guia visual (cores, tipografia, espaçamento, componentes, gráficos). Valores em `docs/design-system/tokens.json`.
- `docs/design-system/componentes.md` e `docs/design-system/components.css`: regras e referência visual de cada componente.
- `docs/mockups/*.html`: telas aprovadas (painel, login, cadastro, configuração inicial). Abra no navegador. A interface implementada deve ficar visualmente igual a elas.

Se algo não estiver definido nesses documentos, pergunte antes de inventar.

## Stack

- Next.js (App Router) + TypeScript estrito
- Supabase: Postgres, Auth via `@supabase/ssr`, Row Level Security
- Tailwind CSS + shadcn/ui, fonte Montserrat (next/font/google)
- Recharts para gráficos
- React Hook Form + Zod
- `fast-xml-parser`, Papa Parse e leitor de OFX próprio
- Vercel Cron + Resend para alertas
- Vitest para testes
- Deploy na Vercel

## Regras do código

- **Dinheiro em centavos** (`integer`/`number` inteiro). Nunca `float` para valores. Formatar com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` só na exibição.
- **Valores legais na tabela `parametro`** (limites, DAS do MEI), versionados por vigência. Nunca fixos no código.
- **RLS em todas as tabelas** com dados de empresa. Toda migration que cria tabela já cria as políticas. Nunca usar a service role key no navegador.
- **Arquivos lidos no navegador.** XML, OFX e CSV são processados no client; só os registros extraídos vão ao servidor.
- **Validação com Zod** no client e no servidor, com o mesmo esquema.
- **Migrations** em `supabase/migrations/`. Gere os tipos do banco após cada migration (`supabase gen types`).
- **Datas** em `date` no banco e fuso `America/Sao_Paulo` na exibição.
- **Testes obrigatórios** para regras de cálculo (acumulado, projeção, limite proporcional, deduplicação) e para os leitores de arquivo.
- Textos da interface em português do Brasil, conforme a seção Voz do design system.

## Regras visuais

- Use apenas os tokens de `docs/design-system/tokens.json`, expostos como variáveis CSS em `app/globals.css` e ao Tailwind no bloco `@theme` do mesmo arquivo (o Tailwind 4 não usa `tailwind.config`; o trecho do README do design system é a versão antiga desse mapeamento). Ao criar um token novo de tamanho de fonte, declare-o também em `lib/utils.ts`.
- Nenhuma cor, raio ou tamanho de fonte fora dos tokens. Sem sombras. Sem bordas verdes.
- Botões em pílula; texto sobre o verde-limão (`accent`) é sempre `ink`.
- Estados (alerta, informação, erro) sempre com ícone e texto, nunca só cor.
- Componentes do shadcn/ui devem ser ajustados aos tokens, não usados com o tema padrão.

## Como trabalhar

- O autor vem de PHP/Laravel e está aprendendo Next.js. Em cada arquivo novo, adicione um comentário curto no topo dizendo o papel do arquivo e a peça equivalente no Laravel (ex.: `// Server Action — equivale a um método de Controller`). A tabela de equivalências está na seção Stack da especificação.
- Implemente uma etapa da "Ordem de implementação" por vez. Ao terminar, liste o que foi feito, como testar manualmente e o que ficou pendente.
- Antes de mudanças grandes (nova tabela, nova dependência, mudança de estrutura), explique o plano e espere confirmação.
- Comandos: `npm run dev`, `npm run test`, `npm run lint`, `npm run typecheck`. Rode testes, lint e typecheck antes de dar uma etapa como concluída. Banco local: `npm run db:start`, `npm run db:reset` e, após cada migration, `npm run db:types`.

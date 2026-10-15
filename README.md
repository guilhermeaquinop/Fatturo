# Fatturo
Painel gerencial para MEI e ME no Simples Nacional. Especificação em `docs/ESPECIFICACAO.md`.

## Rodando localmente

Requisitos: Node 24 e Docker em execução.

```bash
npm install
npm run db:start        # sobe o Supabase local e aplica as migrations
cp .env.example .env.local   # preencha a Publishable key mostrada pelo comando acima
npm run dev             # http://localhost:3000
```

Os e-mails de confirmação e de recuperação de senha caem em http://127.0.0.1:54324 (Mailpit).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run test` | Testes (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:start` / `db:stop` | Sobe e derruba o Supabase local. Os contêineres não reiniciam sozinhos: só sobem com `db:start` |
| `npm run db:reset` | Recria o banco local a partir das migrations, mantendo o reinício automático desligado. Para aplicar só as migrations novas sem apagar os dados: `npx supabase migration up` |
| `npm run db:types` | Regenera `lib/supabase/database.types.ts` |

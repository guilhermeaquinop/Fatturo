<!-- Título do PR no padrão Conventional Commits: "feat: descrição curta em português" -->

## O que muda

<!-- Uma ou duas frases: o que este PR entrega e por quê. -->

## Etapa da especificação

<!-- Etapa da "Ordem de implementação" em docs/ESPECIFICACAO.md, ou "fora das etapas" (correção, manutenção). -->

## Mudanças

<!-- Lista curta por área. Apague as que não se aplicam. -->

- **Telas:**
- **Banco (migrations e RLS):**
- **Regras de negócio:**
- **Configuração e dependências:**

## Como testar

<!-- Passo a passo para conferir manualmente, do zero. -->

1.

## Checklist

- [ ] `npm run test`, `npm run lint` e `npm run typecheck` passam
- [ ] Interface usa apenas tokens do design system e confere com o mockup
- [ ] Toda tabela nova tem RLS e políticas na mesma migration
- [ ] Tipos do banco regenerados (`npm run db:types`) após migration
- [ ] Valores em centavos; nenhum valor legal fixo no código
- [ ] Regras de cálculo e leitores de arquivo novos têm teste
- [ ] Documentação atualizada (`docs/`, `CLAUDE.md`, `README.md`) quando o comportamento mudou

## Pendências e decisões em aberto

<!-- O que ficou para depois e o que precisa de decisão. "Nenhuma" se não houver. -->

## Capturas de tela

<!-- Para mudanças visuais: antes e depois, ou tela ao lado do mockup. -->

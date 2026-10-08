# Fatturo

Fatturo é um painel gerencial para MEI e ME no Simples Nacional: faturamento, limite do regime e DAS num lugar só. O visual é claro, calmo e numérico. Muito branco, linhas cinza finas, um verde-limão que aparece pouco e um verde-petróleo escuro que carrega o texto.

Este guia vem do mockup do painel e das telas de acesso. Quando o código e este guia divergirem, o guia vale.

## Voz

- Português do Brasil, frases curtas, verbo no começo dos botões: "Importar arquivos", "Marcar como pago", "Criar conta".
- Números sempre em reais com separador brasileiro: `R$ 58.420`, `R$ 86,05`. Datas `dd/mm` dentro do ano corrente, `dd/mm/aaaa` fora dele.
- O app informa e alerta; não dá conselho fiscal. Nada de exclamação, emoji ou urgência artificial.
- Dados de exemplo aparecem marcados como exemplo.

## Cores

A regra de proporção: **branco domina, ink escreve, accent aparece em no máximo dois lugares por tela.**

| Papel | Token | Onde |
| --- | --- | --- |
| Fundo | `surface` | Página, cartões, campos, barra lateral |
| Fundo de apoio | `surface-muted` | Atrás de um cartão central, nunca dentro dele |
| Preenchimento suave | `surface-tint` | Item ativo, chips, trilhos, área de gráfico |
| Preenchimento forte | `surface-tint-strong` | Badges, DAS pago, zona de projeção |
| Texto | `ink`, `ink-muted` | Principal e secundário |
| Destaque | `accent` | Botão primário e barra de limite. Texto sobre ele é `ink` |
| Gráfico | `accent-strong`, `brand-deep` | Primeira e segunda série |
| Link | `link` | Links de texto |
| Linhas | `border`, `divider`, `border-dashed` | Cartões, listas, estados futuros |
| Borda de campo | `border-control` | Campos, selects e checkboxes |

### Estados

Três famílias em tons fechados, com o mesmo peso do verde-petróleo: âmbar-oliva para alerta, azul-petróleo para informação e tijolo para erro. Cada uma tem três tokens.

| Estado | Fundo | Texto e ícone | Sólido (bordas, marcadores) | Quando |
| --- | --- | --- | --- | --- |
| Alerta | `warning-surface` | `warning-ink` | `warning-solid` | Faixas de 70% e 90% do limite, DAS vencendo |
| Informação | `info-surface` | `info-ink` | `info-solid` | Dicas, resumo de importação |
| Erro | `error-surface` | `error-ink` | `error-solid` | Limite ultrapassado, DAS vencido, falha de leitura, campo inválido |

Sucesso não tem família própria: usa `surface-tint` com `accent-strong`. Estados sempre levam ícone e texto, nunca só cor.

Não fazer:

- Bordas verdes em cartões ou campos. Cartões usam `border`; campos, `border-control`.
- Texto branco sobre `accent`.
- `accent` como cor de texto ou de linha fina: ele some no branco. Para traços use `accent-strong`.
- Verdes saturados fora desta lista.

## Tipografia

Uma família só: **Montserrat** (Google Fonts, pesos 400, 500, 600 e 700). Hierarquia por tamanho e peso, nunca por cor.

- `display` (52/700): um número por tela, o principal.
- `page-title` (26/700) e `section-title` (16/600) para títulos.
- `metric` (22/600) para valores de indicador.
- `body` (14/400), `body-strong` (14/600), `label` (13/600), `caption` (12/400) para o resto.
- `wordmark-lg` (20/700) e `lead` (15/400) só no painel lateral das telas de acesso.
- Números usam `font-variant-numeric: tabular-nums`, para alinhar em colunas.

## Espaçamento e layout

- Base de 4px. Cartões têm padding `space-6`; o cartão de destaque, `space-7`.
- Entre cartões, `space-5`. A área principal tem padding `space-8`.
- O painel é uma barra lateral (`sidebar-width`) e uma área de conteúdo fluida. Cartões ficam em linhas `flex-wrap` com proporção 3:2 (gráfico largo + cartão estreito).
- No celular, a barra lateral empilha acima do conteúdo e as linhas de cartões viram uma coluna. Margem lateral mínima de `space-4`.
- Telas de acesso: painel `ink` à esquerda, formulário de até 380px à direita. Empilham no celular.

## Formas

- Botões, chips, badges e barras: `radius-pill`.
- Cartões: `radius-xl`. Campos e itens de menu: `radius-md`. Cartões de opção: `radius-lg`. Células do DAS: `radius-sm`.
- Sem sombras. Separação por borda fina ou por espaço.

## Componentes

Os componentes estão nesta página com exemplo ao vivo e regras de uso. As classes `ft-*` de `components/bundle.css` são a referência visual; no app, eles são construídos com Tailwind e shadcn/ui usando os mesmos tokens.

- **Ações:** Button, Badge
- **Status:** Alert
- **Formulários:** TextField, OptionCard, Stepper
- **Navegação:** NavItem
- **Dados:** Card, Metric, LimitBar, ListRow, DasStrip

## Gráficos

- Linha principal (faturamento) em `accent-strong`, 3px, pontas arredondadas, com área `surface-tint` por baixo.
- Segunda série (DAS pago) em `brand-deep`, 3px.
- Projeção: mesma cor da série, pontilhada (traço 2, intervalo 7).
- Limite: linha tracejada fina em `ink`, com rótulo do valor.
- Eixos e rótulos em `caption`, cor `ink-muted`. Sem grade pesada; só a linha de base em `border`.
- O valor atual ganha um marcador circular branco com borda `accent-strong`.

## Acessibilidade

- Texto respeita 4,5:1: `ink-muted` dá 5,5:1 sobre branco; `link` dá 5,3:1.
- `accent-strong` (3,2:1) só para formas e linhas, nunca texto.
- Alvos de toque têm pelo menos `control-sm` (44px).
- Foco visível: contorno de 2px em `accent-strong`, afastado 2px do elemento.
- Campos usam `border-control` (3,2:1 contra o branco), o mínimo para controles de formulário.
- Textos de estado dão pelo menos 6,9:1 sobre o próprio fundo; os tokens sólidos dão pelo menos 3,6:1 sobre o branco.
- Informação e erro têm claridade parecida; por isso os ícones (i e x) são obrigatórios.

## Usando no código (Next.js + Tailwind)

Os tokens viram variáveis CSS em `app/globals.css` e são expostos ao Tailwind:

```js
// tailwind.config.ts (trecho)
theme: {
  extend: {
    colors: {
      surface: 'var(--surface)', 'surface-muted': 'var(--surface-muted)',
      'surface-tint': 'var(--surface-tint)', 'surface-tint-strong': 'var(--surface-tint-strong)',
      ink: 'var(--ink)', 'ink-muted': 'var(--ink-muted)',
      accent: 'var(--accent)', 'accent-strong': 'var(--accent-strong)',
      'brand-deep': 'var(--brand-deep)', link: 'var(--link)',
      border: 'var(--border)', divider: 'var(--divider)', 'border-control': 'var(--border-control)',
      warning: { surface: 'var(--warning-surface)', ink: 'var(--warning-ink)', solid: 'var(--warning-solid)' },
      info: { surface: 'var(--info-surface)', ink: 'var(--info-ink)', solid: 'var(--info-solid)' },
      error: { surface: 'var(--error-surface)', ink: 'var(--error-ink)', solid: 'var(--error-solid)' },
    },
    borderRadius: { sm: '6px', md: '10px', lg: '12px', xl: '16px', pill: '999px' },
    fontFamily: { sans: ['Montserrat', 'system-ui', 'sans-serif'] },
  },
}
```

Peça ao Claude Code para seguir este guia e para usar apenas os tokens listados aqui.

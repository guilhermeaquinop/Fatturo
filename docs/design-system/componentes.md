# Componentes do Fatturo

Regras de cada componente. A referência visual está em `components.css` (classes `ft-*`); no app, construa com Tailwind e shadcn/ui usando os mesmos tokens.

## Button

Botão de ação, sempre em formato pílula, com verbo no início do texto.

| Variante | Classe | Quando |
| --- | --- | --- |
| Primário | `ft-btn--primary` | A ação principal da tela. Um por área visível. Fundo `accent`, texto `ink`. |
| Secundário | `ft-btn--secondary` | Ações de apoio: Voltar, Vincular, Marcar como pago. |
| Tint | `ft-btn--tint` | Ação positiva repetida em listas, como "Receita" nas pendências. |

- Altura `control-sm` (44px) no app; `control-lg` (48px) com `ft-btn--lg` em formulários.
- Nunca texto branco sobre `accent`. Nunca borda verde.
- Navegação que parece botão usa `<a>` com as mesmas classes.

Marcação de referência:

```html
<div class="ft-row-wrap">
<button type="button" class="ft-btn ft-btn--primary">Importar arquivos</button>
<button type="button" class="ft-btn ft-btn--secondary">Marcar como pago</button>
<button type="button" class="ft-btn ft-btn--tint">Receita</button>
<button type="button" class="ft-btn ft-btn--primary ft-btn--lg">Criar conta</button>
<a href="#" class="ft-link">Esqueci minha senha</a>
</div>
```

## Badge

Contador ou estado curto. O badge é numérico (pendências no menu); o chip é uma frase curta de estado.

- Badge: `ft-badge`, fundo `surface-tint-strong`, 12px/600.
- Chip: `ft-chip`, fundo `surface-tint`, 14px/600. Ex.: "72% do limite utilizado".
- Texto sempre `ink`. Sem ícones de alerta coloridos enquanto não houver token de aviso.

Marcação de referência:

```html
<div class="ft-row-wrap">
<span class="ft-badge">12</span>
<span class="ft-chip">72% do limite utilizado</span>
</div>
```

## Alert

Mensagem de estado com ícone, título curto e uma frase que diz o que fazer.

| Tipo | Classe | Quando |
| --- | --- | --- |
| Alerta | `ft-alert--warning` | Faixa do limite atingida (70%, 90%), DAS vencendo em até 5 dias, projeção acima do limite. |
| Informação | `ft-alert--info` | Dicas, resumo de uma importação, mudanças de enquadramento. |
| Erro | `ft-alert--error` | Limite ultrapassado, DAS vencido, arquivo que não pôde ser lido. |

- Fundo `*-surface`, texto e ícone `*-ink`. Os tipos se diferenciam também pelo ícone (triângulo, i, x), nunca só pela cor.
- Sucesso não tem tipo próprio: usa `surface-tint` com ícone de check em `accent-strong`.
- Em linha, o alerta vira chip: `ft-chip--warning` ou `ft-chip--error` com o mesmo ícone.
- Uma frase, sem exclamação: "Você passou de 70% do limite anual."

Marcação de referência:

```html
<div class="ft-stack" style="max-width:560px;gap:12px">
<div class="ft-alert ft-alert--warning" role="status"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2.5 16.5 15h-15L9 2.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M9 7.5v3.5M9 13v.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg><div><span class="ft-alert__title">72% do limite utilizado</span>No ritmo atual, o faturamento chega a 93% do limite em dezembro.</div></div>
<div class="ft-alert ft-alert--info" role="status"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"></circle><path d="M9 8.2V12.5M9 5.6v.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg><div><span class="ft-alert__title">Importação concluída</span>48 lançamentos novos, 3 duplicados ignorados.</div></div>
<div class="ft-alert ft-alert--error" role="alert"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"></circle><path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg><div><span class="ft-alert__title">DAS de setembro vencido</span>Marque como pago se já quitou a guia.</div></div>
<div class="ft-row-wrap"><span class="ft-chip ft-chip--warning"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 2.5 16.5 15h-15L9 2.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M9 7.5v3.5M9 13v.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>72% do limite</span><span class="ft-chip ft-chip--error"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"></circle><path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>Limite ultrapassado</span></div>
</div>
```

## TextField

Campo com rótulo acima, campo de 48px e dica opcional abaixo. Vale também para `<select>`.

- Estrutura: `ft-field` > `ft-label` + `ft-input` + `ft-hint`.
- Rótulo sempre visível (13px/600); placeholder só como exemplo de formato ("dd/mm/aaaa", "R$ 0,00").
- Borda `border-control` (3,2:1), raio `radius-md`. Foco: contorno `accent-strong`.
- Erro: `aria-invalid="true"` deixa a borda em 2px `error-solid`; a dica dá lugar a `ft-error`, com ícone e uma frase dizendo como corrigir, ligada ao campo por `aria-describedby`.

Marcação de referência:

```html
<div class="ft-stack" style="max-width:380px">
<div class="ft-field"><label class="ft-label" for="e">E-mail</label><input id="e" class="ft-input" type="email" placeholder="voce@empresa.com.br"></div>
<div class="ft-field"><label class="ft-label" for="s">Senha</label><input id="s" class="ft-input" type="password"><span class="ft-hint">Mínimo de 10 caracteres.</span></div>
<div class="ft-field"><label class="ft-label" for="c">CNPJ</label><input id="c" class="ft-input" type="text" value="12.345.678/0001-00" aria-invalid="true" aria-describedby="c-err"><span id="c-err" class="ft-error"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.6"></circle><path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>CNPJ inválido. Confira os dígitos.</span></div>
</div>
```

## OptionCard

Escolha entre poucas opções com explicação curta, como o porte da empresa (MEI ou ME).

- `<button aria-pressed>` com `ft-option`; o selecionado ganha fundo `surface-tint` e borda de 2px `accent-strong`.
- Título 14px/700 e uma linha de apoio em `caption`.
- Até 3 opções lado a lado; empilham no celular.

Marcação de referência:

```html
<div class="ft-row-wrap" style="max-width:520px">
<button type="button" class="ft-option" aria-pressed="false"><span class="ft-option__title">MEI</span><span class="ft-option__meta">Até R$ 81 mil por ano</span></button>
<button type="button" class="ft-option" aria-pressed="true"><span class="ft-option__title">ME</span><span class="ft-option__meta">Até R$ 360 mil por ano</span></button>
</div>
```

## Stepper

Mostra em que passo de um fluxo curto o usuário está (configuração inicial).

- Passo concluído: círculo `accent-strong` com número branco.
- Passo atual: círculo `ink`, rótulo em 600.
- Passo futuro: círculo com borda `border-dashed`, rótulo `ink-muted`.
- No máximo 4 passos.

Marcação de referência:

```html
<ol class="ft-stepper" aria-label="Etapas">
<li class="ft-step ft-step--done"><span class="ft-step__dot">1</span><span>Empresa</span></li>
<li class="ft-step ft-step--current"><span class="ft-step__dot">2</span><span>Enquadramento</span></li>
<li class="ft-step"><span class="ft-step__dot">3</span><span>Ponto de partida</span></li>
</ol>
```

## NavItem

Item da barra lateral do app.

- `ft-nav__item`, altura mínima 44px, raio `radius-md`.
- Ativo (`aria-current="page"`): fundo `surface-tint`, texto `ink` 600. Inativo: `ink-muted` 500.
- Pode levar um Badge à direita com a contagem de pendências.
- A barra lateral é branca com borda direita `border`; o botão primário de importar fica logo abaixo dos itens.

Marcação de referência:

```html
<nav class="ft-nav" style="max-width:220px" aria-label="Exemplo">
<a href="#" class="ft-nav__item" aria-current="page">Painel</a>
<a href="#" class="ft-nav__item"><span>Lançamentos</span><span class="ft-badge">12</span></a>
<a href="#" class="ft-nav__item">Notas</a>
<a href="#" class="ft-nav__item">DAS</a>
</nav>
```

## Card

Contêiner de cada bloco do painel.

- `ft-card`: fundo `surface`, borda `border`, raio `radius-xl`, padding `space-6`, sem sombra.
- O cartão de destaque (limite) usa `ft-card--hero` (padding `space-7`).
- Título `section-title` no topo; ação secundária (link "Ver todas") alinhada à direita do título.
- Cartões se organizam em linhas com proporção 3:2 e gap `space-5`.

Marcação de referência:

```html
<section class="ft-card" style="max-width:420px">
<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 class="ft-card__title">Origem do faturamento</h2><a href="#" class="ft-link">Ver todas</a></div>
<div class="ft-list">
<div class="ft-listrow"><span>Studio Aurora Ltda</span><span style="font-weight:600">30%</span></div>
<div class="ft-listrow"><span>Pessoas físicas (sem nota)</span><span style="font-weight:600">22%</span></div>
</div>
</section>
```

## Metric

Par rótulo e valor de um indicador.

- Rótulo em `ink-muted` 14px; valor em `metric` (22px/600).
- Em linha com outros indicadores via `flex-wrap`, cada um com base de 180px.
- Valores monetários sempre formatados em reais.

Marcação de referência:

```html
<div class="ft-row-wrap" style="gap:20px 48px">
<div><div class="ft-metric__label">Disponível</div><div class="ft-metric__value">R$ 22.580</div></div>
<div><div class="ft-metric__label">Projeção até dezembro</div><div class="ft-metric__value">R$ 75.467</div></div>
<div><div class="ft-metric__label">Resultado no ano</div><div class="ft-metric__value">R$ 38.450</div></div>
</div>
```

## LimitBar

Barra do faturamento acumulado contra o limite anual. É a assinatura visual do Fatturo.

- Trilho de 10px em `surface-tint`; zona de projeção em `surface-tint-strong`; preenchimento atual em `accent`, todos em pílula.
- Marcadores abaixo: "hoje" em 600 sob o fim do preenchimento; "projeção dez." em `ink-muted` sob o fim da projeção.
- A barra nunca passa de 100% da largura; acima do limite, ela fica cheia e o chip informa o excesso.

Marcação de referência:

```html
<div class="ft-limit" style="max-width:560px">
<div class="ft-limit__track"><div class="ft-limit__projection" style="width:93%"></div><div class="ft-limit__fill" style="width:72%"></div></div>
<div class="ft-limit__mark" style="left:72%;font-weight:600">hoje</div>
<div class="ft-limit__mark" style="left:93%;color:var(--ink-muted)">projeção dez.</div>
</div>
```

## ListRow

Linha de lista com título, metadados e ações, como as pendências de classificação.

- `ft-listrow`: título 600, metadados em `caption` `ink-muted`, separada por `divider`.
- Ações à direita: Button tint para a escolha positiva, secundário para a alternativa.
- Em telas estreitas, as ações descem para baixo do texto.

Marcação de referência:

```html
<div class="ft-list" style="max-width:520px">
<div class="ft-listrow"><div><div class="ft-listrow__title">Marcos A. Ribeiro</div><div class="ft-listrow__meta">Pix recebido · 05/10 · R$ 350,00</div></div><div class="ft-row-wrap" style="gap:8px"><button type="button" class="ft-btn ft-btn--tint">Receita</button><button type="button" class="ft-btn ft-btn--secondary">Pessoal</button></div></div>
<div class="ft-listrow"><div><div class="ft-listrow__title">NFS-e nº 48 · Clínica Bem Viver</div><div class="ft-listrow__meta">Nota sem recebimento · 28/09 · R$ 1.200,00</div></div><button type="button" class="ft-btn ft-btn--secondary">Vincular</button></div>
</div>
```

## DasStrip

Os 12 meses do DAS do ano numa faixa, um quadrado por mês.

- Pago: fundo `surface-tint-strong`. Pendente: borda de 2px `ink`. A vencer: borda tracejada `border-dashed`, letra `ink-muted`.
- Os estados diferem por forma (preenchido, contorno forte, tracejado), não só por cor.
- Abaixo, uma linha de resumo em `caption`: "9 pagos · outubro pendente". O conjunto leva `aria-label` com a situação por extenso.

Marcação de referência:

```html
<div style="max-width:360px" class="ft-stack">
<div class="ft-das" aria-label="Janeiro a setembro pagos, outubro pendente, novembro e dezembro a vencer">
<div class="ft-das__cell ft-das__cell--paid">J</div><div class="ft-das__cell ft-das__cell--paid">F</div><div class="ft-das__cell ft-das__cell--paid">M</div><div class="ft-das__cell ft-das__cell--paid">A</div><div class="ft-das__cell ft-das__cell--paid">M</div><div class="ft-das__cell ft-das__cell--paid">J</div><div class="ft-das__cell ft-das__cell--paid">J</div><div class="ft-das__cell ft-das__cell--paid">A</div><div class="ft-das__cell ft-das__cell--paid">S</div><div class="ft-das__cell ft-das__cell--pending">O</div><div class="ft-das__cell ft-das__cell--future">N</div><div class="ft-das__cell ft-das__cell--future">D</div>
</div>
<div class="ft-hint">9 pagos · outubro pendente</div>
</div>
```

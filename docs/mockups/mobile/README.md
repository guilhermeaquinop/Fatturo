# Fatturo no celular: decisões

Proposta aprovada em outubro de 2026 para as telas logadas abaixo de 1024 px. Os mockups em HTML desta pasta (`index.html` e uma página por tela) usam `fatturo-mobile.css` e `fatturo-mobile.js` por cima de `components.css`. Abra `index.html` no navegador: os aparelhos são as páginas reais, e dá para tocar no olho, abrir o "Mais", os filtros e as seções.

Estados diretos: `painel.html#ocultos`, `painel.html#mais`, `notas.html#filtros`, `lancamentos.html#selecao`.

## Navegação

- Barra superior fixa (56 px): logo e botão de ocultar valores. Em telas internas (guia do DAS, edição): voltar, nome da seção e olho.
- Barra inferior (64 px mais a área segura): Painel · Notas · **Importar** (centro, em `accent`) · DAS · Mais.
- "Mais" abre uma folha de baixo: perfil, Lançamentos (com contador de sem classificação), Regras (em breve), Configurações, Sair. A aba Mais fica ativa em Lançamentos e Configurações.
- Em Lançamentos, com linhas marcadas, a barra de seleção substitui a barra inferior.
- A partir de 1024 px a barra lateral continua. O mockup põe o olho ao lado da logo; na implementação ele virou item do menu (veja abaixo).
- Importar em `accent` conta como um dos dois usos de `accent` por tela; ações de apoio passam a `tint` ou secundário.

## Ocultar valores

- Botão de olho; o ícone mostra o estado (aberto = visíveis, riscado = ocultos); `aria-pressed`.
- Esconde todo valor em reais como `R$ •••••`, inclusive dentro de frases e nos rótulos do gráfico. Percentuais, barra de limite, quantidades e datas continuam. Campos em edição não escondem.
- Guarda no aparelho (`localStorage`, chave `fatturo:valores`, atributo `data-valores="ocultos"` no html).
- No app: componente `<Valor>` (`components/valor.tsx`) com o texto real escondido por CSS, e um script no `<head>` para não piscar. O mockup chama o mesmo papel de `Money`.

## Telas (o que muda)

- **Painel**: anos em pílulas de largura igual; número em `display-sm` (40 px) abaixo de 640 px; métricas 2×2; cartão do DAS sobe para depois dos alertas, com chip de erro na guia vencida; gráfico sem rolagem (eixo jan/abr/jul/out/dez, projeção e DAS pago na linha abaixo).
- **DAS**: fita em uma linha; tabela vira lista em grupos Em aberto / A vencer / Pagas; linha inteira abre a guia; situação com forma própria (Paga, Pendente, A vencer, Vencida com ícone).
- **Guia do DAS**: voltar no topo; Salvar e Cancelar empilhados em largura total; teclado numérico.
- **Notas**: filtros numa folha de baixo; situação em pílulas; lista no lugar da tabela; toque abre folha com detalhes e "Marcar como cancelada"; "Importar notas" sai do topo no celular.
- **Importar**: sem "arrastar" no celular; botão primário largo; resultado por arquivo; CSV desconhecido mostra "Indicar colunas".
- **Lançamentos**: setas de mês de 44 px; categorias numa linha com rolagem lateral; lista com caixa de seleção; barra de seleção no lugar da barra inferior.
- **Configurações**: seções recolhíveis em dois grupos (Você e a empresa; Conta), uma aberta por vez, resumo mostra o valor atual; `#alertas` abre a seção.

## Tokens novos

`display-sm` 40px/1.15/700 · `scrim` rgba(22,48,43,.45) · `topbar-height` 56px · `tabbar-height` 64px · `content-max-narrow` 720px.

## Componentes novos

TopBar, TabBar, Sheet (Dialog do radix-ui), Pills, Status (variantes de Badge), RowButton, SelectionBar, Accordion, Valor.

## Diferenças combinadas na implementação

- As pílulas de ano continuam sendo links (`?ano=2025`), para o voltar do navegador e os links diretos funcionarem.
- Os campos de data continuam com o seletor nativo do celular.
- O ponto de troca do celular para o tablet é o `sm` do Tailwind (640 px), não 600 px.
- No desktop, o olho não fica ao lado da logo: é um item do menu, com o texto "Ocultar valores" (ou "Mostrar valores"), acima de Configurações. Decisão do autor.

## Sugestões aceitas pelo autor

- Login mais curto no celular: o painel escuro fica só com a logo e o título.
- DAS vencido como erro também no alerta da tela DAS, como o chip do painel.
- Manifest para abrir pela tela inicial como app.
- Esconder Pendências no celular enquanto estiver "em breve".

Ficou de fora: o estado próprio de "vencido" na fita do DAS.

## Correção no design system de referência

Em `components.css`, `.ft-chip` vem depois de `.ft-chip--warning/--error` e apaga o fundo do estado. O app não tem o problema (`components/ui/chip.tsx`); só a referência em CSS.

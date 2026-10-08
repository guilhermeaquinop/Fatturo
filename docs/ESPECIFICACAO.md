# Fatturo — Especificação funcional v1

Versão de 08/10/2026.

## Visão geral

O Fatturo é um painel gerencial web para pequenas empresas acompanharem faturamento, despesas, limite do regime e guias do DAS a partir de arquivos que o próprio usuário importa.

- **Público:** MEI e ME optante pelo Simples Nacional. Uma empresa por conta.
- **Objetivo da v1:** uso próprio do autor (uma ME), sem cobrança, sem IA e sem integração com APIs do governo ou de bancos.
- **Entradas:** XML de NFS-e, extrato bancário em OFX ou CSV e lançamentos manuais.
- **Saídas:** painel com acumulado do ano contra o limite, projeção, origem do faturamento, pendências de classificação e calendário do DAS, além de alertas por e-mail.

O Fatturo informa e alerta; não substitui o contador nem gera guias ou declarações.

## Escopo da v1

A v1 cobre o ciclo importar → classificar → acompanhar, com login convencional e uma empresa por conta.

| Entra na v1 | Fica para depois |
| --- | --- |
| Cadastro, login e recuperação de senha por e-mail | Login com Google ou outro provedor |
| Configuração da empresa: porte (MEI ou ME), regime, anexo, data de abertura | Várias empresas por conta (perfil contador) |
| Importação de XML de NFS-e, OFX e CSV | Leitura de PDF e fotos (exige IA) |
| Classificação manual com regras por remetente ou descrição | Classificação automática por IA |
| Painel, lançamentos, notas, DAS, regras e configurações | Integração com a API da NFS-e Nacional e Open Finance |
| DAS do MEI com valor fixo; DAS da ME com valor lançado pelo usuário | Cálculo automático do DAS da ME pelas tabelas do Simples |
| Alertas por e-mail (faixas do limite e vencimento do DAS) | Cobrança, planos e cotas de uso |

## Regras de negócio

Os valores legais ficam numa tabela de parâmetros, nunca fixos no código, porque mudam por lei. Os valores abaixo são aproximados e precisam ser confirmados com o contador antes de entrar no sistema.

| Parâmetro | MEI | ME no Simples |
| --- | --- | --- |
| Limite anual de faturamento | R$ 81.000 | R$ 360.000 (acima disso passa a EPP, que segue no Simples até R$ 4,8 milhões) |
| Limite no ano de abertura | Proporcional: R$ 6.750 por mês de atividade | Proporcional aos meses de atividade |
| DAS | Valor fixo mensal por tipo de atividade | Varia com o faturamento; na v1, lançado pelo usuário |
| Vencimento do DAS | Dia 20 do mês seguinte | Dia 20 do mês seguinte |

### Faturamento

1. Conta como faturamento todo lançamento classificado como **receita do negócio**, tenha ou não nota.
2. Lançamentos **pessoais** e **transferências entre contas** não entram em nenhum indicador.
3. O acumulado considera o ano-calendário, pela data de competência do lançamento.
4. Para ME, o painel também mostra a **receita dos últimos 12 meses** (RBT12), que define a faixa de alíquota do Simples.

### Projeção e alertas

- Projeção até dezembro = acumulado até o último mês fechado + média mensal dos meses fechados × meses restantes.
- Alertas nas faixas de 70%, 90% e 100% do limite, configuráveis. Cada faixa dispara uma vez por ano.
- Alerta extra quando a projeção passa do limite, mesmo que o acumulado ainda não tenha passado.
- Lembrete do DAS 5 dias antes do vencimento, enquanto a guia não estiver marcada como paga.

### Nota e recebimento

Uma nota e o Pix ou TED que a pagou são a mesma receita e contam uma vez só.

- O sistema sugere o vínculo quando valor é igual e a data do crédito fica entre 0 e 45 dias após a emissão; o usuário confirma.
- Nota sem recebimento vinculado conta pela data de emissão; quando vinculada, prevalece a data da nota.
- Recebimento sem nota conta pela data do crédito.

### Classificação

- Categorias fixas na v1: receita do negócio, despesa do negócio, pessoal, transferência entre contas, imposto (DAS).
- Ao classificar, o usuário pode criar uma regra: "lançamentos deste remetente (ou com esta descrição) são X".
- Regras se aplicam aos lançamentos importados depois; aplicar às pendências antigas é uma ação explícita.

## Telas

São 11 telas: 4 de acesso e configuração, 6 de uso diário e 1 de conta. O usuário sem empresa configurada é sempre levado à configuração inicial. Os mockups de referência estão em `docs/mockups/`.

### Acesso

**Login.** E-mail e senha. Links para cadastro e recuperação de senha. Após 5 tentativas erradas, bloqueio de 15 minutos. Mensagem de erro genérica, sem dizer se o e-mail existe. Mockup: `login.html`.

**Cadastro.** Nome, e-mail, senha (mínimo 10 caracteres) e confirmação, aceite dos termos e da política de privacidade. Envia e-mail de confirmação; o login só funciona depois de confirmar. Mockup: `cadastro.html`.

**Recuperar senha.** Pede o e-mail e responde sempre "se existir uma conta, enviamos o link". O link vale 1 hora e um único uso, e leva à tela de nova senha. Sem mockup: seguir o layout do login.

**Configuração inicial.** Em até 3 passos (mockup: `configuracao.html`, que mostra os três passos empilhados):

1. Empresa: CNPJ (validado pelo dígito verificador), razão social ou nome fantasia, data de abertura.
2. Enquadramento: porte (MEI ou ME), regime (Simples Nacional; outros regimes aparecem como "em breve"), atividade (comércio, serviço ou ambos) e, para ME, o anexo do Simples.
3. Ponto de partida: faturamento já realizado no ano antes de usar o Fatturo, por mês, opcional. Permite começar no meio do ano sem importar tudo.

### Uso diário

**Painel.** Conforme o mockup `painel.html`: faturamento acumulado contra o limite com projeção, indicadores do mês e do ano, gráfico de linha do acumulado e do DAS pago, origem do faturamento, pendências e DAS. Para ME, inclui a receita dos últimos 12 meses. Seletor de ano.

**Importar arquivos.** Área de arrastar e soltar que aceita vários arquivos de uma vez (XML, OFX, CSV). Para cada arquivo mostra: tipo detectado, quantidade lida, novos, duplicados ignorados e erros. CSV pede o mapeamento de colunas na primeira vez por banco e guarda esse mapeamento.

**Lançamentos.** Tabela com data, descrição, remetente ou destinatário, valor, categoria e origem (arquivo ou manual). Filtros por mês, categoria e "sem classificação". Classificação em lote, edição, exclusão e botão de lançamento manual.

**Notas.** Lista das NFS-e importadas com número, data, tomador, valor e situação (vinculada a recebimento ou não). Ação de vincular a um recebimento sugerido ou escolhido.

**DAS.** Os 12 meses do ano com competência, vencimento, valor e situação (pago, pendente, vencido, a vencer). MEI: valor preenchido pelo parâmetro. ME: campo para informar o valor da guia. Marcar como pago com a data do pagamento.

**Regras.** Lista das regras de classificação com o critério, a categoria e quantos lançamentos já classificou. Editar, desativar e excluir.

### Conta

**Configurações.** Dados da empresa e enquadramento (mudar de MEI para ME guarda a data da mudança), faixas de alerta, e-mail de alertas, troca de senha, exportar todos os dados em CSV e excluir a conta.

## Modelo de dados

Nove entidades. Todo dado de negócio pertence a uma empresa, e o acesso é restrito por RLS à empresa do usuário logado. Valores em centavos (inteiro), nunca em ponto flutuante.

| Entidade | Campos principais | Relações |
| --- | --- | --- |
| `usuario` | id (o mesmo de auth.users), nome, criado_em; e-mail e senha ficam no Supabase Auth | 1 usuário → 1 empresa |
| `empresa` | id, cnpj, nome, data_abertura, atividade (comercio, servico, ambos), alertas (faixas, e-mail) | pertence a usuário |
| `enquadramento` | id, porte (MEI, ME), regime (SIMPLES), anexo, inicio_em, fim_em | vários por empresa; guarda o histórico de MEI para ME |
| `parametro` | chave (ex.: limite_anual_mei), valor, vigencia_inicio, vigencia_fim | global, versionado por vigência |
| `arquivo_importado` | id, nome, tipo (XML_NFSE, OFX, CSV), hash_sha256, importado_em, resumo (lidos, novos, duplicados, erros) | pertence a empresa |
| `lancamento` | id, data, valor_centavos, sentido (entrada, saida), descricao, contraparte_nome, contraparte_doc, categoria, origem (arquivo, manual), id_externo, regra_id | pertence a empresa; opcionalmente a um arquivo e a uma regra |
| `nota_fiscal` | id, numero, chave_acesso (única), data_emissao, tomador_nome, tomador_doc, valor_centavos, situacao (emitida, cancelada), lancamento_id | pertence a empresa; vínculo opcional com um lançamento |
| `regra_classificacao` | id, campo (contraparte_doc, contraparte_nome, descricao), operador (igual, contem), valor, categoria, ativa | pertence a empresa |
| `guia_das` | id, competencia (AAAA-MM), vencimento, valor_centavos, situacao, pago_em | pertence a empresa; única por competência |

Categorias e situações são listas fixas (enum) na v1.

## Importação de arquivos

A importação nunca duplica dados: reenviar o mesmo arquivo, ou um extrato que se sobrepõe ao anterior, só acrescenta o que é novo.

| Formato | De onde vem | O que se lê | Chave contra duplicados |
| --- | --- | --- | --- |
| XML de NFS-e (padrão nacional) | Emissor Nacional da NFS-e, em "NFS-e emitidas" | chave de acesso, número, data de emissão, tomador (nome e CPF/CNPJ), valor do serviço, situação | chave de acesso |
| OFX | Exportação de extrato do banco | data, valor, tipo (crédito ou débito), descrição (MEMO), FITID | conta + FITID |
| CSV | Exportação de extrato quando o banco não oferece OFX | colunas mapeadas pelo usuário: data, descrição, valor (ou crédito e débito) | hash de data + valor + descrição + posição no dia |

- O arquivo inteiro também recebe um hash; o mesmo arquivo enviado de novo é recusado com aviso.
- Nota cancelada importada depois da emitida atualiza a situação e sai do faturamento.
- Ao importar, cada lançamento novo passa pelas regras ativas; o que não casar fica "sem classificação".
- Erros de leitura não interrompem o arquivo: a linha com problema é listada no resumo e as demais entram.
- Os arquivos são lidos no navegador; só os dados extraídos vão para o servidor, e o arquivo original nunca é enviado.

Antes de implementar o leitor de XML, vale baixar 2 ou 3 notas reais do Emissor Nacional para usar como amostra nos testes, já que os nomes exatos das tags devem seguir o leiaute oficial da NFS-e Nacional.

## Segurança e privacidade

O sistema guarda extrato bancário, então mesmo em uso próprio ele é tratado como um app com dados financeiros sensíveis.

- **Senhas:** gerenciadas pelo Supabase Auth (hash, confirmação de e-mail, recuperação e limite de tentativas).
- **Sessão:** cookie `HttpOnly`, `Secure` e `SameSite=Lax`, expiração por inatividade de 7 dias; troca de senha encerra as outras sessões.
- **Isolamento:** políticas de RLS em todas as tabelas garantem que cada usuário só acesse os dados da própria empresa.
- **Transporte e armazenamento:** HTTPS obrigatório; banco com criptografia em repouso e backup diário.
- **Arquivos:** lidos no navegador e nunca enviados ao servidor.
- **LGPD:** política de privacidade na tela de cadastro, exportação de todos os dados e exclusão definitiva da conta em Configurações.

## Stack

Next.js com TypeScript, Supabase e deploy na Vercel. A escolha prioriza a integração entre as três peças, que tira autenticação e isolamento de dados do código da aplicação.

| Camada | Escolha |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| Banco e autenticação | Supabase: Postgres, Supabase Auth via `@supabase/ssr` e Row Level Security |
| Interface | Tailwind CSS + shadcn/ui, Montserrat e o design system em `docs/design-system/` |
| Gráficos | Recharts |
| Formulários e validação | React Hook Form + Zod |
| Leitura de arquivos | `fast-xml-parser` (NFS-e), Papa Parse (CSV), leitor de OFX próprio |
| Tarefas agendadas e e-mail | Vercel Cron + Resend |
| Testes | Vitest, com foco nas regras de cálculo e nos leitores de arquivo |

Três decisões derivadas da stack:

1. **Arquivos lidos no navegador.** Só os lançamentos extraídos vão ao servidor; o arquivo original nunca sai do computador do usuário.
2. **RLS em todas as tabelas.** O banco garante que cada usuário só acessa os dados da própria empresa.
3. **Autenticação pelo Supabase Auth.** Hash de senha, confirmação de e-mail, recuperação e limite de tentativas são configurados no Supabase, não implementados.

### Equivalências para quem vem do Laravel

| No Laravel | Neste projeto |
| --- | --- |
| `routes/web.php` | Pastas em `app/`: cada pasta com `page.tsx` é uma rota |
| Controller | Server Action (formulários) ou Route Handler (`route.ts`, para APIs) |
| Blade | Componentes React (`.tsx`) |
| Eloquent | Cliente `supabase-js` com tipos gerados do banco |
| Migrations | Migrations do Supabase CLI (`supabase/migrations/*.sql`) |
| Breeze / Fortify | Supabase Auth |
| Policies e Gates | Políticas de RLS no Postgres |
| Middleware | `proxy.ts` (nome do `middleware.ts` a partir do Next 16; sessão e redirecionamento de rotas protegidas) |
| Form Request | Esquemas Zod |
| Scheduler (`schedule:run`) | Vercel Cron chamando um Route Handler |
| Mail | Resend |
| `.env` | `.env.local` e variáveis de ambiente da Vercel |
| PHPUnit / Pest | Vitest |

## Ordem de implementação

Cada etapa entrega algo usável; o painel já é útil ao fim da etapa 3.

1. **Base:** projeto, banco, autenticação completa (cadastro, confirmação, login, recuperação) e tabela de parâmetros.
2. **Empresa:** configuração inicial com enquadramento e ponto de partida.
3. **Notas e painel:** importação de XML de NFS-e e painel com acumulado, limite e projeção.
4. **Extratos:** importação de OFX e CSV, tela de lançamentos e lançamento manual.
5. **Classificação:** regras, pendências no painel e vínculo entre nota e recebimento.
6. **DAS:** tela do DAS e linha do DAS pago no gráfico.
7. **Alertas e conta:** e-mails de alerta, Configurações, exportação e exclusão.

Cada etapa vale um pedido separado ao Claude Code, com esta especificação como contexto.

## Questões em aberto

- [ ] Regime e anexo do Simples da ME do autor, para validar as regras de ME com um caso real
- [ ] Apuração do Simples por competência (data da nota) ou por caixa (data do recebimento)
- [ ] Confirmar com o contador os limites e o valor do DAS do MEI vigentes
- [x] Stack definida: Next.js, Supabase e Vercel
- [ ] Baixar 2 ou 3 XML reais de NFS-e e um OFX do banco como amostras de teste

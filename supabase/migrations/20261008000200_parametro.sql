-- Migration: tabela `parametro` (valores legais versionados por vigência).
-- Equivale a uma migration do Laravel. Limites e valores do DAS mudam por lei,
-- então ficam aqui e nunca fixos no código.

create extension if not exists btree_gist with schema extensions;

create table public.parametro (
  id bigint generated always as identity primary key,
  chave text not null check (chave ~ '^[a-z0-9_]+$'),
  -- Inteiro: centavos para dinheiro, número do dia para vencimentos.
  valor bigint not null,
  descricao text not null,
  vigencia_inicio date not null,
  -- Nulo enquanto o valor estiver em vigor.
  vigencia_fim date,
  -- Verdadeiro até o valor ser conferido com o contador.
  a_confirmar boolean not null default true,
  check (vigencia_fim is null or vigencia_fim >= vigencia_inicio),
  -- Uma chave não pode ter duas vigências que se sobrepõem.
  constraint parametro_vigencia_sem_sobreposicao
    exclude using gist (chave with =, daterange(vigencia_inicio, vigencia_fim, '[]') with &&)
);

comment on table public.parametro is 'Valores legais (limites, DAS) por vigência. Global, somente leitura para o app.';

alter table public.parametro enable row level security;

-- Qualquer usuário logado lê; ninguém escreve pela API. Alterações entram por migration.
create policy parametro_select_autenticado on public.parametro
  for select to authenticated
  using (true);

revoke all on public.parametro from anon, authenticated;
grant select on public.parametro to authenticated;

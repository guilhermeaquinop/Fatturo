-- Migration: tabela `enquadramento` (porte, regime e anexo da empresa ao longo do tempo).
-- Equivale a uma migration do Laravel. Guarda o histórico: mudar de MEI para ME fecha
-- uma linha (fim_em) e abre outra, em vez de sobrescrever.

create type public.porte as enum ('MEI', 'ME');
create type public.regime as enum ('SIMPLES');
create type public.anexo_simples as enum ('I', 'II', 'III', 'IV', 'V', 'nao_sei');

create table public.enquadramento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa (id) on delete cascade,
  porte public.porte not null,
  regime public.regime not null,
  -- Só a ME tem anexo; 'nao_sei' é tratado como anexo indefinido.
  anexo public.anexo_simples,
  inicio_em date not null,
  -- Nulo enquanto o enquadramento estiver em vigor.
  fim_em date,
  criado_em timestamptz not null default now(),
  check ((porte = 'MEI' and anexo is null) or (porte = 'ME' and anexo is not null)),
  check (fim_em is null or fim_em >= inicio_em),
  -- Uma empresa não pode ter dois enquadramentos no mesmo período.
  constraint enquadramento_sem_sobreposicao
    exclude using gist (empresa_id with =, daterange(inicio_em, fim_em, '[]') with &&)
);

comment on table public.enquadramento is 'Histórico de enquadramento (porte, regime, anexo) de cada empresa.';

alter table public.enquadramento enable row level security;

-- Acesso restrito aos enquadramentos da empresa do usuário logado.
create policy enquadramento_select_proprio on public.enquadramento
  for select to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = enquadramento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy enquadramento_insert_proprio on public.enquadramento
  for insert to authenticated
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = enquadramento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

-- Sem política de update ou delete: a mudança de enquadramento chega com a etapa 7.
revoke all on public.enquadramento from anon, authenticated;
grant select, insert on public.enquadramento to authenticated;

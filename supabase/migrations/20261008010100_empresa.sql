-- Migration: tabela `empresa` (a empresa do usuário; uma por conta na v1).
-- Equivale a uma migration do Laravel; as políticas de RLS fazem o papel de uma Policy.
-- Os campos de alertas (faixas e e-mail) entram na etapa 7, que é quem os usa.

create type public.atividade as enum ('comercio', 'servico', 'ambos');

create table public.empresa (
  id uuid primary key default gen_random_uuid(),
  -- unique: uma empresa por usuário.
  usuario_id uuid not null unique references public.usuario (id) on delete cascade,
  -- 14 caracteres sem máscara. Aceita o CNPJ alfanumérico (letras nas 12 primeiras posições).
  cnpj text not null unique check (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  nome text not null check (char_length(nome) between 1 and 160),
  data_abertura date not null,
  atividade public.atividade not null,
  criado_em timestamptz not null default now()
);

comment on table public.empresa is 'Empresa do usuário. Todo dado de negócio pertence a uma empresa.';

alter table public.empresa enable row level security;

-- Cada usuário lê e cria apenas a própria empresa.
create policy empresa_select_propria on public.empresa
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

create policy empresa_insert_propria on public.empresa
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

-- Sem política de update ou delete: alterar e excluir chegam com a tela de Configurações (etapa 7).
revoke all on public.empresa from anon, authenticated;
grant select, insert on public.empresa to authenticated;

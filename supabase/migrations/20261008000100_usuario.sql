-- Migration: tabela `usuario` (perfil do usuário logado).
-- Equivale a uma migration do Laravel; as políticas de RLS abaixo fazem o papel de uma Policy.
-- E-mail e senha ficam em auth.users (Supabase Auth); aqui ficam só os dados do app.

create table public.usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),
  criado_em timestamptz not null default now()
);

comment on table public.usuario is 'Perfil do usuário. O id é o mesmo de auth.users.';

alter table public.usuario enable row level security;

-- Cada usuário lê e altera apenas a própria linha.
create policy usuario_select_proprio on public.usuario
  for select to authenticated
  using ((select auth.uid()) = id);

create policy usuario_update_proprio on public.usuario
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Sem política de insert ou delete: a linha nasce pelo gatilho abaixo e some junto com auth.users.
revoke all on public.usuario from anon, authenticated;
grant select on public.usuario to authenticated;
grant update (nome) on public.usuario to authenticated;

-- Cria a linha de `usuario` quando alguém se cadastra. O nome vem dos metadados enviados no cadastro.
create function public.criar_usuario_apos_cadastro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuario (id, nome)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1), 'Usuário'), 120)
  );
  return new;
end;
$$;

revoke all on function public.criar_usuario_apos_cadastro() from public, anon, authenticated;

create trigger criar_usuario_apos_cadastro
  after insert on auth.users
  for each row execute function public.criar_usuario_apos_cadastro();

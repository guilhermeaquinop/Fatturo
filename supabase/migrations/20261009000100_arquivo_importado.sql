-- Migration: tabela `arquivo_importado` (registro de cada arquivo enviado na importação).
-- Equivale a uma migration do Laravel. O arquivo em si nunca chega ao servidor: aqui ficam
-- só o nome, o hash (para recusar o mesmo arquivo duas vezes) e o resumo do que foi lido.

create type public.tipo_arquivo as enum ('XML_NFSE', 'OFX', 'CSV');

create table public.arquivo_importado (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 255),
  tipo public.tipo_arquivo not null,
  hash_sha256 text not null check (hash_sha256 ~ '^[0-9a-f]{64}$'),
  importado_em timestamptz not null default now(),
  -- Resumo da importação.
  lidos integer not null default 0 check (lidos >= 0),
  novos integer not null default 0 check (novos >= 0),
  duplicados integer not null default 0 check (duplicados >= 0),
  erros integer not null default 0 check (erros >= 0),
  -- O mesmo arquivo não entra duas vezes na mesma empresa.
  constraint arquivo_importado_hash_unico unique (empresa_id, hash_sha256)
);

comment on table public.arquivo_importado is 'Arquivos importados por empresa, com hash e resumo. O conteúdo não é guardado.';

alter table public.arquivo_importado enable row level security;

-- Acesso restrito aos arquivos da empresa do usuário logado.
create policy arquivo_importado_select_proprio on public.arquivo_importado
  for select to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = arquivo_importado.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy arquivo_importado_insert_proprio on public.arquivo_importado
  for insert to authenticated
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = arquivo_importado.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

-- O resumo é preenchido ao fim da importação, pela função importar_nfse.
create policy arquivo_importado_update_proprio on public.arquivo_importado
  for update to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = arquivo_importado.empresa_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = arquivo_importado.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

revoke all on public.arquivo_importado from anon, authenticated;
grant select, insert on public.arquivo_importado to authenticated;
grant update (lidos, novos, duplicados, erros) on public.arquivo_importado to authenticated;

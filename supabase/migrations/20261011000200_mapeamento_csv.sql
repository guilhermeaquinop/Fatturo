-- Migration: tabela `mapeamento_csv` (qual coluna do CSV de cada banco é data, descrição e valor).
-- Equivale a uma migration do Laravel. O CSV não tem padrão: na primeira vez o usuário diz
-- o que é cada coluna, e o Fatturo guarda a resposta para os próximos extratos do mesmo banco.
-- O "banco" é reconhecido pelo cabeçalho do arquivo (a lista de colunas), guardado em `assinatura`.

create table public.mapeamento_csv (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa (id) on delete cascade,
  -- Cabeçalho normalizado do arquivo, ex.: "data|valor|identificador|descrição".
  assinatura text not null check (char_length(assinatura) between 1 and 1000),
  -- Posição das colunas, contando do zero.
  coluna_data smallint not null check (coluna_data >= 0),
  coluna_descricao smallint not null check (coluna_descricao >= 0),
  -- Valor numa coluna só (negativo = saída) ou em duas colunas, crédito e débito.
  coluna_valor smallint check (coluna_valor >= 0),
  coluna_credito smallint check (coluna_credito >= 0),
  coluna_debito smallint check (coluna_debito >= 0),
  criado_em timestamptz not null default now(),
  constraint mapeamento_csv_assinatura_unica unique (empresa_id, assinatura),
  constraint mapeamento_csv_valor_ou_credito_debito check (
    (coluna_valor is not null and coluna_credito is null and coluna_debito is null)
    or (coluna_valor is null and coluna_credito is not null and coluna_debito is not null)
  )
);

comment on table public.mapeamento_csv is 'Mapeamento de colunas dos extratos em CSV, um por formato de cabeçalho.';

alter table public.mapeamento_csv enable row level security;

-- Acesso restrito aos mapeamentos da empresa do usuário logado.
create policy mapeamento_csv_select_proprio on public.mapeamento_csv
  for select to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = mapeamento_csv.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy mapeamento_csv_insert_proprio on public.mapeamento_csv
  for insert to authenticated
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = mapeamento_csv.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy mapeamento_csv_update_proprio on public.mapeamento_csv
  for update to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = mapeamento_csv.empresa_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = mapeamento_csv.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy mapeamento_csv_delete_proprio on public.mapeamento_csv
  for delete to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = mapeamento_csv.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

revoke all on public.mapeamento_csv from anon, authenticated;
grant select, insert, delete on public.mapeamento_csv to authenticated;
grant update (coluna_data, coluna_descricao, coluna_valor, coluna_credito, coluna_debito)
  on public.mapeamento_csv to authenticated;

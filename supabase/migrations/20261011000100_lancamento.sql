-- Migration: tabela `lancamento` (entradas e saídas da conta, vindas de extrato ou digitadas).
-- Equivale a uma migration do Laravel. Valores em centavos (inteiro), nunca em ponto flutuante.
-- O sinal não fica no valor: `valor_centavos` é sempre positivo e `sentido` diz se entrou ou saiu.
-- O vínculo com a regra de classificação (regra_id) entra na etapa 5.

create type public.sentido_lancamento as enum ('entrada', 'saida');
create type public.categoria_lancamento as enum (
  'receita', 'despesa', 'pessoal', 'transferencia', 'imposto'
);
create type public.origem_lancamento as enum ('arquivo', 'manual');

create table public.lancamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa (id) on delete cascade,
  -- Arquivo de origem. Se o registro do arquivo for apagado, o lançamento permanece.
  arquivo_id uuid references public.arquivo_importado (id) on delete set null,
  data date not null,
  valor_centavos bigint not null check (valor_centavos > 0),
  sentido public.sentido_lancamento not null,
  descricao text not null check (char_length(descricao) between 1 and 300),
  contraparte_nome text check (char_length(contraparte_nome) between 1 and 200),
  -- CPF (11) ou CNPJ (14), sem máscara.
  contraparte_doc text check (contraparte_doc ~ '^([0-9]{11}|[A-Z0-9]{12}[0-9]{2})$'),
  -- Sem categoria = "sem classificação".
  categoria public.categoria_lancamento,
  origem public.origem_lancamento not null,
  -- Identificador que impede duplicar ao reimportar: no OFX, conta + FITID; no CSV, um hash
  -- de data, valor, descrição e posição. Lançamento manual não tem.
  id_externo text check (char_length(id_externo) between 1 and 300),
  criado_em timestamptz not null default now(),
  constraint lancamento_origem_coerente check (
    (origem = 'arquivo' and id_externo is not null) or (origem = 'manual' and id_externo is null)
  ),
  constraint lancamento_id_externo_unico unique (empresa_id, id_externo)
);

comment on table public.lancamento is 'Entradas e saídas da empresa, importadas de extrato (OFX, CSV) ou digitadas.';

-- A tela de lançamentos lista por mês.
create index lancamento_empresa_data_idx on public.lancamento (empresa_id, data);

alter table public.lancamento enable row level security;

-- Acesso restrito aos lançamentos da empresa do usuário logado.
create policy lancamento_select_proprio on public.lancamento
  for select to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = lancamento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy lancamento_insert_proprio on public.lancamento
  for insert to authenticated
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = lancamento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy lancamento_update_proprio on public.lancamento
  for update to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = lancamento.empresa_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = lancamento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy lancamento_delete_proprio on public.lancamento
  for delete to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = lancamento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

revoke all on public.lancamento from anon, authenticated;
grant select, insert, delete on public.lancamento to authenticated;
-- Empresa, arquivo, origem e id_externo não mudam depois de gravados.
grant update (data, valor_centavos, sentido, descricao, contraparte_nome, contraparte_doc, categoria)
  on public.lancamento to authenticated;

-- Lançamento vindo de extrato mantém data, valor e sentido do banco: só a classificação,
-- a descrição e a contraparte podem ser ajustadas. O manual pode mudar por inteiro.
create function public.lancamento_protege_dados_do_banco()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.origem = 'arquivo' and (
    new.data is distinct from old.data
    or new.valor_centavos is distinct from old.valor_centavos
    or new.sentido is distinct from old.sentido
  ) then
    raise exception 'Data, valor e sentido de um lançamento importado não podem ser alterados.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger lancamento_protege_dados_do_banco
  before update on public.lancamento
  for each row execute function public.lancamento_protege_dados_do_banco();

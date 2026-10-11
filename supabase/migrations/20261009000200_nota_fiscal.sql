-- Migration: tabela `nota_fiscal` (NFS-e emitidas pela empresa, lidas dos XML importados).
-- Equivale a uma migration do Laravel. Valores em centavos (inteiro), nunca em ponto flutuante.
-- O vínculo com o recebimento (lancamento_id) entra na etapa 5.

create type public.situacao_nota as enum ('emitida', 'cancelada');

create table public.nota_fiscal (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa (id) on delete cascade,
  -- Arquivo de origem. Se o registro do arquivo for apagado, a nota permanece.
  arquivo_id uuid references public.arquivo_importado (id) on delete set null,
  numero text not null check (char_length(numero) between 1 and 20),
  -- Chave de acesso da NFS-e nacional: 50 dígitos. É o que impede nota duplicada.
  chave_acesso text not null check (chave_acesso ~ '^[0-9]{50}$'),
  -- Dia em que a nota foi emitida (dhEmi), no fuso de São Paulo.
  data_emissao date not null,
  -- Competência do serviço (dCompet). É a data que posiciona a nota no faturamento.
  data_competencia date not null,
  -- Tomador é opcional na NFS-e (serviço para pessoa não identificada).
  tomador_nome text check (char_length(tomador_nome) <= 200),
  -- CPF (11) ou CNPJ (14), sem máscara.
  tomador_doc text check (tomador_doc ~ '^([0-9]{11}|[A-Z0-9]{12}[0-9]{2})$'),
  valor_centavos bigint not null check (valor_centavos >= 0),
  situacao public.situacao_nota not null default 'emitida',
  criado_em timestamptz not null default now(),
  constraint nota_fiscal_chave_unica unique (empresa_id, chave_acesso)
);

comment on table public.nota_fiscal is 'NFS-e emitidas pela empresa. Canceladas não entram no faturamento.';

-- O painel busca as notas de uma empresa por período de competência.
create index nota_fiscal_empresa_competencia_idx
  on public.nota_fiscal (empresa_id, data_competencia);

alter table public.nota_fiscal enable row level security;

-- Acesso restrito às notas da empresa do usuário logado.
create policy nota_fiscal_select_propria on public.nota_fiscal
  for select to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = nota_fiscal.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy nota_fiscal_insert_propria on public.nota_fiscal
  for insert to authenticated
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = nota_fiscal.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

-- Só a situação muda depois de importada (cancelamento).
create policy nota_fiscal_update_propria on public.nota_fiscal
  for update to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = nota_fiscal.empresa_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = nota_fiscal.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

revoke all on public.nota_fiscal from anon, authenticated;
grant select, insert on public.nota_fiscal to authenticated;
grant update (situacao) on public.nota_fiscal to authenticated;

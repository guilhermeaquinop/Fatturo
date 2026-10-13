-- Migration: tabela `guia_das` (a guia mensal do Simples Nacional, uma por mês de competência).
-- Equivale a uma migration do Laravel. Valores em centavos (inteiro), nunca em ponto flutuante.
--
-- A situação (paga, pendente, vencida, a vencer) não é guardada: é calculada na leitura a
-- partir de `pago_em`, `vencimento` e da data de hoje, para nunca ficar desatualizada.
-- Só existe linha para o mês em que o usuário informou alguma coisa; os demais meses do ano
-- aparecem na tela com o vencimento padrão e sem valor.

create table public.guia_das (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa (id) on delete cascade,
  -- Mês de apuração, sempre no dia 1: julho de 2026 é 2026-07-01.
  competencia date not null check (extract(day from competencia) = 1),
  -- Dia 20 do mês seguinte, ou o próximo dia útil. Editável, por causa dos feriados.
  vencimento date not null,
  -- Valor total da guia. Vazio enquanto o usuário não informou.
  valor_centavos bigint check (valor_centavos >= 0),
  -- Dia do pagamento. Vazio = ainda não paga.
  pago_em date,
  criado_em timestamptz not null default now(),
  constraint guia_das_competencia_unica unique (empresa_id, competencia),
  constraint guia_das_vencimento_depois_da_competencia check (vencimento > competencia),
  -- Não se marca como paga uma guia sem valor.
  constraint guia_das_paga_tem_valor check (pago_em is null or valor_centavos is not null)
);

comment on table public.guia_das is 'Guias mensais do DAS por empresa: vencimento, valor e data de pagamento.';

alter table public.guia_das enable row level security;

-- Acesso restrito às guias da empresa do usuário logado.
create policy guia_das_select_propria on public.guia_das
  for select to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = guia_das.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy guia_das_insert_propria on public.guia_das
  for insert to authenticated
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = guia_das.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy guia_das_update_propria on public.guia_das
  for update to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = guia_das.empresa_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = guia_das.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy guia_das_delete_propria on public.guia_das
  for delete to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = guia_das.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

revoke all on public.guia_das from anon, authenticated;
grant select, insert, delete on public.guia_das to authenticated;
-- Empresa e competência não mudam depois de gravadas.
grant update (vencimento, valor_centavos, pago_em) on public.guia_das to authenticated;

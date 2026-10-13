-- Migration: o que a tela de Configurações precisa no banco.
-- Equivale a uma migration do Laravel que altera tabelas existentes (Schema::table).
--
-- 1. `empresa`: faixas e e-mail dos alertas; passa a aceitar alteração de nome e atividade.
-- 2. `usuario`: data de inativação da conta.
-- 3. `enquadramento`: funções para registrar a mudança de porte ou anexo, corrigir o anexo
--    atual e desfazer a última mudança.
-- 4. Função para o usuário excluir a própria conta.

-- 1. Empresa -------------------------------------------------------------------------------

alter table public.empresa
  -- Percentuais do limite em que o painel e os e-mails alertam, em ordem crescente.
  add column alerta_faixas smallint[] not null default '{70,90,100}',
  -- E-mail que recebe os alertas. Vazio = o e-mail de login.
  add column alerta_email text,
  add constraint empresa_alerta_faixas_validas check (
    cardinality(alerta_faixas) = 3
    and alerta_faixas[1] >= 1
    and alerta_faixas[1] < alerta_faixas[2]
    and alerta_faixas[2] < alerta_faixas[3]
    and alerta_faixas[3] <= 100
  ),
  add constraint empresa_alerta_email_valido check (
    alerta_email is null or (char_length(alerta_email) <= 254 and alerta_email ~ '^[^@\s]+@[^@\s]+$')
  );

create policy empresa_update_propria on public.empresa
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

-- CNPJ, data de abertura e dono não mudam pela tela.
grant update (nome, atividade, alerta_faixas, alerta_email) on public.empresa to authenticated;

-- 2. Usuário -------------------------------------------------------------------------------

alter table public.usuario
  -- Preenchida quando o usuário inativa a conta: os dados ficam guardados, o app fica
  -- bloqueado e nenhum alerta é enviado, até ele reativar.
  add column inativa_em timestamptz;

grant update (inativa_em) on public.usuario to authenticated;

-- 3. Enquadramento -------------------------------------------------------------------------

create policy enquadramento_update_proprio on public.enquadramento
  for update to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = enquadramento.empresa_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.empresa e
      where e.id = enquadramento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

create policy enquadramento_delete_proprio on public.enquadramento
  for delete to authenticated
  using (
    exists (
      select 1 from public.empresa e
      where e.id = enquadramento.empresa_id and e.usuario_id = (select auth.uid())
    )
  );

grant update (anexo, fim_em) on public.enquadramento to authenticated;
grant delete on public.enquadramento to authenticated;

-- Registra uma mudança de porte ou de anexo a partir de uma data: fecha o período em vigor
-- na véspera e abre um novo. Equivale a um DB::transaction() num Service do Laravel.
create function public.mudar_enquadramento(
  p_porte public.porte,
  p_inicio_em date,
  -- Opcional: o MEI não tem anexo.
  p_anexo public.anexo_simples default null
)
returns uuid
language plpgsql
-- security invoker: roda com as permissões de quem chama, então o RLS continua valendo.
security invoker
set search_path = ''
as $$
declare
  v_atual public.enquadramento%rowtype;
  v_novo_id uuid;
begin
  select q.* into v_atual
  from public.enquadramento q
  join public.empresa e on e.id = q.empresa_id
  where e.usuario_id = (select auth.uid()) and q.fim_em is null;

  if v_atual.id is null then
    raise exception 'Empresa sem enquadramento em vigor.' using errcode = 'P0001';
  end if;
  if p_inicio_em > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'A data da mudança não pode estar no futuro.' using errcode = 'P0002';
  end if;
  if p_inicio_em <= v_atual.inicio_em then
    raise exception 'A data da mudança precisa ser depois do início do enquadramento atual.'
      using errcode = 'P0003';
  end if;
  if p_porte = v_atual.porte and p_anexo is not distinct from v_atual.anexo then
    raise exception 'O enquadramento informado é igual ao atual.' using errcode = 'P0004';
  end if;

  update public.enquadramento set fim_em = p_inicio_em - 1 where id = v_atual.id;

  insert into public.enquadramento (empresa_id, porte, regime, anexo, inicio_em)
  values (v_atual.empresa_id, p_porte, v_atual.regime, p_anexo, p_inicio_em)
  returning id into v_novo_id;

  return v_novo_id;
end;
$$;

-- Corrige o anexo do período em vigor, sem criar um período novo. Serve para trocar o
-- "não sei" pelo anexo certo, ou consertar um anexo informado errado.
create function public.corrigir_anexo(p_anexo public.anexo_simples)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_linhas integer;
begin
  update public.enquadramento q
  set anexo = p_anexo
  from public.empresa e
  where e.id = q.empresa_id
    and e.usuario_id = (select auth.uid())
    and q.fim_em is null
    and q.porte = 'ME';

  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then
    raise exception 'Só a ME tem anexo.' using errcode = 'P0001';
  end if;
end;
$$;

-- Desfaz a última mudança: apaga o período em vigor e reabre o anterior.
create function public.desfazer_mudanca_de_enquadramento()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_atual_id uuid;
  v_anterior_id uuid;
begin
  select id into v_empresa_id from public.empresa where usuario_id = (select auth.uid());

  select id into v_atual_id
  from public.enquadramento
  where empresa_id = v_empresa_id and fim_em is null;

  select id into v_anterior_id
  from public.enquadramento
  where empresa_id = v_empresa_id and fim_em is not null
  order by inicio_em desc
  limit 1;

  if v_atual_id is null or v_anterior_id is null then
    raise exception 'Não há mudança de enquadramento para desfazer.' using errcode = 'P0001';
  end if;

  -- Nesta ordem: reabrir o anterior antes de apagar o atual bateria na regra de sobreposição.
  delete from public.enquadramento where id = v_atual_id;
  update public.enquadramento set fim_em = null where id = v_anterior_id;
end;
$$;

revoke all on function public.mudar_enquadramento(public.porte, date, public.anexo_simples)
  from public, anon;
grant execute on function public.mudar_enquadramento(public.porte, date, public.anexo_simples)
  to authenticated;
revoke all on function public.corrigir_anexo(public.anexo_simples) from public, anon;
grant execute on function public.corrigir_anexo(public.anexo_simples) to authenticated;
revoke all on function public.desfazer_mudanca_de_enquadramento() from public, anon;
grant execute on function public.desfazer_mudanca_de_enquadramento() to authenticated;

-- 4. Exclusão da conta ---------------------------------------------------------------------

-- Apaga a conta de quem chama. A linha de auth.users leva junto, em cascata, o usuário, a
-- empresa, o enquadramento, as notas, os lançamentos, as guias e os arquivos importados.
-- security definer: precisa apagar em auth.users, onde o usuário comum não tem permissão.
-- Só apaga a linha do próprio auth.uid(), então ninguém exclui a conta de outra pessoa.
create function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (select auth.uid());
begin
  if v_id is null then
    raise exception 'Sessão inválida.' using errcode = 'P0001';
  end if;
  delete from auth.users where id = v_id;
end;
$$;

revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;

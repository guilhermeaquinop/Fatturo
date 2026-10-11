-- Migration: função `configurar_empresa`, chamada ao salvar a configuração inicial.
-- Equivale a um DB::transaction() num Service do Laravel: cria a empresa e o primeiro
-- enquadramento juntos. Se um dos dois falhar, nada é gravado.

create function public.configurar_empresa(
  p_cnpj text,
  p_nome text,
  p_data_abertura date,
  p_atividade public.atividade,
  p_porte public.porte,
  p_regime public.regime,
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
  v_empresa_id uuid;
begin
  if p_data_abertura > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'A data de abertura não pode estar no futuro.' using errcode = '22007';
  end if;

  insert into public.empresa (usuario_id, cnpj, nome, data_abertura, atividade)
  values ((select auth.uid()), p_cnpj, trim(p_nome), p_data_abertura, p_atividade)
  returning id into v_empresa_id;

  -- O primeiro enquadramento vale desde a abertura da empresa.
  insert into public.enquadramento (empresa_id, porte, regime, anexo, inicio_em)
  values (v_empresa_id, p_porte, p_regime, p_anexo, p_data_abertura);

  return v_empresa_id;
end;
$$;

revoke all on function public.configurar_empresa(
  text, text, date, public.atividade, public.porte, public.regime, public.anexo_simples
) from public, anon;
grant execute on function public.configurar_empresa(
  text, text, date, public.atividade, public.porte, public.regime, public.anexo_simples
) to authenticated;

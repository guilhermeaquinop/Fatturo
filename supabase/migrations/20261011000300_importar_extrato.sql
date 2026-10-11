-- Migration: função `importar_extrato`, chamada uma vez por arquivo OFX ou CSV importado.
-- Equivale a um DB::transaction() num Service do Laravel: registra o arquivo e grava os
-- lançamentos novos, ignorando os que já existem. Se algo falhar, nada é gravado.
--
-- p_tipo: 'OFX' ou 'CSV'.
-- p_lancamentos: lista de objetos { id_externo, data, valor_centavos, sentido, descricao,
--                contraparte_nome }.
-- p_erros: linhas que o navegador não conseguiu ler (entram só no resumo).
--
-- Os lançamentos entram sem categoria ("sem classificação"); as regras chegam na etapa 5.

create function public.importar_extrato(
  p_nome text,
  p_tipo public.tipo_arquivo,
  p_hash text,
  p_lancamentos jsonb,
  p_erros integer default 0
)
returns jsonb
language plpgsql
-- security invoker: roda com as permissões de quem chama, então o RLS continua valendo.
security invoker
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_arquivo_id uuid;
  v_novos integer := 0;
  v_total integer := jsonb_array_length(p_lancamentos);
begin
  if p_tipo not in ('OFX', 'CSV') then
    raise exception 'Tipo de arquivo inválido para extrato.' using errcode = 'P0001';
  end if;

  select id into v_empresa_id
  from public.empresa
  where usuario_id = (select auth.uid());

  if v_empresa_id is null then
    raise exception 'Empresa não configurada.' using errcode = 'P0001';
  end if;

  -- A chave única (empresa, hash) faz este insert falhar se o arquivo já foi importado.
  insert into public.arquivo_importado (empresa_id, nome, tipo, hash_sha256)
  values (v_empresa_id, p_nome, p_tipo, p_hash)
  returning id into v_arquivo_id;

  -- Lançamento que já existe (mesmo id_externo) é ignorado: um extrato que se sobrepõe
  -- ao anterior só acrescenta o que é novo.
  with inseridos as (
    insert into public.lancamento (
      empresa_id, arquivo_id, data, valor_centavos, sentido, descricao, contraparte_nome,
      origem, id_externo
    )
    select
      v_empresa_id,
      v_arquivo_id,
      (item ->> 'data')::date,
      (item ->> 'valor_centavos')::bigint,
      (item ->> 'sentido')::public.sentido_lancamento,
      item ->> 'descricao',
      item ->> 'contraparte_nome',
      'arquivo',
      item ->> 'id_externo'
    from jsonb_array_elements(p_lancamentos) as item
    on conflict (empresa_id, id_externo) do nothing
    returning 1
  )
  select count(*) into v_novos from inseridos;

  update public.arquivo_importado
  set lidos = v_total + p_erros,
      novos = v_novos,
      duplicados = v_total - v_novos,
      erros = p_erros
  where id = v_arquivo_id;

  return jsonb_build_object(
    'arquivo_id', v_arquivo_id,
    'novos', v_novos,
    'duplicados', v_total - v_novos
  );
end;
$$;

revoke all on function public.importar_extrato(text, public.tipo_arquivo, text, jsonb, integer)
  from public, anon;
grant execute on function public.importar_extrato(text, public.tipo_arquivo, text, jsonb, integer)
  to authenticated;

-- Migration: função `importar_nfse`, chamada uma vez por arquivo XML importado.
-- Equivale a um DB::transaction() num Service do Laravel: registra o arquivo, grava as
-- notas novas, ignora as repetidas e aplica cancelamentos. Se algo falhar, nada é gravado.
--
-- p_notas: lista de objetos { chave, numero, data_emissao, data_competencia,
--          tomador_nome, tomador_doc, valor_centavos }.
-- p_cancelamentos: lista de chaves de acesso de notas canceladas.
-- p_erros: itens que o navegador não conseguiu ler (entram só no resumo).

create function public.importar_nfse(
  p_nome text,
  p_hash text,
  p_notas jsonb,
  p_cancelamentos jsonb,
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
  v_nota jsonb;
  v_chave text;
  v_linhas integer;
  v_novos integer := 0;
  v_duplicados integer := 0;
  v_cancelados integer := 0;
  v_nao_encontrados integer := 0;
begin
  select id into v_empresa_id
  from public.empresa
  where usuario_id = (select auth.uid());

  if v_empresa_id is null then
    raise exception 'Empresa não configurada.' using errcode = 'P0001';
  end if;

  -- A chave única (empresa, hash) faz este insert falhar se o arquivo já foi importado.
  insert into public.arquivo_importado (empresa_id, nome, tipo, hash_sha256)
  values (v_empresa_id, p_nome, 'XML_NFSE', p_hash)
  returning id into v_arquivo_id;

  for v_nota in select * from jsonb_array_elements(p_notas) loop
    insert into public.nota_fiscal (
      empresa_id, arquivo_id, numero, chave_acesso, data_emissao, data_competencia,
      tomador_nome, tomador_doc, valor_centavos
    )
    values (
      v_empresa_id,
      v_arquivo_id,
      v_nota ->> 'numero',
      v_nota ->> 'chave',
      (v_nota ->> 'data_emissao')::date,
      (v_nota ->> 'data_competencia')::date,
      v_nota ->> 'tomador_nome',
      v_nota ->> 'tomador_doc',
      (v_nota ->> 'valor_centavos')::bigint
    )
    -- Nota que já existe (mesma chave de acesso) é ignorada, não duplicada.
    on conflict (empresa_id, chave_acesso) do nothing;

    get diagnostics v_linhas = row_count;
    if v_linhas = 1 then
      v_novos := v_novos + 1;
    else
      v_duplicados := v_duplicados + 1;
    end if;
  end loop;

  for v_chave in select * from jsonb_array_elements_text(p_cancelamentos) loop
    update public.nota_fiscal
    set situacao = 'cancelada'
    where empresa_id = v_empresa_id and chave_acesso = v_chave and situacao <> 'cancelada';

    get diagnostics v_linhas = row_count;
    if v_linhas = 1 then
      v_cancelados := v_cancelados + 1;
    elsif exists (
      select 1 from public.nota_fiscal
      where empresa_id = v_empresa_id and chave_acesso = v_chave
    ) then
      -- Cancelamento repetido de uma nota já cancelada.
      v_duplicados := v_duplicados + 1;
    else
      -- Cancelamento de uma nota que ainda não foi importada.
      v_nao_encontrados := v_nao_encontrados + 1;
    end if;
  end loop;

  update public.arquivo_importado
  set lidos = jsonb_array_length(p_notas) + jsonb_array_length(p_cancelamentos) + p_erros,
      novos = v_novos + v_cancelados,
      duplicados = v_duplicados,
      erros = p_erros + v_nao_encontrados
  where id = v_arquivo_id;

  return jsonb_build_object(
    'arquivo_id', v_arquivo_id,
    'novos', v_novos,
    'duplicados', v_duplicados,
    'cancelados', v_cancelados,
    'nao_encontrados', v_nao_encontrados
  );
end;
$$;

revoke all on function public.importar_nfse(text, text, jsonb, jsonb, integer) from public, anon;
grant execute on function public.importar_nfse(text, text, jsonb, jsonb, integer) to authenticated;

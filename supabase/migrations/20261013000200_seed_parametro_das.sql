-- Seed dos parâmetros do DAS da ME. Equivale a um Seeder do Laravel, rodando como migration.
-- A v1 não calcula o DAS da ME pelas tabelas do Simples: a tela só SUGERE um valor, que o
-- usuário confirma ou troca pelo da guia. A sugestão usa a alíquota da 1ª faixa do Anexo III.
-- Os dois valores estão marcados como "a confirmar": precisam ser conferidos com o contador.

insert into public.parametro (chave, valor, descricao, vigencia_inicio, a_confirmar) values
  (
    'das_aliquota_sugerida_me',
    600,
    'Alíquota usada para sugerir o DAS da ME, em centésimos de por cento (600 = 6,00%). 1ª faixa do Anexo III.',
    '2018-01-01',
    true
  ),
  (
    'das_teto_receita_12m_aliquota_sugerida',
    18000000,
    'Receita dos últimos 12 meses até a qual a alíquota sugerida vale, em centavos (R$ 180.000,00).',
    '2018-01-01',
    true
  );

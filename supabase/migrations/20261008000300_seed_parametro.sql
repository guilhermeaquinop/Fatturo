-- Seed dos parâmetros da especificação (docs/ESPECIFICACAO.md, "Regras de negócio").
-- Equivale a um Seeder do Laravel, mas roda como migration para chegar também ao banco da nuvem.
-- TODOS os valores estão marcados como "a confirmar": precisam ser conferidos com o contador.
-- O DAS do MEI por atividade entra na etapa 6, com valores confirmados.

insert into public.parametro (chave, valor, descricao, vigencia_inicio, a_confirmar) values
  ('limite_anual_mei', 8100000, 'Limite anual de faturamento do MEI, em centavos (R$ 81.000,00).', '2018-01-01', true),
  ('limite_mensal_proporcional_mei', 675000, 'Limite do MEI por mês de atividade no ano de abertura, em centavos (R$ 6.750,00).', '2018-01-01', true),
  ('limite_anual_me', 36000000, 'Limite anual de faturamento da ME no Simples, em centavos (R$ 360.000,00).', '2018-01-01', true),
  ('limite_anual_epp', 480000000, 'Limite anual de faturamento da EPP no Simples, em centavos (R$ 4.800.000,00).', '2018-01-01', true),
  ('das_dia_vencimento', 20, 'Dia do mês seguinte à competência em que o DAS vence.', '2018-01-01', true);

// Leitura da empresa do usuário logado, com o enquadramento em vigor e o histórico dele.
// Equivale a auth()->user()->empresa com o relacionamento carregado, no Laravel.
// Também barra a conta inativa: quem inativou a conta é mandado para a tela de reativação.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ROTA_CONTA_INATIVA, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import type { Anexo, Atividade, Porte, Regime } from "@/lib/validacao/empresa";

export type EnquadramentoDaEmpresa = {
  porte: Porte;
  regime: Regime;
  anexo: Anexo | null;
  inicioEm: string;
  /** Último dia do período, ou null se ainda está em vigor. */
  fimEm: string | null;
};

export type EmpresaAtual = {
  id: string;
  cnpj: string;
  nome: string;
  dataAbertura: string;
  atividade: Atividade;
  /** Percentuais do limite em que o painel e os e-mails alertam, em ordem crescente. */
  alertaFaixas: number[];
  /** E-mail que recebe os alertas; null = o e-mail de login. */
  alertaEmail: string | null;
  enquadramento: {
    porte: Porte;
    regime: Regime;
    anexo: Anexo | null;
    inicioEm: string;
  };
  /** Todos os períodos, do mais antigo ao mais recente (ex.: MEI e depois ME). */
  enquadramentos: EnquadramentoDaEmpresa[];
};

/** Devolve a empresa do usuário, ou null se ele ainda não fez a configuração inicial. */
export const empresaAtual = cache(async (): Promise<EmpresaAtual | null> => {
  const supabase = await createClient();

  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims) redirect(ROTA_LOGIN);

  // Conta inativa não usa o app: só a tela de reativação.
  const { data: usuario } = await supabase
    .from("usuario")
    .select("inativa_em")
    .eq("id", sessao.claims.sub)
    .maybeSingle();
  if (usuario?.inativa_em) redirect(ROTA_CONTA_INATIVA);

  // O RLS já limita à empresa do usuário; o filtro deixa a intenção explícita.
  const { data: empresa, error } = await supabase
    .from("empresa")
    .select(
      "id, cnpj, nome, data_abertura, atividade, alerta_faixas, alerta_email, enquadramento(porte, regime, anexo, inicio_em, fim_em)",
    )
    .eq("usuario_id", sessao.claims.sub)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível ler a empresa: ${error.message}`);
  if (!empresa) return null;

  // Em vigor é o enquadramento sem data de fim.
  const vigente = empresa.enquadramento.find((item) => item.fim_em === null);
  if (!vigente) throw new Error("Empresa sem enquadramento em vigor.");

  return {
    id: empresa.id,
    cnpj: empresa.cnpj,
    nome: empresa.nome,
    dataAbertura: empresa.data_abertura,
    atividade: empresa.atividade,
    alertaFaixas: empresa.alerta_faixas,
    alertaEmail: empresa.alerta_email,
    enquadramento: {
      porte: vigente.porte,
      regime: vigente.regime,
      anexo: vigente.anexo,
      inicioEm: vigente.inicio_em,
    },
    enquadramentos: empresa.enquadramento
      .map((item) => ({
        porte: item.porte,
        regime: item.regime,
        anexo: item.anexo,
        inicioEm: item.inicio_em,
        fimEm: item.fim_em,
      }))
      .sort((a, b) => a.inicioEm.localeCompare(b.inicioEm)),
  };
});

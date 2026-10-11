// Leitura da empresa do usuário logado, com o enquadramento em vigor.
// Equivale a auth()->user()->empresa com o relacionamento carregado, no Laravel.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import type { Anexo, Atividade, Porte, Regime } from "@/lib/validacao/empresa";

export type EmpresaAtual = {
  id: string;
  cnpj: string;
  nome: string;
  dataAbertura: string;
  atividade: Atividade;
  enquadramento: {
    porte: Porte;
    regime: Regime;
    anexo: Anexo | null;
    inicioEm: string;
  };
};

/** Devolve a empresa do usuário, ou null se ele ainda não fez a configuração inicial. */
export const empresaAtual = cache(async (): Promise<EmpresaAtual | null> => {
  const supabase = await createClient();

  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims) redirect(ROTA_LOGIN);

  // O RLS já limita à empresa do usuário; o filtro deixa a intenção explícita.
  const { data: empresa, error } = await supabase
    .from("empresa")
    .select("id, cnpj, nome, data_abertura, atividade, enquadramento(porte, regime, anexo, inicio_em, fim_em)")
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
    enquadramento: {
      porte: vigente.porte,
      regime: vigente.regime,
      anexo: vigente.anexo,
      inicioEm: vigente.inicio_em,
    },
  };
});

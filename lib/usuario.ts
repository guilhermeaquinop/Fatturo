// Leitura do usuário logado no servidor. Equivale ao auth()->user() do Laravel.
// Concentrar essa leitura num lugar só é o padrão "Data Access Layer" do Next.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";

export type UsuarioAtual = {
  id: string;
  nome: string;
};

// cache() evita repetir a consulta quando vários componentes pedem o usuário na mesma requisição.
export const usuarioAtual = cache(async (): Promise<UsuarioAtual> => {
  const supabase = await createClient();

  const { data: sessao } = await supabase.auth.getClaims();
  if (!sessao?.claims) redirect(ROTA_LOGIN);

  // O RLS só deixa ler a própria linha; o filtro por id deixa a intenção explícita.
  const { data: usuario, error } = await supabase
    .from("usuario")
    .select("id, nome")
    .eq("id", sessao.claims.sub)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível ler o usuário: ${error.message}`);
  if (!usuario) redirect(ROTA_LOGIN);

  return usuario;
});

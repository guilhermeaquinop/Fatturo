// Cliente do Supabase para o navegador (Client Components).
// Não tem equivalente direto no Laravel: seria o JavaScript da página falando com a API.
//
// Atenção: o cookie de sessão é HttpOnly (veja env.ts), então este cliente NÃO enxerga
// o usuário logado e, com o RLS, não lê dados de empresa. Leituras e gravações
// autenticadas passam pelo servidor (Server Components e Server Actions, com server.ts).
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}

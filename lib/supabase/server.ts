// Cliente do Supabase para o servidor (Server Components, Server Actions e Route Handlers).
// Equivale à conexão do Eloquent já com o usuário logado: toda consulta feita por ele
// passa pelas políticas de RLS do banco.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { sessionCookieOptions, supabaseEnv } from "@/lib/supabase/env";

// Crie um cliente por requisição; nunca guarde em variável global.
export async function createClient() {
  // Sessão é dado da requisição: connection() impede o Next de pré-renderizar ou
  // guardar em cache qualquer coisa que dependa deste cliente.
  await connection();
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components não podem gravar cookies. Tudo bem: o proxy.ts
          // renova a sessão a cada requisição.
        }
      },
    },
  });
}

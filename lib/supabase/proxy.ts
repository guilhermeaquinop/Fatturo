// Renova a sessão do Supabase e aplica as regras de acesso a cada requisição.
// É a lógica chamada pelo proxy.ts da raiz; equivale ao corpo de um Middleware do Laravel.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirecionamento } from "@/lib/rotas";
import { sessionCookieOptions, supabaseEnv } from "@/lib/supabase/env";

export async function atualizarSessao(request: NextRequest) {
  const { url, publishableKey } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // Chamado quando o token é renovado: repassa os cookies novos para a
      // requisição (o que a página vai ler) e para a resposta (o que o navegador guarda).
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims: é esta chamada que
  // valida o token e renova a sessão quando ele expira.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);

  const destino = redirecionamento(request.nextUrl.pathname, logado);
  if (!destino) return response;

  const redirect = NextResponse.redirect(new URL(destino, request.url));
  // Leva junto os cookies renovados, senão a sessão se perde no redirecionamento.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

// Proxy do Next.js (até o Next 15 chamava-se middleware.ts): roda antes de cada requisição.
// Equivale a um Middleware do Laravel: renova a sessão e barra rotas protegidas.
import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  // Roda em tudo, menos arquivos estáticos e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

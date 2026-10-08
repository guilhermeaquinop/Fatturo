// Route Handler que recebe o clique nos links dos e-mails (confirmação e recuperação).
// Equivale a um método de Controller ligado a uma rota GET, como o VerifyEmailController.
// Troca o token do link por uma sessão e manda o usuário para a tela certa.
import { NextResponse, type NextRequest } from "next/server";
import { ROTA_INICIAL } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";

// O destino depende só do tipo do link; nada vem da URL, para não abrir
// brecha de redirecionamento para sites de fora.
const DESTINOS = {
  email: ROTA_INICIAL,
  recovery: "/nova-senha",
} as const;

type TipoDeLink = keyof typeof DESTINOS;

function ehTipoDeLink(valor: string | null): valor is TipoDeLink {
  return valor !== null && Object.hasOwn(DESTINOS, valor);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tipo = request.nextUrl.searchParams.get("type");

  if (tokenHash && ehTipoDeLink(tipo)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(DESTINOS[tipo], request.url));
    }
  }

  // Link inválido, expirado (1 hora) ou já usado.
  return NextResponse.redirect(new URL("/login?aviso=link-invalido", request.url));
}

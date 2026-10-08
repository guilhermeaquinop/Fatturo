// Lê as variáveis de ambiente do Supabase e as opções do cookie de sessão.
// Equivale ao config/services.php do Laravel: um lugar só para ler o .env.
import type { CookieOptionsWithName } from "@supabase/ssr";

// O Next só embute variáveis NEXT_PUBLIC_* no navegador quando o nome aparece
// por extenso, por isso elas não são lidas com process.env[nome].
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function supabaseEnv() {
  if (!url || !publishableKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local (veja .env.example).",
    );
  }
  return { url, publishableKey };
}

// Sessão em cookie HttpOnly, Secure e SameSite=Lax (especificação, "Segurança e privacidade").
// HttpOnly impede que scripts da página leiam o token de sessão.
export const sessionCookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

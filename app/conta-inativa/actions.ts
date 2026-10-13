"use server";

// Server Action da tela de conta inativa — equivale a um método de Controller que reativa
// a conta (algo como POST /conta/reativar). Só o próprio usuário, logado, reativa a sua.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROTA_INICIAL, ROTA_LOGIN } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";

export async function reativarConta(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(ROTA_LOGIN);

  const { error } = await supabase
    .from("usuario")
    .update({ inativa_em: null })
    .eq("id", data.claims.sub);
  if (error) {
    console.error("Falha ao reativar a conta:", error.code ?? error.message);
    throw new Error("Não foi possível reativar a conta agora. Tente de novo em instantes.");
  }

  revalidatePath("/", "layout");
  redirect(ROTA_INICIAL);
}

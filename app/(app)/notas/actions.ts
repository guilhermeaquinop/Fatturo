"use server";

// Server Action das notas — equivale a um método update() de um NotaFiscalController.
// A única coisa que muda numa nota importada é a situação (emitida ou cancelada).
// O RLS garante que só as notas da empresa do usuário são alcançadas.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Marca a nota como cancelada (sai do faturamento) ou desfaz o cancelamento.
 * Serve para quando a nota foi cancelada no Emissor Nacional e o XML do cancelamento
 * não está à mão. É chamada por um <form>, por isso não devolve nada: a página é refeita.
 */
export async function alterarSituacaoDaNota(
  id: string,
  situacao: "emitida" | "cancelada",
): Promise<void> {
  if (!UUID.test(id) || (situacao !== "emitida" && situacao !== "cancelada")) return;

  const supabase = await createClient();
  const { error } = await supabase.from("nota_fiscal").update({ situacao }).eq("id", id);
  if (error) {
    console.error("Falha ao alterar a situação da nota:", error.code ?? error.message);
    throw new Error("Não foi possível alterar a nota agora. Tente de novo em instantes.");
  }

  // A lista e o faturamento do painel dependem da situação.
  revalidatePath("/notas");
  revalidatePath("/painel");
}

"use server";

// Server Action do DAS — equivale ao método update() de um GuiaDasController.
// Grava o valor, o vencimento e o pagamento da guia de um mês. Valida de novo com o mesmo
// esquema Zod do formulário. O RLS garante que só as guias da empresa do usuário são tocadas.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { anoDe, hojeIso, parseDataBr } from "@/lib/datas";
import { centavosDeTexto } from "@/lib/dinheiro";
import { empresaAtual } from "@/lib/empresa";
import { limitesDoMes, mesValido } from "@/lib/regras/lancamentos";
import { ROTA_CONFIGURACAO } from "@/lib/rotas";
import { createClient } from "@/lib/supabase/server";
import { guiaDasSchema } from "@/lib/validacao/das";

export type ResultadoAcao = { erro: string } | undefined;

const ERRO_DE_CAMPOS = "Confira os campos e tente de novo.";

/** Salva a guia do mês de competência ("aaaa-mm"): cria na primeira vez, atualiza depois. */
export async function salvarGuia(competencia: string, dados: unknown): Promise<ResultadoAcao> {
  const validado = guiaDasSchema.safeParse(dados);
  if (!validado.success) return { erro: ERRO_DE_CAMPOS };

  const empresa = await empresaAtual();
  if (!empresa) redirect(ROTA_CONFIGURACAO);

  // Só meses desde a abertura da empresa até dezembro do ano atual.
  const hoje = hojeIso();
  if (
    !mesValido(competencia) ||
    competencia < empresa.dataAbertura.slice(0, 7) ||
    anoDe(`${competencia}-01`) > anoDe(hoje)
  ) {
    return { erro: "Mês de competência inválido." };
  }

  const valor = centavosDeTexto(validado.data.valor);
  const vencimento = parseDataBr(validado.data.vencimento);
  const pagoEm = validado.data.pagoEm === "" ? null : parseDataBr(validado.data.pagoEm);
  if (valor === null || !vencimento) return { erro: ERRO_DE_CAMPOS };

  // O DAS de um mês vence depois que o mês termina.
  if (vencimento <= limitesDoMes(competencia).ate) {
    return { erro: "O vencimento precisa ser depois do fim do mês de competência." };
  }

  const campos = { vencimento, valor_centavos: valor, pago_em: pagoEm };
  const dia1 = `${competencia}-01`;

  // Atualiza a guia do mês, se já existir; senão, cria. (Como um updateOrCreate.)
  const supabase = await createClient();
  const atualizacao = await supabase
    .from("guia_das")
    .update(campos)
    .eq("empresa_id", empresa.id)
    .eq("competencia", dia1)
    .select("id");
  let erro = atualizacao.error;
  if (!erro && atualizacao.data?.length === 0) {
    const criacao = await supabase
      .from("guia_das")
      .insert({ empresa_id: empresa.id, competencia: dia1, ...campos });
    erro = criacao.error;
  }

  if (erro) {
    console.error("Falha ao salvar a guia do DAS:", erro.code ?? erro.message);
    return { erro: "Não foi possível salvar agora. Tente de novo em instantes." };
  }

  // A tela do DAS e o painel (faixa de meses e linha do gráfico) dependem das guias.
  revalidatePath("/das");
  revalidatePath("/painel");
  redirect(`/das?ano=${anoDe(dia1)}`);
}

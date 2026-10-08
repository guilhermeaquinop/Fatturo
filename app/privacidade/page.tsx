// Página /privacidade, PROVISÓRIA: o texto da política de privacidade ainda não foi redigido.
// Equivale a uma rota GET que devolve uma view estática.
import type { Metadata } from "next";
import { DocumentoProvisorio } from "@/components/documento-provisorio";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return <DocumentoProvisorio titulo="Política de privacidade" />;
}

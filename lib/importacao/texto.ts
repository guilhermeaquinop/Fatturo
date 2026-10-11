// Utilitários dos leitores de extrato: decodificar o arquivo e calcular hash.
// Equivale a um helper de Service no Laravel. Roda no navegador e nos testes (Node).

/**
 * Transforma os bytes do arquivo em texto. Extratos de banco brasileiros vêm em UTF-8 ou em
 * Windows-1252 (o "ANSI" do Excel): tenta UTF-8 e, se houver byte inválido, usa Windows-1252.
 */
export function decodificarTexto(conteudo: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(conteudo);
  } catch {
    return new TextDecoder("windows-1252").decode(conteudo);
  }
}

/** SHA-256 em hexadecimal, de bytes ou de texto. */
export async function sha256(conteudo: ArrayBuffer | string): Promise<string> {
  const bytes = typeof conteudo === "string" ? new TextEncoder().encode(conteudo) : conteudo;
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Junta espaços repetidos e apara as pontas: "PIX   RECEBIDO " vira "PIX RECEBIDO". */
export function limparEspacos(texto: string): string {
  return texto.replace(/\s+/g, " ").trim();
}

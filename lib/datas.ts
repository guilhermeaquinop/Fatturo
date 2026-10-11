// Datas no formato brasileiro e no fuso de São Paulo. Equivale a helpers de Carbon no Laravel.
// No banco e entre funções, data é sempre texto ISO "aaaa-mm-dd" (coluna `date`), sem hora:
// assim ela não muda de dia por causa de fuso.

const FUSO = "America/Sao_Paulo";

/** Data de hoje em São Paulo, como "aaaa-mm-dd". */
export function hojeIso(agora: Date = new Date()): string {
  // O formato "en-CA" já devolve aaaa-mm-dd.
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}

/** Converte "dd/mm/aaaa" em "aaaa-mm-dd". Devolve null se a data não existir. */
export function parseDataBr(valor: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim());
  if (!partes) return null;

  const [dia, mes, ano] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  // O Date "corrige" datas impossíveis (31/02 vira 03/03); se mudou, a data não existe.
  const existe =
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
  return existe ? `${partes[3]}-${partes[2]}-${partes[1]}` : null;
}

/** Converte "aaaa-mm-dd" em "dd/mm/aaaa". */
export function formatarDataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Aplica a máscara dd/mm/aaaa enquanto o usuário digita. */
export function mascararData(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  let resultado = digitos.slice(0, 2);
  if (digitos.length > 2) resultado += `/${digitos.slice(2, 4)}`;
  if (digitos.length > 4) resultado += `/${digitos.slice(4, 8)}`;
  return resultado;
}

/** Ano de uma data ISO. */
export function anoDe(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Mês (1 a 12) de uma data ISO. */
export function mesDe(iso: string): number {
  return Number(iso.slice(5, 7));
}

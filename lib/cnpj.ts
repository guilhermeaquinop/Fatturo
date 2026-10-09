// Validação e máscara de CNPJ. Equivale a uma Rule de validação customizada do Laravel.
// Aceita o CNPJ numérico e o alfanumérico (letras nas 12 primeiras posições, em vigor
// desde julho de 2026). Os dois últimos caracteres são sempre dígitos verificadores.

const PESOS_PRIMEIRO_DV = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO_DV = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** Remove a máscara: devolve só letras maiúsculas e dígitos, no máximo 14. */
export function limparCnpj(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);
}

// Regra oficial: cada caractere vale o código ASCII menos 48 (0-9 valem 0-9, A vale 17...).
function digitoVerificador(base: string, pesos: number[]): number {
  const soma = [...base].reduce(
    (total, caractere, indice) => total + (caractere.charCodeAt(0) - 48) * pesos[indice],
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Confere formato e dígitos verificadores. Aceita o valor com ou sem máscara. */
export function validarCnpj(valor: string): boolean {
  const cnpj = limparCnpj(valor);
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) return false;
  // Sequências de um caractere só (00000000000000) passam na conta, mas não existem.
  if (/^(.)\1{13}$/.test(cnpj)) return false;

  const primeiro = digitoVerificador(cnpj.slice(0, 12), PESOS_PRIMEIRO_DV);
  const segundo = digitoVerificador(cnpj.slice(0, 12) + primeiro, PESOS_SEGUNDO_DV);
  return cnpj.endsWith(`${primeiro}${segundo}`);
}

/** Aplica a máscara 00.000.000/0000-00, inclusive enquanto o usuário digita. */
export function mascararCnpj(valor: string): string {
  const cnpj = limparCnpj(valor);
  let resultado = cnpj.slice(0, 2);
  if (cnpj.length > 2) resultado += `.${cnpj.slice(2, 5)}`;
  if (cnpj.length > 5) resultado += `.${cnpj.slice(5, 8)}`;
  if (cnpj.length > 8) resultado += `/${cnpj.slice(8, 12)}`;
  if (cnpj.length > 12) resultado += `-${cnpj.slice(12, 14)}`;
  return resultado;
}

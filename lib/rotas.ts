// Regras de acesso às rotas: quais são públicas e para onde mandar cada visitante.
// Equivale aos grupos de rota com middleware 'auth' e 'guest' do routes/web.php.

export const ROTA_LOGIN = "/login";
// Destino depois do login. A etapa 2 implementa a configuração da empresa.
export const ROTA_INICIAL = "/configuracao";

// Só para quem NÃO está logado (middleware 'guest'): logado é mandado ao app.
const ROTAS_DE_VISITANTE = ["/login", "/cadastro", "/recuperar-senha"];

// Abertas para todos, logados ou não.
const ROTAS_ABERTAS = ["/auth/confirm", "/termos", "/privacidade"];

function pertence(pathname: string, rotas: string[]) {
  return rotas.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

/**
 * Decide se a requisição deve ser redirecionada.
 * Devolve o caminho de destino, ou null para seguir normalmente.
 * Qualquer rota fora das listas acima exige login.
 */
export function redirecionamento(pathname: string, logado: boolean): string | null {
  if (pathname === "/") return logado ? ROTA_INICIAL : ROTA_LOGIN;
  if (pertence(pathname, ROTAS_ABERTAS)) return null;
  if (pertence(pathname, ROTAS_DE_VISITANTE)) return logado ? ROTA_INICIAL : null;
  return logado ? null : ROTA_LOGIN;
}

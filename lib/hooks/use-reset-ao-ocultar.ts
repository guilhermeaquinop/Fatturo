// Hook que limpa um formulário quando a página sai da tela.
// Não tem equivalente no Laravel, onde cada página é carregada do zero. O Next mantém
// as últimas páginas visitadas ocultas, com o estado preservado; sem esta limpeza,
// senhas digitadas e mensagens de erro continuariam lá ao voltar.
import { useEffect, useLayoutEffect, useRef } from "react";

export function useResetAoOcultar(reset: () => void) {
  const resetAtual = useRef(reset);
  useEffect(() => {
    resetAtual.current = reset;
  });

  // A função devolvida por um efeito roda quando o componente é ocultado ou removido.
  useLayoutEffect(() => () => resetAtual.current(), []);
}

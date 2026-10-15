// Hook do "ocultar valores" para componentes do navegador ("use client"). Equivale a um
// pedaço de Alpine que lê e grava uma preferência. O estado fica no atributo data-valores
// do <html> e no localStorage; o CSS de app/globals.css faz o resto.
import { useSyncExternalStore } from "react";
import { CHAVE_VALORES_OCULTOS } from "@/lib/valores-ocultos";

function aplicar(ocultos: boolean) {
  if (ocultos) document.documentElement.dataset.valores = "ocultos";
  else delete document.documentElement.dataset.valores;
}

/** Troca a escolha e a guarda no aparelho. */
export function definirValoresOcultos(ocultos: boolean) {
  aplicar(ocultos);
  try {
    localStorage.setItem(CHAVE_VALORES_OCULTOS, ocultos ? "ocultos" : "visiveis");
  } catch {
    // Navegação privada pode bloquear o localStorage: vale só para esta página.
  }
}

function inscrever(avisar: () => void) {
  // Acompanha o atributo (outros botões desta página) e o localStorage (outras abas).
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-valores"] });
  const outraAba = (evento: StorageEvent) => {
    if (evento.key === CHAVE_VALORES_OCULTOS) aplicar(evento.newValue === "ocultos");
  };
  window.addEventListener("storage", outraAba);
  return () => {
    observador.disconnect();
    window.removeEventListener("storage", outraAba);
  };
}

/** true quando os valores estão ocultos. No servidor, sempre false. */
export function useValoresOcultos(): boolean {
  return useSyncExternalStore(
    inscrever,
    () => document.documentElement.dataset.valores === "ocultos",
    () => false,
  );
}

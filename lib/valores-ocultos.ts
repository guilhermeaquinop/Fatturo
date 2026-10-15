// Onde fica guardado o "ocultar valores" e o script que o aplica ao carregar a página.
// Equivale a uma preferência na sessão do Laravel, só que no navegador (localStorage).
// Este arquivo serve ao servidor e ao navegador; o hook fica em lib/use-valores-ocultos.ts.

export const CHAVE_VALORES_OCULTOS = "fatturo:valores";

/**
 * Script do <head>: aplica a escolha antes de a página aparecer, para os valores não
 * piscarem visíveis ao carregar. Texto puro porque roda antes do React.
 */
export const SCRIPT_DE_VALORES_OCULTOS = `try{if(localStorage.getItem("${CHAVE_VALORES_OCULTOS}")==="ocultos")document.documentElement.dataset.valores="ocultos"}catch(e){}`;

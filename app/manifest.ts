// Manifest do app: nome, ícones e como abrir quando instalado na tela inicial.
// Equivale a um arquivo estático em public/, gerado aqui para ficar junto do código.
// O Next o publica em /manifest.webmanifest e liga a tag <link rel="manifest"> sozinho.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fatturo",
    short_name: "Fatturo",
    description: "Faturamento, limite do regime e DAS de MEI e ME num painel só.",
    lang: "pt-BR",
    start_url: "/painel",
    // Abre em tela cheia, sem a barra do navegador.
    display: "standalone",
    // Cores do token surface.
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icones/fatturo-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/fatturo-512.png", sizes: "512x512", type: "image/png" },
      // O símbolo ocupa o centro do quadrado, então o Android pode recortar em círculo.
      { src: "/icones/fatturo-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

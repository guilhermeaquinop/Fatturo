// Layout raiz: envolve todas as páginas. Equivale ao layouts/app.blade.php do Laravel.
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SCRIPT_DE_VALORES_OCULTOS } from "@/lib/valores-ocultos";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Fatturo", template: "%s · Fatturo" },
  description: "Faturamento, limite do regime e DAS de MEI e ME num painel só.",
  // Atalho na tela inicial do iPhone: abre em tela cheia, como app, com o nome "Fatturo"
  // (sem isso, ele usa o título da página aberta). O ícone é o app/apple-icon.png, que o
  // Next liga sozinho pelo nome do arquivo; o app/manifest.ts faz o mesmo no Android.
  appleWebApp: { capable: true, title: "Fatturo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  // Deixa o conteúdo chegar às bordas do iPhone; as barras do app usam env(safe-area-inset-*)
  // para não ficarem embaixo do indicador de início.
  viewportFit: "cover",
  // Cor da barra do navegador e do app instalado: o token surface.
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // O script abaixo pode pôr data-valores no <html> antes do React: o aviso de diferença
    // entre servidor e navegador é esperado só nesse atributo.
    <html lang="pt-BR" className={montserrat.variable} suppressHydrationWarning>
      <head>
        {/* Aplica o "ocultar valores" guardado no aparelho antes de a página aparecer. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_VALORES_OCULTOS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

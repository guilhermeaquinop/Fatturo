// Layout raiz: envolve todas as páginas. Equivale ao layouts/app.blade.php do Laravel.
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
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
  // Nome do atalho na tela inicial do iPhone; sem isso, ele usa o título da página aberta.
  // O ícone do atalho é o app/apple-icon.png, que o Next liga sozinho pelo nome do arquivo.
  appleWebApp: { title: "Fatturo" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zapfaturamento.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ZapFaturamento",
  description:
    "CRM, tracking, WhatsApp, faturamento e ROAS para operacoes que vendem por conversa.",
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    url: siteUrl
  },
  icons: {
    icon: [
      { url: "/images/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/images/favicon.png", sizes: "96x96", type: "image/png" }
    ],
    shortcut: "/images/favicon.png",
    apple: [
      { url: "/images/favicon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="app-body">{children}</body>
    </html>
  );
}

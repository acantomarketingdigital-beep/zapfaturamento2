import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppSidebar from "@/components/layout/AppSidebar";
import MainContent from "@/components/layout/MainContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://whats.kreotechnologies.com.br";

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Whats Redirect",
  description:
    "CRM, tracking, WhatsApp, faturamento e ROAS para operacoes que vendem por conversa.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    url: siteUrl,
  },
  icons: {
    icon: [
      { url: "/images/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/images/favicon.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/images/favicon.png",
    apple: [{ url: "/images/favicon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-[#020817] text-slate-200 antialiased">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </body>
    </html>
  );
}

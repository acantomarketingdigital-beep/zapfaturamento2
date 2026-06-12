"use client";

import { usePathname } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":                          { title: "Dashboard",       subtitle: "Visão consolidada — Leads + Campanhas + WhatsApp" },
  "/dashboard/kanban":                   { title: "Kanban",          subtitle: "Pipeline de leads e vendas" },
  "/dashboard/pipeline":                 { title: "Pipeline",        subtitle: "Funil de conversão" },
  "/dashboard/inbox":                    { title: "Conversas",       subtitle: "Inbox WhatsApp" },
  "/dashboard/clinicas":                 { title: "Clientes",        subtitle: "Gestão de clientes" },
  "/dashboard/campanhas":                { title: "Campanhas",       subtitle: "Campanhas de marketing" },
  "/dashboard/criativos":                { title: "Criativos",       subtitle: "Gestão de criativos" },
  "/dashboard/formularios":              { title: "Lead Express",    subtitle: "Formulários de captura" },
  "/dashboard/disparos":                 { title: "Envios em Massa", subtitle: "Disparos via WhatsApp" },
  "/dashboard/grupos":                   { title: "Grupos",          subtitle: "Grupos de campanha" },
  "/dashboard/respostas-rapidas":        { title: "Respostas Rápidas", subtitle: "Templates de resposta" },
  "/dashboard/exportar":                 { title: "Exportar Leads",  subtitle: "Exportação de dados" },
  "/dashboard/relatorio":                { title: "Relatórios",      subtitle: "Análise de resultados" },
  "/dashboard/financeiro":               { title: "Financeiro",      subtitle: "Visão financeira" },
  "/dashboard/investimentos":            { title: "Investimentos",   subtitle: "Gestão de investimentos" },
  "/dashboard/academia":                 { title: "Como Usar",       subtitle: "Guia de configuração" },
  "/dashboard/usuarios":                 { title: "Equipe",          subtitle: "Gestão de usuários" },
  "/dashboard/configuracoes":            { title: "Configurações",   subtitle: "Configurações gerais" },
  "/dashboard/configuracoes/whatsapp":   { title: "Conexões",        subtitle: "WhatsApp e integrações" },
  "/dashboard/configuracoes/workspace":  { title: "Workspace",       subtitle: "Configurações do workspace" },
  "/dashboard/assinatura":               { title: "Assinatura",      subtitle: "Plano e cobrança" },
  "/dashboard/suporte":                  { title: "Suporte",         subtitle: "Central de ajuda" },
  "/dashboard/performance":              { title: "Performance",     subtitle: "Desempenho de campanhas" },
  "/dashboard/admin/business":           { title: "Admin",           subtitle: "Administração" },
};

export default function DashboardHeader() {
  const pathname = usePathname();

  const isPublic =
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/assinatura");
  if (isPublic) return null;

  // Find longest matching prefix
  const matched = Object.keys(TITLES)
    .filter((k) => pathname === k || pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const { title, subtitle } = TITLES[matched] ?? { title: "Dashboard", subtitle: "" };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 bg-[#020817]/80 backdrop-blur-sm px-4 md:px-8 py-3 md:py-4">
      <div>
        <h1 className="text-base font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-3 w-3" />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Insights IA</span>
        </button>
      </div>
    </header>
  );
}

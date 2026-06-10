import type { SummaryMetrics } from "@/lib/leads";
import { cn } from "@/lib/utils";

type SummaryCardsProps = { summary: SummaryMetrics };

type CardDef = {
  label: string;
  value: string | number;
  sub: string;
  variant: "default" | "cyan" | "blue" | "green";
  icon: React.ReactNode;
};

function StatCard({ label, value, sub, variant, icon }: CardDef) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all group",
        variant === "cyan"
          ? "border-cyan-400/25 bg-gradient-to-br from-cyan-400/8 to-blue-600/5 hover:border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.05)]"
          : variant === "blue"
          ? "border-blue-500/25 bg-gradient-to-br from-blue-500/8 to-indigo-600/5 hover:border-blue-500/40"
          : variant === "green"
          ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 to-teal-600/5 hover:border-emerald-500/40"
          : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80"
      )}
    >
      {variant !== "default" && (
        <div
          className={cn(
            "absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20",
            variant === "cyan" ? "bg-cyan-400" : variant === "blue" ? "bg-blue-500" : "bg-emerald-500"
          )}
        />
      )}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-2.5 text-2xl font-bold tracking-tight",
              variant === "cyan"
                ? "text-cyan-400"
                : variant === "blue"
                ? "text-blue-400"
                : variant === "green"
                ? "text-emerald-400"
                : "text-slate-100"
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            variant === "cyan"
              ? "bg-cyan-400/15 text-cyan-400"
              : variant === "blue"
              ? "bg-blue-500/15 text-blue-400"
              : variant === "green"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-slate-800 text-slate-400"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

const TrendIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);
const MetaIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);
const GoogleIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 20, height: 20 }}>
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards: CardDef[] = [
    {
      label: "Total de Leads",
      value: summary.totalLeads,
      sub: `${summary.leadsToday} hoje · ${summary.leadsLast7Days} nos últimos 7 dias`,
      variant: "default",
      icon: <UsersIcon />,
    },
    {
      label: "Meta Ads",
      value: summary.metaAdsLeads,
      sub: "Leads via Meta Ads",
      variant: "blue",
      icon: <MetaIcon />,
    },
    {
      label: "Google Ads",
      value: summary.googleAdsLeads,
      sub: "Leads via Google Ads",
      variant: "default",
      icon: <GoogleIcon />,
    },
    {
      label: "Enviaram WA",
      value: summary.leadsExportaveis,
      sub: "Abriram o WhatsApp",
      variant: "cyan",
      icon: <WaIcon />,
    },
    {
      label: "Agendados",
      value: summary.leadsAgendados,
      sub: `${summary.leadsFechados} fechados`,
      variant: "green",
      icon: <CheckIcon />,
    },
    {
      label: "Leads Hoje",
      value: summary.leadsToday,
      sub: "Entradas nas últimas 24h",
      variant: "default",
      icon: <ClockIcon />,
    },
    {
      label: "Últimos 7 Dias",
      value: summary.leadsLast7Days,
      sub: "Total na semana",
      variant: "default",
      icon: <TrendIcon />,
    },
    {
      label: "Taxa CRM",
      value: `${summary.kommoSuccessRate.toFixed(1)}%`,
      sub: "Taxa de sucesso CRM",
      variant: "default",
      icon: <CheckIcon />,
    },
    {
      label: "Fechados",
      value: summary.leadsFechados,
      sub: "Leads convertidos",
      variant: "green",
      icon: <CheckIcon />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

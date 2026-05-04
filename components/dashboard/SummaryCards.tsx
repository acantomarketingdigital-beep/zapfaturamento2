import type { SummaryMetrics } from "@/lib/leads";

type SummaryCardsProps = {
  summary: SummaryMetrics;
};

const ICONS = {
  brand: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: "#128C7E" }}>
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  neutral: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: "#64748B" }}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: "#2563EB" }}>
      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: "#EA580C" }}>
      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: "#059669" }}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
} as const;

type Tone = keyof typeof ICONS;

const cardItems = (summary: SummaryMetrics) => [
  { label: "Total de leads", value: summary.totalLeads, tone: "brand" as Tone },
  { label: "Leads hoje", value: summary.leadsToday, tone: "neutral" as Tone },
  { label: "Ultimos 7 dias", value: summary.leadsLast7Days, tone: "neutral" as Tone },
  { label: "Meta Ads", value: summary.metaAdsLeads, tone: "meta" as Tone },
  { label: "Google Ads", value: summary.googleAdsLeads, tone: "google" as Tone },
  {
    label: "Sucesso CRM",
    value: `${summary.kommoSuccessRate.toFixed(1)}%`,
    tone: "success" as Tone
  },
  { label: "Agendados", value: summary.leadsAgendados, tone: "success" as Tone },
  { label: "Fechados", value: summary.leadsFechados, tone: "brand" as Tone },
  { label: "Exportaveis", value: summary.leadsExportaveis, tone: "google" as Tone }
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="dashboard-stats-grid">
      {cardItems(summary).map((item) => (
        <article
          key={item.label}
          className={`dashboard-stat-card dashboard-stat-card--${item.tone}`}
        >
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {ICONS[item.tone]}
        </article>
      ))}
    </section>
  );
}

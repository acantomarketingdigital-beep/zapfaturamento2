import { getCreativeHighlights } from "@/lib/highlights";
import type { CreativeHighlight } from "@/lib/highlights";

type Props = {
  clientSlug?: string | null;
};

function HighlightCard({
  icon,
  label,
  highlight
}: {
  icon: string;
  label: string;
  highlight: CreativeHighlight;
}) {
  return (
    <div className="creative-highlight-card">
      <div className="creative-highlight-card__icon">{icon}</div>
      <div className="creative-highlight-card__body">
        <span className="creative-highlight-card__label">{label}</span>
        <strong className="creative-highlight-card__name">{highlight.campaign_name}</strong>
        <div className="creative-highlight-card__stats">
          <span>{highlight.total_leads} leads</span>
          {highlight.total_agendados > 0 && (
            <span>{highlight.total_agendados} agendados</span>
          )}
          {highlight.total_fechados > 0 && (
            <span className="creative-highlight-card__badge">{highlight.total_fechados} fechados</span>
          )}
        </div>
        {highlight.creative_url ? (
          <a
            href={highlight.creative_url}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-button dashboard-button--ghost creative-highlight-card__cta"
          >
            Ver criativo
          </a>
        ) : null}
      </div>
    </div>
  );
}

export async function CreativeHighlights({ clientSlug }: Props) {
  const { champion, mostLeads } = await getCreativeHighlights(clientSlug);

  if (!champion && !mostLeads) return null;

  return (
    <section>
      <div className="dashboard-section-divider">
        <span>Destaques de criativos</span>
      </div>
      <div className="creative-highlights">
        {champion ? (
          <HighlightCard icon="🏆" label="Criativo campeao" highlight={champion} />
        ) : null}
        {mostLeads && mostLeads.campaign_slug !== champion?.campaign_slug ? (
          <HighlightCard icon="🚀" label="Mais leads" highlight={mostLeads} />
        ) : null}
      </div>
    </section>
  );
}

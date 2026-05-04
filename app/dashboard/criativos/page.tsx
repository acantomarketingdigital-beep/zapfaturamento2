import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getCurrentUser, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";
import { formatCurrencyFromCents, formatPercent } from "@/lib/format";
import { getCreativesData, type CreativeRow, type CreativeBadge } from "@/lib/creatives";
import { getAllCreatives, getPlacementsData, type AllCreativeRow, type PlacementRow } from "@/lib/creatives-performance";
import { listManagedClinics } from "@/lib/clinics";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function param(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const SEAL_CONFIG: Record<CreativeBadge, { label: string; emoji: string; cls: string }> = {
  champion:      { label: "Campeao de vendas",    emoji: "🏆", cls: "criativo-seal--champion" },
  mostLeads:     { label: "Mais leads",            emoji: "🚀", cls: "criativo-seal--leads" },
  mostAgendados: { label: "Mais agendamentos",     emoji: "📅", cls: "criativo-seal--agendados" }
};

const TOP3_CONFIG = [
  { emoji: "🥇", label: "1º lugar", color: "#b45309" },
  { emoji: "🥈", label: "2º lugar", color: "#6b7280" },
  { emoji: "🥉", label: "3º lugar", color: "#92400e" },
];

function Seals({ badges }: { badges: CreativeBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="criativo-seals">
      {badges.map((b) => (
        <span key={b} className={`criativo-seal ${SEAL_CONFIG[b].cls}`}>
          {SEAL_CONFIG[b].emoji} {SEAL_CONFIG[b].label}
        </span>
      ))}
    </div>
  );
}

function VerCriativo({ url, small }: { url: string | null; small?: boolean }) {
  const base = `dashboard-button${small ? " dashboard-button--sm" : ""}`;
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={base}>
        Ver criativo
      </a>
    );
  }
  return (
    <button
      disabled
      className={`dashboard-button dashboard-button--ghost${small ? " dashboard-button--sm" : ""}`}
      style={{ opacity: 0.4, cursor: "default" }}
    >
      Sem link
    </button>
  );
}

function RankPos({ rank }: { rank: number }) {
  return (
    <span className={`criativos-rank-pos${rank <= 3 ? ` criativos-rank-pos--${rank}` : ""}`}>
      {rank}
    </span>
  );
}

function Dash() {
  return <span style={{ color: "var(--muted)" }}>—</span>;
}

function Top3Card({ row, position }: { row: AllCreativeRow; position: number }) {
  const cfg = TOP3_CONFIG[position - 1];
  const taxaAg = row.taxa_agendamento > 0 ? `${row.taxa_agendamento}%` : "—";
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        minWidth: 240
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "1.5rem" }}>{cfg.emoji}</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: cfg.color }}>{cfg.label}</span>
      </div>

      <div>
        <div style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 }}>
          {row.creative_name}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
          {row.campaign_name}
          {" · "}
          <span style={{ opacity: 0.7 }}>{row.client_slug}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "1.4rem", color: "var(--brand-dark)" }}>{row.leads}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>leads</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>{row.agendados}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>agendados</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>{row.fechados}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>fechados</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "1.4rem" }}>{taxaAg}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>taxa ag.</div>
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
        <VerCriativo url={row.ad_url} small />
      </div>
    </div>
  );
}

function PlacementLabel({ placement }: { placement: string }) {
  const labels: Record<string, string> = {
    facebook_feed:       "Facebook Feed",
    instagram_feed:      "Instagram Feed",
    instagram_stories:   "Instagram Stories",
    instagram_reels:     "Instagram Reels",
    facebook_stories:    "Facebook Stories",
    audience_network:    "Audience Network",
    messenger_inbox:     "Messenger",
    "Nao identificado":  "Nao identificado",
  };
  return <>{labels[placement] ?? placement}</>;
}

export default async function CriativosPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  const scopeClientSlug = user.clientSlug;
  const params = await searchParams;

  const clientSlug = scopeClientSlug || param(params.clientSlug) || null;
  const dateStart = param(params.dateStart) || null;
  const dateEnd = param(params.dateEnd) || null;
  const groupByBaseName = param(params.groupByBaseName) === "1";

  const perfOpts = { clientSlug, dateStart, dateEnd };

  const [clients, creativesResult, allCreatives, placements] = await Promise.all([
    listManagedClinics("", scopeClientSlug),
    getCreativesData({ clientSlug, dateStart, dateEnd, groupByBaseName }),
    getAllCreatives(perfOpts),
    getPlacementsData(perfOpts),
  ]);

  const { rows, champion, mostLeads, mostAgendados } = creativesResult;

  // Top 3 by leads
  const top3 = [...allCreatives]
    .filter((c) => c.leads > 0)
    .sort((a, b) =>
      b.leads !== a.leads ? b.leads - a.leads :
      b.agendados !== a.agendados ? b.agendados - a.agendados :
      b.fechados - a.fechados
    )
    .slice(0, 3);

  const hasData = rows.length > 0 || allCreatives.some((c) => c.leads > 0);

  // Deduplicate campaign highlight cards
  const shownHighlightKeys = new Set<string>();
  function takeHighlight(row: CreativeRow | null): CreativeRow | null {
    if (!row) return null;
    const k = `${row.client_slug}::${row.campaign_key}`;
    if (shownHighlightKeys.has(k)) return null;
    shownHighlightKeys.add(k);
    return row;
  }
  const shownChampion = takeHighlight(champion);
  const shownLeads = takeHighlight(mostLeads);
  const shownAgendados = takeHighlight(mostAgendados);

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePath="/dashboard/criativos"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">Inteligencia</span>
            <h2>Inteligencia de Criativos</h2>
            <p>
              Descubra quais criativos geram mais leads, agendamentos e vendas.
              Tome decisoes rapidas sobre o que escalar.
            </p>
          </div>
        </header>

        {/* ── Filters ── */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>Filtros</h2>
          </div>
          <form method="get" action="/dashboard/criativos" className="dashboard-form-grid">
            {user.role === "agency_admin" ? (
              <label className="dashboard-field">
                <span>Cliente</span>
                <select name="clientSlug" defaultValue={clientSlug || ""}>
                  <option value="">Todos os clientes</option>
                  {clients.map((c) => (
                    <option key={c.clientSlug} value={c.clientSlug}>
                      {c.clientName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="dashboard-field">
              <span>Data inicio</span>
              <input type="date" name="dateStart" defaultValue={dateStart || ""} />
            </label>

            <label className="dashboard-field">
              <span>Data fim</span>
              <input type="date" name="dateEnd" defaultValue={dateEnd || ""} />
            </label>

            <label className={`compact-checkbox-card${groupByBaseName ? " compact-checkbox-card--active" : ""}`}>
              <input
                type="checkbox"
                name="groupByBaseName"
                value="1"
                defaultChecked={groupByBaseName}
              />
              <div>
                <div className="compact-checkbox-card__label">Agrupar campanhas pelo nome base</div>
                <div className="compact-checkbox-card__desc">
                  Unifica variacoes como &ldquo;vasinhos A&rdquo;, &ldquo;vasinhos B&rdquo; em apenas &ldquo;vasinhos&rdquo;.
                </div>
              </div>
            </label>

            <div className="dashboard-actions dashboard-field--full">
              <button type="submit" className="dashboard-button">
                Aplicar filtros
              </button>
            </div>
          </form>
        </article>

        {!hasData ? (
          <div className="criativos-empty-wrap">
            <div className="criativos-empty">
              <div className="criativos-empty__icon">🎯</div>
              <div className="criativos-empty__title">
                Ainda nao ha dados suficientes para destacar criativos.
              </div>
              <p className="criativos-empty__desc">
                Cadastre campanhas, adicione o link do criativo e acompanhe os leads no Kanban
                para gerar inteligencia automatica.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── TOP 3 ── */}
            {top3.length > 0 ? (
              <>
                <div className="dashboard-section-divider">
                  <span>Top 3 Criativos</span>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
                  {top3.map((row, idx) => (
                    <Top3Card key={row.creative_id} row={row} position={idx + 1} />
                  ))}
                </div>
              </>
            ) : null}

            {/* ── PLACEMENTS ── */}
            {placements.length > 0 ? (
              <>
                <div className="dashboard-section-divider">
                  <span>Melhores posicionamentos</span>
                </div>
                <article className="dashboard-card">
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Posicionamento</th>
                          <th>Leads</th>
                          <th>Agendados</th>
                          <th>Fechados</th>
                          <th>Taxa ag.</th>
                          <th>Taxa fech.</th>
                          <th>Melhor criativo</th>
                          <th>Leads criativo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {placements.map((p) => (
                          <tr key={p.placement}>
                            <td>
                              <strong><PlacementLabel placement={p.placement} /></strong>
                            </td>
                            <td><strong style={{ color: "var(--brand-dark)" }}>{p.leads}</strong></td>
                            <td>{p.agendados > 0 ? p.agendados : <Dash />}</td>
                            <td>{p.fechados > 0 ? <strong>{p.fechados}</strong> : <Dash />}</td>
                            <td>{p.taxa_agendamento > 0 ? `${p.taxa_agendamento}%` : <Dash />}</td>
                            <td>{p.taxa_fechamento > 0 ? `${p.taxa_fechamento}%` : <Dash />}</td>
                            <td>
                              {p.best_creative_name ? (
                                <span style={{ fontSize: "0.85rem" }}>{p.best_creative_name}</span>
                              ) : <Dash />}
                            </td>
                            <td>
                              {p.best_creative_leads > 0 ? p.best_creative_leads : <Dash />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </>
            ) : null}

            {/* ── ALL CREATIVES ── */}
            <div className="dashboard-section-divider">
              <span>Todos os criativos</span>
            </div>
            <article className="dashboard-card">
              {allCreatives.length === 0 ? (
                <p style={{ color: "var(--muted)", padding: "16px 0" }}>
                  Nenhum criativo cadastrado ainda.
                </p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Criativo</th>
                        <th>Campanha</th>
                        {user.role === "agency_admin" ? <th>Cliente</th> : null}
                        <th>Leads</th>
                        <th>Agendados</th>
                        <th>Fechados</th>
                        <th>Taxa ag.</th>
                        <th>Taxa fech.</th>
                        <th>Acao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCreatives.map((row, idx) => (
                        <tr key={row.creative_id}>
                          <td>
                            <RankPos rank={idx + 1} />
                          </td>
                          <td>
                            <strong>{row.creative_name}</strong>
                          </td>
                          <td style={{ fontSize: "0.85rem" }}>{row.campaign_name}</td>
                          {user.role === "agency_admin" ? (
                            <td style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{row.client_slug}</td>
                          ) : null}
                          <td>{row.leads > 0 ? <strong style={{ color: "var(--brand-dark)" }}>{row.leads}</strong> : <Dash />}</td>
                          <td>{row.agendados > 0 ? row.agendados : <Dash />}</td>
                          <td>{row.fechados > 0 ? <strong>{row.fechados}</strong> : <Dash />}</td>
                          <td>{row.taxa_agendamento > 0 ? `${row.taxa_agendamento}%` : <Dash />}</td>
                          <td>{row.taxa_fechamento > 0 ? `${row.taxa_fechamento}%` : <Dash />}</td>
                          <td><VerCriativo url={row.ad_url} small /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            {/* ── CAMPAIGN RANKING (existing) ── */}
            {rows.length > 0 ? (
              <>
                <div className="dashboard-section-divider">
                  <span>Ranking por campanha</span>
                </div>

                {/* Campaign highlight cards */}
                <div className="criativos-highlights">
                  {shownChampion ? (
                    <HighlightCard
                      row={shownChampion}
                      badge="champion"
                      metricValue={shownChampion.fechados}
                      metricLabel="fechados"
                      stats={[
                        { value: formatPercent(shownChampion.taxa_conversao), label: "taxa de fechamento" },
                        { value: String(shownChampion.leads), label: "leads" }
                      ]}
                    />
                  ) : null}

                  {shownLeads ? (
                    <HighlightCard
                      row={shownLeads}
                      badge="mostLeads"
                      metricValue={shownLeads.leads}
                      metricLabel="leads"
                      stats={[
                        { value: String(shownLeads.agendados), label: "agendados" },
                        { value: formatPercent(shownLeads.taxa_agendamento), label: "taxa de agendamento" }
                      ]}
                    />
                  ) : null}

                  {shownAgendados ? (
                    <HighlightCard
                      row={shownAgendados}
                      badge="mostAgendados"
                      metricValue={shownAgendados.agendados}
                      metricLabel="agendamentos"
                      stats={[
                        { value: formatPercent(shownAgendados.taxa_agendamento), label: "taxa de agendamento" },
                        { value: String(shownAgendados.leads), label: "leads" }
                      ]}
                    />
                  ) : null}
                </div>

                <article className="dashboard-card" style={{ marginTop: 16 }}>
                  <div className="dashboard-table-wrap">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th style={{ width: 48 }}>#</th>
                          <th>Campanha</th>
                          <th>Leads</th>
                          <th>Agendados</th>
                          <th>Fechados</th>
                          <th>Taxa ag.</th>
                          <th>Taxa fech.</th>
                          <th>Investimento</th>
                          <th>ROAS</th>
                          <th>Acao</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={`${row.client_slug}-${row.campaign_key}`}>
                            <td><RankPos rank={row.rank} /></td>
                            <td>
                              <strong>{row.campaign_name || row.campaign_key || "Sem campanha"}</strong>
                              {row.badges.length > 0 ? <Seals badges={row.badges} /> : null}
                              {user.role === "agency_admin" ? (
                                <div className="dashboard-table__sub">{row.client_slug}</div>
                              ) : null}
                            </td>
                            <td>{row.leads > 0 ? row.leads : <Dash />}</td>
                            <td>{row.agendados > 0 ? row.agendados : <Dash />}</td>
                            <td>
                              {row.fechados > 0 ? (
                                <strong style={{ color: "var(--brand-dark)" }}>{row.fechados}</strong>
                              ) : <Dash />}
                            </td>
                            <td>{row.taxa_agendamento > 0 ? formatPercent(row.taxa_agendamento) : <Dash />}</td>
                            <td>{row.taxa_conversao > 0 ? formatPercent(row.taxa_conversao) : <Dash />}</td>
                            <td>{row.investment_cents > 0 ? formatCurrencyFromCents(row.investment_cents) : <Dash />}</td>
                            <td>{row.roas > 0 ? <strong>{row.roas.toFixed(2)}x</strong> : <Dash />}</td>
                            <td><VerCriativo url={row.creative_url} small /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              </>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type HighlightCardProps = {
  row: CreativeRow;
  badge: CreativeBadge;
  metricValue: number | string;
  metricLabel: string;
  stats: { label: string; value: string }[];
};

function HighlightCard({ row, badge, metricValue, metricLabel, stats }: HighlightCardProps) {
  const cfg = SEAL_CONFIG[badge];
  return (
    <div className={`criativos-card criativos-card--${badge}`}>
      <div className="criativos-card__top">
        <span className={`criativo-seal ${cfg.cls}`}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>
      <div className="criativos-card__name">
        {row.campaign_name || row.campaign_key || "Sem campanha"}
      </div>
      <div className="criativos-card__metric">
        <strong>{metricValue}</strong>
        <span>{metricLabel}</span>
      </div>
      <div className="criativos-card__stats">
        {stats.map((s) => (
          <span key={s.label}>
            <b>{s.value}</b> {s.label}
          </span>
        ))}
      </div>
      <div className="criativos-card__footer">
        <VerCriativo url={row.creative_url} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/kanban-shared";
import type { KanbanLead } from "@/lib/kanban";
import { formatCurrencyFromCents } from "@/lib/format";
import { formatLeadPhone } from "@/lib/phone";

type KanbanBoardProps = { leads: KanbanLead[]; trafficOnly?: boolean };

type FilterType = "all" | "not_replied" | "replied" | "stale" | "urgent" | "follow_up_pending";
type ChannelFilter = "all" | "whatsapp" | "instagram" | "messenger";

const STATUS_ORDER = [
  "novo_lead", "em_atendimento", "agendado", "compareceu",
  "negociacao", "pagamento_pendente", "pago", "finalizado", "perdido"
] as const satisfies LeadStatus[];

const EXPORTABLE_STATUSES: LeadStatus[] = [
  "agendado", "compareceu", "negociacao", "pago", "finalizado"
];

// ─── helpers ────────────────────────────────────────────────────────────────

function getChannelBadge(lead: KanbanLead): { cls: string; label: string } {
  if (lead.channel === "instagram") return { cls: "kanban-platform-badge kanban-platform-badge--instagram", label: "Instagram" };
  if (lead.channel === "messenger") return { cls: "kanban-platform-badge kanban-platform-badge--messenger", label: "Messenger" };
  const s = (lead.source_platform || "").toLowerCase();
  if (s.includes("meta") || s.includes("facebook")) return { cls: "kanban-platform-badge kanban-platform-badge--meta", label: "Meta" };
  if (s.includes("google")) return { cls: "kanban-platform-badge kanban-platform-badge--google", label: "Google" };
  return { cls: "kanban-platform-badge kanban-platform-badge--organic", label: "Organico" };
}
function cleanUtm(v: string | null | undefined): string | null {
  if (!v) return null;
  if (v.includes("{")) return null;
  return v.trim() || null;
}
function formatEntryDate(iso: string): string {
  const d = new Date(iso), now = new Date();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `hoje às ${time}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + ` às ${time}`;
}
function getStaleness(lead: KanbanLead, now: Date): "none" | "stale" | "urgent" {
  if (lead.has_replied) return "none";
  const ms = now.getTime() - new Date(lead.created_at).getTime();
  if (ms >= 3_600_000) return "urgent";
  if (ms >= 900_000) return "stale";
  return "none";
}
function formatStaleLabel(lead: KanbanLead, now: Date): string {
  const ms = now.getTime() - new Date(lead.created_at).getTime();
  const mins = Math.floor(ms / 60_000);
  const h = Math.floor(mins / 60);
  if (h >= 1) return `${h}h sem resposta`;
  return `${mins}min sem resposta`;
}
function isFollowUpPending(lead: KanbanLead, now: Date): boolean {
  return !!(lead.follow_up_at && !lead.follow_up_done && new Date(lead.follow_up_at) <= now);
}
function formatFollowUpTag(iso: string, now: Date): string {
  const d = new Date(iso);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d <= now) return "pendente";
  if (d.toDateString() === now.toDateString()) return `hoje às ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `amanhã às ${time}`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + ` às ${time}`;
}
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCardFallbackTitle(lead: KanbanLead): string {
  const creative = cleanUtm(lead.utm_content) || lead.creative_slug;
  if (creative) return creative;
  if (lead.fbclid) return `Lead ${lead.fbclid.slice(0, 8)}`;
  if (lead.gclid) return `Lead ${lead.gclid.slice(0, 8)}`;
  return `Lead #${lead.id}`;
}

type LeadDisplay = {
  title: string;
  subtitle: string | null;
  isIdentified: boolean;
  whatsappUrl: string | null;
};

function getLeadDisplay(lead: KanbanLead): LeadDisplay {
  const sourceLabel = cleanUtm(lead.utm_content) || lead.creative_slug || null;

  if (lead.lead_name) {
    const digits = (lead.lead_phone || "").replace(/\D/g, "");
    return {
      title: lead.lead_name,
      subtitle: sourceLabel,
      isIdentified: true,
      whatsappUrl: digits ? `https://wa.me/${digits}` : null,
    };
  }

  if (lead.lead_phone) {
    const phoneInfo = formatLeadPhone(lead.lead_phone);
    return {
      title: phoneInfo.display,
      subtitle: sourceLabel,
      isIdentified: true,
      whatsappUrl: phoneInfo.digits ? `https://wa.me/${phoneInfo.digits}` : null,
    };
  }

  if (lead.channel === "instagram" || lead.channel === "messenger") {
    return {
      title: lead.lead_username ? `@${lead.lead_username}` : `ID ${lead.lead_external_id}`,
      subtitle: sourceLabel,
      isIdentified: true,
      whatsappUrl: null,
    };
  }

  return {
    title: getCardFallbackTitle(lead),
    subtitle: null,
    isIdentified: false,
    whatsappUrl: null,
  };
}

function isActiveConversation(lead: KanbanLead, now: Date): boolean {
  if (!lead.replied_at) return false;
  return now.getTime() - new Date(lead.replied_at).getTime() < 5 * 60 * 1000;
}

const UNKNOWN_USER_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden="true" style={{ color: "var(--muted)", flexShrink: 0 }}>
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── component ──────────────────────────────────────────────────────────────

export function KanbanBoard({ leads, trafficOnly = false }: KanbanBoardProps) {
  const router = useRouter();

  // existing state
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [targetStatus, setTargetStatus] = useState<LeadStatus>("pago");
  const [paidAmount, setPaidAmount] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  // new state
  const [now, setNow] = useState(() => new Date());
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [filterClient, setFilterClient] = useState("");
  const [followUpLead, setFollowUpLead] = useState<KanbanLead | null>(null);
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [busyReplyId, setBusyReplyId] = useState<number | null>(null);
  const [busyFollowUpId, setBusyFollowUpId] = useState<number | null>(null);

  // tick every 30s so staleness alerts update automatically
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── client list ────────────────────────────────────────────────────────────

  const clients = useMemo(() => Array.from(
    new Map(
      leads
        .filter((l) => l.client_name)
        .map((l) => [l.client_slug, l.client_name])
    ).entries()
  ).map(([slug, name]) => ({ slug, name: name! })), [leads]);

  // ── filtered leads ─────────────────────────────────────────────────────────

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (filterClient) {
      result = result.filter((l) => l.client_slug === filterClient);
    }

    if (channelFilter !== "all") {
      result = result.filter((l) => (l.channel || "whatsapp") === channelFilter);
    }

    if (query.trim()) {
      const qRaw = query.toLowerCase();
      const qDigits = qRaw.replace(/\D/g, "");
      result = result.filter((lead) => {
        const name = (lead.lead_name || "").toLowerCase();
        const username = (lead.lead_username || "").toLowerCase();
        const msgText = (lead.message_text || "").toLowerCase();
        const extId = (lead.lead_external_id || "").toLowerCase();
        const channel = (lead.channel || "").toLowerCase();
        const phone = lead.lead_phone ? formatLeadPhone(lead.lead_phone) : null;
        const campaign = (cleanUtm(lead.utm_campaign) || lead.internal_campaign_slug || "").toLowerCase();
        const creative = (cleanUtm(lead.utm_content) || lead.creative_slug || "").toLowerCase();
        const fbclid = (lead.fbclid || "").toLowerCase();
        const gclid = (lead.gclid || "").toLowerCase();
        const leadId = `#${lead.id}`;
        return (
          name.includes(qRaw) ||
          username.includes(qRaw) ||
          msgText.includes(qRaw) ||
          extId.includes(qRaw) ||
          channel.includes(qRaw) ||
          (phone !== null && phone.country.toLowerCase().includes(qRaw)) ||
          (phone !== null && phone.display.toLowerCase().includes(qRaw)) ||
          (qDigits.length >= 3 && phone !== null && phone.digits.includes(qDigits)) ||
          campaign.includes(qRaw) ||
          creative.includes(qRaw) ||
          fbclid.includes(qRaw) ||
          gclid.includes(qRaw) ||
          leadId.includes(qRaw)
        );
      });
    }

    switch (activeFilter) {
      case "not_replied":        return result.filter((l) => !l.has_replied);
      case "replied":            return result.filter((l) => l.has_replied);
      case "stale":              return result.filter((l) => getStaleness(l, now) !== "none");
      case "urgent":             return result.filter((l) => getStaleness(l, now) === "urgent");
      case "follow_up_pending":  return result.filter((l) => isFollowUpPending(l, now));
      default:                   return result;
    }
  }, [leads, query, activeFilter, channelFilter, filterClient, now]);

  const filterCounts = useMemo(() => {
    const clientScoped = filterClient ? leads.filter((l) => l.client_slug === filterClient) : leads;
    const channelScoped = channelFilter === "all"
      ? clientScoped
      : clientScoped.filter((l) => (l.channel || "whatsapp") === channelFilter);
    const base = query.trim() ? filteredLeads : channelScoped;
    return {
      all:              channelScoped.length,
      not_replied:      base.filter((l) => !l.has_replied).length,
      replied:          base.filter((l) => l.has_replied).length,
      stale:            base.filter((l) => getStaleness(l, now) !== "none").length,
      urgent:           base.filter((l) => getStaleness(l, now) === "urgent").length,
      follow_up_pending:base.filter((l) => isFollowUpPending(l, now)).length,
    };
  }, [leads, filteredLeads, query, channelFilter, filterClient, now]);

  const columns = useMemo(
    () => STATUS_ORDER.map((s) => ({ status: s, label: LEAD_STATUS_LABELS[s], leads: filteredLeads.filter((l) => l.lead_status === s) })),
    [filteredLeads]
  );

  // ── actions ────────────────────────────────────────────────────────────────

  async function submitStatusUpdate(leadId: number, status: LeadStatus, paidAmountCents?: number, email?: string, name?: string) {
    setBusyLeadId(leadId);
    try {
      await fetch("/dashboard/kanban/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status, paidAmountCents: paidAmountCents ?? null, leadEmail: email || null, leadName: name || null }),
      });
      router.refresh();
    } finally { setBusyLeadId(null); }
  }

  async function submitReply(lead: KanbanLead) {
    setBusyReplyId(lead.id);
    try {
      await fetch(`/api/leads/${lead.id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasReplied: !lead.has_replied }),
      });
      router.refresh();
    } finally { setBusyReplyId(null); }
  }

  async function submitFollowUpSave() {
    if (!followUpLead || !followUpAt) return;
    setBusyFollowUpId(followUpLead.id);
    try {
      await fetch(`/api/leads/${followUpLead.id}/follow-up`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpAt: new Date(followUpAt).toISOString(),
          followUpNote: followUpNote.trim() || null,
          followUpDone: false,
        }),
      });
      setFollowUpLead(null);
      router.refresh();
    } finally { setBusyFollowUpId(null); }
  }

  async function submitFollowUpDone(lead: KanbanLead) {
    setBusyFollowUpId(lead.id);
    try {
      await fetch(`/api/leads/${lead.id}/follow-up`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDone: true }),
      });
      router.refresh();
    } finally { setBusyFollowUpId(null); }
  }

  function openFollowUpModal(lead: KanbanLead) {
    setFollowUpLead(lead);
    setFollowUpAt(lead.follow_up_at ? toDatetimeLocal(new Date(lead.follow_up_at)) : "");
    setFollowUpNote(lead.follow_up_note || "");
  }

  function setFollowUpQuick(option: "1h" | "tomorrow" | "3days") {
    const d = new Date();
    if (option === "1h") { d.setHours(d.getHours() + 1); }
    else if (option === "tomorrow") { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    else { d.setDate(d.getDate() + 3); d.setHours(9, 0, 0, 0); }
    setFollowUpAt(toDatetimeLocal(d));
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── search ── */}
      <div className="kanban-search">
        <input
          type="text"
          placeholder="Buscar por nome, número, campanha, criativo, fbclid, gclid, #id..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <>
            <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setQuery("")}>
              Limpar
            </button>
            <span className="dashboard-helper" style={{ whiteSpace: "nowrap" }}>
              {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
            </span>
          </>
        ) : null}
      </div>

      {/* ── traffic / todos toggle ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Origem:
        </span>
        <a
          href="/dashboard/kanban"
          style={{
            fontSize: "0.72rem", padding: "4px 12px", borderRadius: 20,
            border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none",
            background: !trafficOnly ? "var(--brand)" : "transparent",
            color: !trafficOnly ? "#fff" : "var(--muted)",
            fontWeight: !trafficOnly ? 600 : 400,
          }}
        >
          Todos
        </a>
        <a
          href="/dashboard/kanban?mode=traffic"
          style={{
            fontSize: "0.72rem", padding: "4px 12px", borderRadius: 20,
            border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none",
            background: trafficOnly ? "var(--brand)" : "transparent",
            color: trafficOnly ? "#fff" : "var(--muted)",
            fontWeight: trafficOnly ? 600 : 400,
          }}
        >
          Só Tráfego
        </a>
      </div>

      {/* ── channel filter ── */}
      <div className="kanban-channel-filters">
        {(["all", "whatsapp"] as ChannelFilter[]).map((ch) => {
          const labels: Record<string, string> = { all: "Todos os canais", whatsapp: "WhatsApp" };
          const counts = {
            all: leads.length,
            whatsapp: leads.filter((l) => !l.channel || l.channel === "whatsapp").length,
          };
          return (
            <button
              key={ch}
              type="button"
              className={`kanban-channel-btn kanban-channel-btn--${ch}${channelFilter === ch ? " kanban-channel-btn--active" : ""}`}
              onClick={() => setChannelFilter(ch)}
            >
              {labels[ch]}
              <span className="kanban-filter-btn__count">{counts[ch as keyof typeof counts]}</span>
            </button>
          );
        })}
        <span className="kanban-channel-btn kanban-channel-btn--disabled" title="Integração em breve">
          Instagram — <span className="kanban-channel-soon">Em breve</span>
        </span>
        <span className="kanban-channel-btn kanban-channel-btn--disabled" title="Integração em breve">
          Messenger — <span className="kanban-channel-soon">Em breve</span>
        </span>
      </div>

      {/* ── client filter ── */}
      {clients.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cliente:</span>
          <button
            type="button"
            onClick={() => setFilterClient("")}
            style={{
              fontSize: "0.72rem", padding: "3px 12px", borderRadius: 20,
              border: "1px solid var(--border)", cursor: "pointer",
              background: filterClient === "" ? "var(--brand)" : "transparent",
              color: filterClient === "" ? "#fff" : "var(--muted)",
              fontWeight: filterClient === "" ? 600 : 400,
            }}
          >
            Todos
          </button>
          {clients.map(({ slug, name }) => (
            <button
              key={slug}
              type="button"
              onClick={() => setFilterClient(slug)}
              style={{
                fontSize: "0.72rem", padding: "3px 12px", borderRadius: 20,
                border: "1px solid var(--border)", cursor: "pointer",
                background: filterClient === slug ? "var(--brand)" : "transparent",
                color: filterClient === slug ? "#fff" : "var(--muted)",
                fontWeight: filterClient === slug ? 600 : 400,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* ── filter bar ── */}
      <div className="kanban-filters">
        {([
          ["all",              "Todos",              false],
          ["not_replied",      "Não respondidos",    false],
          ["replied",          "Já respondidos",     false],
          ["stale",            "Parados 15min+",     false],
          ["urgent",           "Urgentes 1h+",       true ],
          ["follow_up_pending","Follow-up pendente", false],
        ] as [FilterType, string, boolean][]).map(([key, label, isUrgent]) => (
          <button
            key={key}
            type="button"
            className={[
              "kanban-filter-btn",
              activeFilter === key ? "kanban-filter-btn--active" : "",
              isUrgent && activeFilter !== key ? "kanban-filter-btn--urgent" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => setActiveFilter(key)}
          >
            {label}
            {filterCounts[key] > 0 ? (
              <span className="kanban-filter-btn__count">{filterCounts[key]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── board ── */}
      <section className="kanban-board">
        {columns.map((column) => (
          <article key={column.status} className={`kanban-column kanban-column--${column.status}`}>
            <header className="kanban-column__header">
              <div>
                <strong>{column.label}</strong>
                <span>{column.leads.length}</span>
              </div>
            </header>

            <div className="kanban-column__body">
              {column.leads.length ? column.leads.map((lead) => {
                const phone         = lead.lead_phone ? formatLeadPhone(lead.lead_phone) : null;
                const campaign      = cleanUtm(lead.utm_campaign) || lead.internal_campaign_slug;
                const creative      = cleanUtm(lead.utm_content) || lead.creative_slug;
                const isMetaChannel = lead.channel === "instagram" || lead.channel === "messenger";
                const display       = getLeadDisplay(lead);
                const isConversing  = isActiveConversation(lead, now);
                const stale         = getStaleness(lead, now);
                const fuPending     = isFollowUpPending(lead, now);
                const badge         = getChannelBadge(lead);

                return (
                  <section
                    key={lead.id}
                    className={[
                      "kanban-card",
                      stale === "urgent" ? "kanban-card--urgent"
                        : stale === "stale" ? "kanban-card--stale"
                        : fuPending ? "kanban-card--followup"
                        : ""
                    ].filter(Boolean).join(" ")}
                  >

                    {/* ── header ── */}
                    <div className="kanban-card__header">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {display.whatsappUrl ? (
                            <a
                              href={display.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="kanban-card__title-link"
                              title="Abrir conversa no WhatsApp"
                            >
                              {display.title}
                            </a>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                              {!display.isIdentified && UNKNOWN_USER_ICON}
                              <strong
                                className="kanban-card__name"
                                style={!display.isIdentified ? { color: "var(--muted)", fontWeight: 500 } : undefined}
                              >
                                {display.title}
                              </strong>
                            </span>
                          )}
                          {!display.isIdentified && (
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "rgba(59,130,246,0.1)", color: "#2563EB", whiteSpace: "nowrap", flexShrink: 0 }}>
                              Novo lead
                            </span>
                          )}
                        </div>
                        {display.subtitle && (
                          <span className="kanban-card__subtitle">{display.subtitle}</span>
                        )}
                      </div>
                      <span className={badge.cls}>{badge.label}</span>
                    </div>

                    {/* ── lead id ── */}
                    <div style={{ fontSize: "0.66rem", color: "var(--muted)", marginTop: 1 }}>
                      ID: {lead.id}
                    </div>

                    {/* ── identidade secundária ── */}
                    {isMetaChannel ? (
                      <div className="kanban-card__social">
                        {lead.lead_username
                          ? <span>@{lead.lead_username}</span>
                          : <span className="kanban-card__social-id">ID: {lead.lead_external_id}</span>
                        }
                        {lead.message_text ? (
                          <span className="kanban-card__last-msg">"{lead.message_text}"</span>
                        ) : null}
                      </div>
                    ) : lead.lead_name && phone?.waUrl ? (
                      <a href={phone.waUrl} target="_blank" rel="noreferrer" className="kanban-card__phone">
                        {WA_ICON}
                        <span className="kanban-card__phone-flag">{phone.flag}</span>
                        {phone.display}
                      </a>
                    ) : null}

                    {/* ── campanha / criativo ── */}
                    {(campaign || creative) ? (
                      <div className="kanban-card__campaign-info">
                        {campaign ? <span><em>Camp.:</em> {campaign}</span> : null}
                        {creative ? <span><em>Cria.:</em> {creative}</span> : null}
                      </div>
                    ) : null}

                    {/* ── entrada ── */}
                    <div className="kanban-card__entry">
                      Entrada: {formatEntryDate(lead.created_at)}
                    </div>

                    {/* ── resposta + alerta de parado ── */}
                    <div className="kanban-card__reply-row">
                      <button
                        type="button"
                        className={`kanban-reply-btn ${
                          lead.has_replied
                            ? isConversing ? "kanban-reply-btn--conversing" : "kanban-reply-btn--replied"
                            : "kanban-reply-btn--not-replied"
                        }`}
                        disabled={busyReplyId === lead.id}
                        onClick={() => void submitReply(lead)}
                      >
                        {lead.has_replied
                          ? isConversing ? "💬 Em conversa" : "✓ Já respondeu"
                          : "Não respondeu"}
                      </button>

                      {stale === "urgent" ? (
                        <span className="kanban-stale-badge kanban-stale-badge--urgent">
                          Urgente: {formatStaleLabel(lead, now)}
                        </span>
                      ) : stale === "stale" ? (
                        <span className="kanban-stale-badge kanban-stale-badge--warning">
                          Parado: {formatStaleLabel(lead, now)}
                        </span>
                      ) : null}
                    </div>

                    {/* ── follow-up agendado ── */}
                    {lead.follow_up_at && !lead.follow_up_done ? (
                      <div className="kanban-followup-row">
                        <span className={`kanban-followup-tag${fuPending ? " kanban-followup-tag--pending" : ""}`}>
                          {fuPending ? "⚑ " : ""}Follow-up: {formatFollowUpTag(lead.follow_up_at, now)}
                        </span>
                        {fuPending ? (
                          <button
                            type="button"
                            className="dashboard-button dashboard-button--ghost kanban-btn-sm"
                            disabled={busyFollowUpId === lead.id}
                            onClick={() => void submitFollowUpDone(lead)}
                          >
                            Concluir
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {/* ── botão follow-up ── */}
                    <div>
                      <button
                        type="button"
                        className="kanban-followup-btn"
                        onClick={() => openFollowUpModal(lead)}
                      >
                        {lead.follow_up_at && !lead.follow_up_done ? "Editar follow-up" : "+ Follow-up"}
                      </button>
                    </div>

                    {/* ── badges exportavel / sem e-mail ── */}
                    {EXPORTABLE_STATUSES.includes(lead.lead_status) ? (
                      <div className="dashboard-inline-actions" style={{ marginBottom: 0 }}>
                        <span className="dashboard-pill dashboard-pill--success" style={{ fontSize: "0.65rem" }}>Exportavel</span>
                        {!lead.lead_email ? (
                          <span className="dashboard-pill dashboard-pill--error" style={{ fontSize: "0.65rem" }}>Sem e-mail</span>
                        ) : null}
                      </div>
                    ) : null}

                    {/* ── valor pago ── */}
                    {lead.paid_amount_cents ? (
                      <span className="kanban-paid-badge">{formatCurrencyFromCents(lead.paid_amount_cents)}</span>
                    ) : null}

                    {/* ── botões de status ── */}
                    {lead.kommo_enabled ? (
                      <div className="dashboard-alert dashboard-alert--info" style={{ fontSize: "0.73rem", padding: "6px 10px" }}>
                        Gerenciado via Kommo
                      </div>
                    ) : (
                      <div className="kanban-card__actions">
                        {STATUS_ORDER.filter((s) => s !== lead.lead_status).map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="dashboard-button dashboard-button--ghost"
                            disabled={busyLeadId === lead.id}
                            onClick={() => {
                              if (s === "pago") {
                                setSelectedLead(lead);
                                setTargetStatus(s);
                                setPaidAmount("");
                                setLeadEmail(lead.lead_email || "");
                                setLeadName(lead.lead_name || "");
                                return;
                              }
                              void submitStatusUpdate(lead.id, s);
                            }}
                          >
                            {LEAD_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    )}

                  </section>
                );
              }) : (
                <div className="dashboard-empty">Sem leads nesta etapa.</div>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* ── modal: registrar pagamento ── */}
      {selectedLead ? (
        <div className="dashboard-modal-backdrop">
          <div className="dashboard-modal">
            <h3>Registrar pagamento</h3>
            <p>Informe o valor pago para mover o lead para <strong>Pago</strong>.</p>
            <div className="dashboard-form-stack">
              <label className="dashboard-field">
                <span>Valor pago (R$)</span>
                <input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0,00" />
              </label>
              <label className="dashboard-field">
                <span>Nome do lead (opcional)</span>
                <input type="text" value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nome completo" />
              </label>
              <label className="dashboard-field">
                <span>E-mail do lead (opcional)</span>
                <input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="email@exemplo.com" />
              </label>
            </div>
            <div className="dashboard-actions">
              <button type="button" className="dashboard-button dashboard-button--brand"
                onClick={() => {
                  void submitStatusUpdate(selectedLead.id, targetStatus, Math.round(Number(paidAmount || 0) * 100), leadEmail, leadName);
                  setSelectedLead(null);
                }}>
                Salvar pagamento
              </button>
              <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setSelectedLead(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── modal: follow-up ── */}
      {followUpLead ? (
        <div className="dashboard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setFollowUpLead(null); }}>
          <div className="dashboard-modal">
            <h3>Agendar follow-up</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 12px" }}>
              {followUpLead.lead_name || (followUpLead.lead_phone ? formatLeadPhone(followUpLead.lead_phone).display : "Lead")}
            </p>

            <div className="dashboard-form-stack">
              <div className="dashboard-field">
                <span>Quando</span>
                <div className="kanban-followup-quick">
                  <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setFollowUpQuick("1h")}>em 1h</button>
                  <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setFollowUpQuick("tomorrow")}>amanhã 9h</button>
                  <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setFollowUpQuick("3days")}>em 3 dias 9h</button>
                </div>
                <input
                  type="datetime-local"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </div>

              <div className="dashboard-field">
                <span>Observação (opcional)</span>
                <textarea
                  rows={2}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Ex.: Ligar para confirmar agendamento"
                />
              </div>
            </div>

            <div className="dashboard-actions">
              <button
                type="button"
                className="dashboard-button dashboard-button--brand"
                disabled={!followUpAt || busyFollowUpId === followUpLead.id}
                onClick={() => void submitFollowUpSave()}
              >
                {busyFollowUpId === followUpLead.id ? "Salvando..." : "Salvar follow-up"}
              </button>
              <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => setFollowUpLead(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

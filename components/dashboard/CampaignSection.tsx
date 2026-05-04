"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { slugifyClinicName } from "@/lib/clinic-shared";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { CampaignCreativesSection } from "@/components/dashboard/CampaignCreativesSection";
import { formatCurrency, type Currency } from "@/lib/format";

type Campaign = {
  id: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage: string;
  isActive: boolean;
  dailyBudgetCents: number;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
};

type CampaignSectionProps = {
  initialCampaigns: Campaign[];
  clientSlug: string;
  baseUrl: string;
  canManage: boolean;
};

type ModalState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  slug: string;
  defaultMessage: string;
  isActive: boolean;
  dailyBudget: string;
  currency: Currency;
  slugTouched: boolean;
};

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "BRL", label: "BRL — Real" },
  { value: "USD", label: "USD — Dólar" },
  { value: "EUR", label: "EUR — Euro" },
];

function buildCampaignUrl(baseUrl: string, clientSlug: string, slug: string) {
  return `${baseUrl}/w/${encodeURIComponent(clientSlug)}/${encodeURIComponent(slug)}`;
}

function buildCampaignMetaUrl(baseUrl: string, clientSlug: string, slug: string) {
  const path = `${encodeURIComponent(clientSlug)}/${encodeURIComponent(slug)}`;
  return `${baseUrl}/w/${path}?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
}

function buildCampaignGoogleUrl(baseUrl: string, clientSlug: string, slug: string) {
  const path = `${encodeURIComponent(clientSlug)}/${encodeURIComponent(slug)}`;
  return `${baseUrl}/w/${path}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;
}

function formatBudgetBadge(cents: number, currency: Currency): string {
  return `${formatCurrency(cents / 100, currency)}/dia`;
}

export function CampaignSection({
  initialCampaigns,
  clientSlug,
  baseUrl,
  canManage
}: CampaignSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const autoOpenDone = useRef(false);
  useEffect(() => {
    if (autoOpenDone.current) return;
    if (canManage && searchParams.get("novaCampanha") === "1") {
      autoOpenDone.current = true;
      openCreate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return campaigns;
    const q = query.toLowerCase();
    return campaigns.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [campaigns, query]);

  function openCreate() {
    setError("");
    setModal({
      mode: "create",
      name: "",
      slug: "",
      defaultMessage: "",
      isActive: true,
      dailyBudget: "",
      currency: "BRL",
      slugTouched: false,
    });
  }

  function openEdit(campaign: Campaign) {
    setError("");
    setModal({
      mode: "edit",
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      defaultMessage: campaign.defaultMessage,
      isActive: campaign.isActive,
      dailyBudget: campaign.dailyBudgetCents > 0
        ? (campaign.dailyBudgetCents / 100).toFixed(2)
        : "",
      currency: campaign.currency ?? "BRL",
      slugTouched: true,
    });
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  function handleNameChange(value: string) {
    if (!modal) return;
    setModal({
      ...modal,
      name: value,
      slug: modal.slugTouched ? modal.slug : slugifyClinicName(value),
    });
  }

  async function handleSave() {
    if (!modal) return;
    setError("");
    setSaving(true);

    const dailyBudgetCents = modal.dailyBudget
      ? Math.round(parseFloat(modal.dailyBudget.replace(",", ".")) * 100)
      : 0;

    try {
      const isCreate = modal.mode === "create";
      const res = await fetch(isCreate ? "/api/campaigns" : `/api/campaigns/${modal.id}`, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSlug,
          name: modal.name,
          slug: modal.slug,
          defaultMessage: modal.defaultMessage,
          isActive: modal.isActive,
          dailyBudgetCents: isNaN(dailyBudgetCents) ? 0 : dailyBudgetCents,
          currency: modal.currency,
          ...(modal.id ? { id: modal.id } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao salvar a campanha.");
        return;
      }

      if (isCreate) {
        setCampaigns((prev) => [...prev, data.campaign as Campaign]);
      } else {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === modal.id ? (data.campaign as Campaign) : c))
        );
      }
      closeModal();
    } catch {
      setError("Erro de rede ao salvar a campanha.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(campaign: Campaign) {
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, isActive: !campaign.isActive }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? (data.campaign as Campaign) : c))
      );
    } catch {
      // ignore
    }
  }

  async function handleDelete(campaign: Campaign) {
    if (!window.confirm(`Remover a campanha "${campaign.name}"? Esta acao nao pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug }),
      });
      if (!res.ok) return;
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
    } catch {
      // ignore
    }
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <div>
          <h3>Links de campanha</h3>
          <p className="dashboard-helper">
            Crie links individuais por campanha com mensagem e UTMs proprias para Meta Ads e Google Ads.
          </p>
        </div>
        {canManage ? (
          <button type="button" className="dashboard-button" onClick={openCreate}>
            Nova campanha
          </button>
        ) : null}
      </div>

      {campaigns.length > 3 ? (
        <div className="dashboard-searchbar">
          <input
            type="text"
            placeholder="Buscar campanha por nome ou slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="dashboard-button dashboard-button--ghost"
              onClick={() => setQuery("")}
            >
              Limpar
            </button>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="dashboard-empty">
          {campaigns.length === 0
            ? "Nenhuma campanha cadastrada. Clique em Nova campanha para comecar."
            : "Nenhuma campanha encontrada para esta busca."}
        </div>
      ) : (
        <div className="dashboard-link-list">
          {filtered.map((campaign) => {
            const baseLink   = buildCampaignUrl(baseUrl, clientSlug, campaign.slug);
            const metaLink   = buildCampaignMetaUrl(baseUrl, clientSlug, campaign.slug);
            const googleLink = buildCampaignGoogleUrl(baseUrl, clientSlug, campaign.slug);

            return (
              <div key={campaign.id} className="dashboard-link-card">
                <div className="dashboard-inline-actions">
                  <strong>{campaign.name}</strong>
                  <code className="dashboard-inline-code">/{campaign.slug}</code>
                  <span className={`dashboard-pill ${campaign.isActive ? "dashboard-pill--success" : "dashboard-pill--error"}`}>
                    {campaign.isActive ? "Ativa" : "Inativa"}
                  </span>
                  {campaign.dailyBudgetCents > 0 ? (
                    <span className="dashboard-pill dashboard-pill--meta">
                      {formatBudgetBadge(campaign.dailyBudgetCents, campaign.currency)}
                    </span>
                  ) : null}
                  {campaign.currency !== "BRL" ? (
                    <span className="dashboard-pill dashboard-pill--neutral">
                      {campaign.currency}
                    </span>
                  ) : null}
                </div>

                {campaign.defaultMessage ? (
                  <p className="dashboard-helper" style={{ margin: 0 }}>
                    {campaign.defaultMessage.length > 90
                      ? `${campaign.defaultMessage.slice(0, 90)}...`
                      : campaign.defaultMessage}
                  </p>
                ) : null}

                <div className="dashboard-link-card" style={{ marginTop: 4 }}>
                  <span className="dashboard-table__sub">Link base</span>
                  <code className="dashboard-code-block">{baseLink}</code>
                  <CopyButton value={baseLink} label="Copiar link base" />
                </div>
                <div className="dashboard-link-card">
                  <span className="dashboard-table__sub">Link para Meta Ads</span>
                  <code className="dashboard-code-block">{metaLink}</code>
                  <CopyButton value={metaLink} label="Copiar link Meta" />
                </div>
                <div className="dashboard-link-card">
                  <span className="dashboard-table__sub">Link para Google Ads</span>
                  <code className="dashboard-code-block">{googleLink}</code>
                  <CopyButton value={googleLink} label="Copiar link Google" />
                </div>

                <CampaignCreativesSection
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  campaignSlug={campaign.slug}
                  clientSlug={clientSlug}
                  baseUrl={baseUrl}
                  canManage={canManage}
                />

                {canManage ? (
                  <div className="dashboard-inline-actions" style={{ marginTop: 4 }}>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => openEdit(campaign)}>Editar campanha</button>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => handleToggle(campaign)}>{campaign.isActive ? "Desativar" : "Ativar"}</button>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => handleDelete(campaign)}>Remover</button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {modal ? (
        <div className="dashboard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="dashboard-modal">
            <h3>{modal.mode === "create" ? "Nova campanha" : "Editar campanha"}</h3>

            <div className="dashboard-form-stack">
              <div className="dashboard-field">
                <span>Nome da campanha</span>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex.: Vasinhos, Botox, Preenchimento"
                  autoFocus
                />
              </div>

              <div className="dashboard-field">
                <span>Slug</span>
                <input
                  type="text"
                  value={modal.slug}
                  onChange={(e) => setModal({ ...modal, slug: e.target.value, slugTouched: true })}
                  placeholder="vasinhos"
                />
                <span className="dashboard-helper">
                  URL: {baseUrl}/w/{clientSlug}/{modal.slug || "slug-da-campanha"}
                </span>
              </div>

              <div className="dashboard-field">
                <span>Mensagem padrao no WhatsApp</span>
                <textarea
                  rows={3}
                  value={modal.defaultMessage}
                  onChange={(e) => setModal({ ...modal, defaultMessage: e.target.value })}
                  placeholder="Ola! Tenho interesse em..."
                />
                <span className="dashboard-helper">
                  Esta mensagem sera enviada automaticamente ao abrir o WhatsApp.
                </span>
              </div>

              {/* Currency selector — above the budget field */}
              <div className="dashboard-field">
                <span>Moeda do investimento</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: `2px solid ${modal.currency === opt.value ? "var(--brand)" : "var(--border)"}`,
                        background: modal.currency === opt.value ? "rgba(var(--brand-rgb,0,102,204),0.07)" : "transparent",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: modal.currency === opt.value ? 700 : 400,
                        transition: "all 0.12s",
                      }}
                    >
                      <input
                        type="radio"
                        name="currency"
                        value={opt.value}
                        checked={modal.currency === opt.value}
                        onChange={() => setModal({ ...modal, currency: opt.value })}
                        style={{ display: "none" }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <span className="dashboard-helper">
                  Exemplo: {formatCurrency(1000, modal.currency)}
                </span>
              </div>

              <div className="dashboard-field">
                <span>Investimento diário ({modal.currency})</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={modal.dailyBudget}
                  onChange={(e) => setModal({ ...modal, dailyBudget: e.target.value })}
                  placeholder="0,00"
                />
                <span className="dashboard-helper">
                  Usado para estimar o investimento do período nos relatórios.
                </span>
              </div>

              <div className="dashboard-field">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={modal.isActive}
                    onChange={(e) => setModal({ ...modal, isActive: e.target.checked })}
                  />
                  <span>Campanha ativa</span>
                </label>
              </div>

              {error ? <div className="dashboard-alert dashboard-alert--error">{error}</div> : null}

              <div className="dashboard-inline-actions">
                <button type="button" className="dashboard-button" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar campanha"}
                </button>
                <button type="button" className="dashboard-button dashboard-button--ghost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

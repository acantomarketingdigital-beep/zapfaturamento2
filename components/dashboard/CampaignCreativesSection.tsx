"use client";

import { useEffect, useState } from "react";
import { slugifyClinicName } from "@/lib/clinic-shared";
import { CopyButton } from "@/components/dashboard/CopyButton";

type Creative = {
  id: string;
  campaignId: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage: string | null;
  metaAdsUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ModalState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  slug: string;
  defaultMessage: string;
  metaAdsUrl: string;
  isActive: boolean;
  slugTouched: boolean;
};

type Props = {
  campaignId: string;
  campaignName: string;
  campaignSlug: string;
  clientSlug: string;
  baseUrl: string;
  canManage: boolean;
  hasGoogleAds?: boolean;
};

function buildCreativeUrl(baseUrl: string, clientSlug: string, campaignSlug: string, creativeSlug: string) {
  return `${baseUrl}/w/${encodeURIComponent(clientSlug)}/${encodeURIComponent(campaignSlug)}/${encodeURIComponent(creativeSlug)}`;
}

function buildCreativeMetaUrl(baseUrl: string, clientSlug: string, campaignSlug: string, creativeSlug: string) {
  const base = buildCreativeUrl(baseUrl, clientSlug, campaignSlug, creativeSlug);
  return `${base}?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
}

function buildCreativeGoogleUrl(baseUrl: string, clientSlug: string, campaignSlug: string, creativeSlug: string) {
  const base = buildCreativeUrl(baseUrl, clientSlug, campaignSlug, creativeSlug);
  return `${base}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;
}

export function CampaignCreativesSection({ campaignId, campaignName, campaignSlug, clientSlug, baseUrl, canManage, hasGoogleAds = false }: Props) {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/creatives`)
      .then((r) => r.json())
      .then((data: { creatives?: Creative[] }) => setCreatives(data.creatives ?? []))
      .catch(() => setCreatives([]))
      .finally(() => setLoading(false));
  }, [campaignId]);

  function openCreate() {
    setError("");
    setModal({ mode: "create", name: "", slug: "", defaultMessage: "", metaAdsUrl: "", isActive: true, slugTouched: false });
  }

  function openEdit(c: Creative) {
    setError("");
    setModal({
      mode: "edit",
      id: c.id,
      name: c.name,
      slug: c.slug,
      defaultMessage: c.defaultMessage ?? "",
      metaAdsUrl: c.metaAdsUrl ?? "",
      isActive: c.isActive,
      slugTouched: true,
    });
  }

  function closeModal() { setModal(null); setError(""); }

  function handleNameChange(value: string) {
    if (!modal) return;
    setModal({ ...modal, name: value, slug: modal.slugTouched ? modal.slug : slugifyClinicName(value) });
  }

  async function handleSave() {
    if (!modal) return;
    setError("");
    setSaving(true);
    try {
      const isCreate = modal.mode === "create";
      const url = isCreate
        ? `/api/campaigns/${campaignId}/creatives`
        : `/api/campaigns/${campaignId}/creatives/${modal.id}`;
      const res = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: modal.name,
          slug: modal.slug,
          defaultMessage: modal.defaultMessage || null,
          metaAdsUrl: modal.metaAdsUrl || null,
          isActive: modal.isActive,
        }),
      });
      const data = await res.json() as { creative?: Creative; error?: string };
      if (!res.ok) { setError(data.error || "Erro ao salvar."); return; }
      if (isCreate) {
        setCreatives((prev) => [...prev, data.creative!]);
      } else {
        setCreatives((prev) => prev.map((c) => (c.id === modal.id ? data.creative! : c)));
      }
      closeModal();
    } catch {
      setError("Erro de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: Creative) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/creatives/${c.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (!res.ok) return;
      const data = await res.json() as { creative?: Creative };
      setCreatives((prev) => prev.map((x) => (x.id === c.id ? data.creative! : x)));
    } catch { /* ignore */ }
  }

  async function handleDelete(c: Creative) {
    if (!window.confirm(`Remover o criativo "${c.name}"?`)) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/creatives/${c.id}`, { method: "DELETE" });
      if (!res.ok) return;
      setCreatives((prev) => prev.filter((x) => x.id !== c.id));
    } catch { /* ignore */ }
  }

  if (loading) {
    return <div className="dashboard-creatives-section"><span className="dashboard-helper">Carregando criativos...</span></div>;
  }

  return (
    <div className="dashboard-creatives-section">
      <div className="dashboard-creatives-header">
        <span className="dashboard-creatives-title">Criativos</span>
        {canManage ? (
          <button type="button" className="dashboard-button dashboard-button--ghost dashboard-button--sm" onClick={openCreate}>
            + Adicionar criativo
          </button>
        ) : null}
      </div>

      {creatives.length === 0 ? (
        <div className="dashboard-helper" style={{ padding: "8px 0" }}>
          Nenhum criativo. {canManage ? "Clique em \"+ Adicionar criativo\" para comecar." : ""}
        </div>
      ) : (
        <div className="dashboard-creatives-list">
          {creatives.map((c) => {
            const baseLink   = buildCreativeUrl(baseUrl, clientSlug, campaignSlug, c.slug);
            const metaLink   = buildCreativeMetaUrl(baseUrl, clientSlug, campaignSlug, c.slug);
            const googleLink = buildCreativeGoogleUrl(baseUrl, clientSlug, campaignSlug, c.slug);

            return (
              <div key={c.id} className="dashboard-creative-card">
                <div className="dashboard-inline-actions">
                  <strong>{c.name}</strong>
                  <code className="dashboard-inline-code">/{c.slug}</code>
                  <span className={`dashboard-pill ${c.isActive ? "dashboard-pill--success" : "dashboard-pill--error"}`}>
                    {c.isActive ? "Ativo" : "Inativo"}
                  </span>
                  {c.metaAdsUrl ? (
                    <a
                      href={c.metaAdsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dashboard-pill dashboard-pill--meta"
                    >
                      Abrir anuncio
                    </a>
                  ) : (
                    <span className="dashboard-pill" style={{ opacity: 0.5, cursor: "default" }}>Sem link</span>
                  )}
                </div>

                {c.defaultMessage ? (
                  <p className="dashboard-helper" style={{ margin: "2px 0 4px" }}>
                    {c.defaultMessage.length > 80 ? `${c.defaultMessage.slice(0, 80)}...` : c.defaultMessage}
                  </p>
                ) : null}

                <div className="dashboard-creative-links">
                  <div className="dashboard-creative-link-row">
                    <span className="dashboard-table__sub">Meta Ads</span>
                    <code className="dashboard-code-block">{metaLink}</code>
                    <CopyButton value={metaLink} label="Copiar" />
                  </div>
                  {hasGoogleAds ? (
                    <div className="dashboard-creative-link-row">
                      <span className="dashboard-table__sub">Google Ads</span>
                      <code className="dashboard-code-block">{googleLink}</code>
                      <CopyButton value={googleLink} label="Copiar Google" />
                    </div>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="dashboard-inline-actions" style={{ marginTop: 6 }}>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => openEdit(c)}>Editar</button>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => handleToggle(c)}>
                      {c.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => handleDelete(c)}>Remover</button>
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
            <h3>{modal.mode === "create" ? "Novo criativo" : "Editar criativo"}</h3>
            <div className="dashboard-form-stack">
              <div className="dashboard-field">
                <span>Campanha</span>
                <div className="dashboard-field-readonly">
                  <strong>{campaignName}</strong>
                  <code className="dashboard-inline-code">/{campaignSlug}</code>
                </div>
                <span className="dashboard-helper">
                  Este criativo pertence a esta campanha. Nao e possivel mover entre campanhas.
                </span>
              </div>

              <div className="dashboard-field">
                <span>Nome do criativo</span>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex.: Gancho preco, Gancho dor, Video depoimento"
                  autoFocus
                />
              </div>

              <div className="dashboard-field">
                <span>Slug</span>
                <input
                  type="text"
                  value={modal.slug}
                  onChange={(e) => setModal({ ...modal, slug: e.target.value, slugTouched: true })}
                  placeholder="gancho-preco"
                />
                <span className="dashboard-helper">
                  URL: {baseUrl}/w/{clientSlug}/{campaignSlug}/{modal.slug || "slug-do-criativo"}
                </span>
              </div>

              <div className="dashboard-field">
                <span>Mensagem no WhatsApp (opcional)</span>
                <textarea
                  rows={3}
                  value={modal.defaultMessage}
                  onChange={(e) => setModal({ ...modal, defaultMessage: e.target.value })}
                  placeholder="Deixe vazio para usar a mensagem da campanha."
                />
                <span className="dashboard-helper">
                  Substitui a mensagem da campanha quando este criativo for acessado.
                </span>
              </div>

              <div className="dashboard-field">
                <span>Link do anuncio na Meta (opcional)</span>
                <span className="dashboard-helper" style={{ marginBottom: 4 }}>
                  Adicione depois que a campanha for publicada para facilitar o acesso ao criativo.
                </span>
                <input
                  type="url"
                  value={modal.metaAdsUrl}
                  onChange={(e) => setModal({ ...modal, metaAdsUrl: e.target.value })}
                  placeholder="https://www.facebook.com/adsmanager/..."
                />
                <span className="dashboard-helper">
                  O link do anuncio so e gerado apos a publicacao da campanha na Meta. Voce pode adicionar depois. Este link nao afeta o tracking nem os UTMs.
                </span>
              </div>

              <div className="dashboard-field">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={modal.isActive}
                    onChange={(e) => setModal({ ...modal, isActive: e.target.checked })}
                  />
                  <span>Criativo ativo</span>
                </label>
              </div>

              {error ? <div className="dashboard-alert dashboard-alert--error">{error}</div> : null}

              <div className="dashboard-inline-actions">
                <button type="button" className="dashboard-button" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar criativo"}
                </button>
                <button type="button" className="dashboard-button dashboard-button--ghost" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

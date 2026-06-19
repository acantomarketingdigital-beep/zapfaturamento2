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
  isSitelink: boolean;
  sitelinkDesc1: string | null;
  sitelinkDesc2: string | null;
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

type SitelinkModalState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  slug: string;
  sitelinkDesc1: string;
  sitelinkDesc2: string;
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
  channel?: "whatsapp" | "sms";
};

function buildCreativeUrl(baseUrl: string, clientSlug: string, campaignSlug: string, creativeSlug: string, channel: "whatsapp" | "sms" = "whatsapp") {
  const prefix = channel === "sms" ? "s" : "w";
  return `${baseUrl}/${prefix}/${encodeURIComponent(clientSlug)}/${encodeURIComponent(campaignSlug)}/${encodeURIComponent(creativeSlug)}`;
}

function buildCreativeMetaUrl(baseUrl: string, clientSlug: string, campaignSlug: string, creativeSlug: string, channel: "whatsapp" | "sms" = "whatsapp") {
  const base = buildCreativeUrl(baseUrl, clientSlug, campaignSlug, creativeSlug, channel);
  return `${base}?utm_source=facebook&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}`;
}

function buildCreativeGoogleUrl(baseUrl: string, clientSlug: string, campaignSlug: string, creativeSlug: string, channel: "whatsapp" | "sms" = "whatsapp") {
  const base = buildCreativeUrl(baseUrl, clientSlug, campaignSlug, creativeSlug, channel);
  return `${base}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gclid={gclid}&device={device}&network={network}&matchtype={matchtype}`;
}

const VIM_DO = "Vim do";

function enforceVimDo(newValue: string, prevValue: string): string {
  if (!newValue) return newValue;
  if (newValue.includes(VIM_DO)) return newValue;
  return prevValue;
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span style={{ fontSize: "0.75rem", color: over ? "var(--error, #e53)" : "var(--text-muted, #888)" }}>
      {len}/{max}
    </span>
  );
}

export function CampaignCreativesSection({ campaignId, campaignName, campaignSlug, clientSlug, baseUrl, canManage, hasGoogleAds = false, channel = "whatsapp" }: Props) {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [sitelinkModal, setSitelinkModal] = useState<SitelinkModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/creatives`)
      .then((r) => r.json())
      .then((data: { creatives?: Creative[] }) => setCreatives(data.creatives ?? []))
      .catch(() => setCreatives([]))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const regularCreatives = creatives.filter((c) => !c.isSitelink);
  const sitelinks = creatives.filter((c) => c.isSitelink);

  function openCreate() {
    setError("");
    setModal({ mode: "create", name: "", slug: "", defaultMessage: "", metaAdsUrl: "", isActive: true, slugTouched: false });
  }

  function openEdit(c: Creative) {
    setError("");
    const msg = c.defaultMessage ?? "";
    setModal({
      mode: "edit",
      id: c.id,
      name: c.name,
      slug: c.slug,
      defaultMessage: msg && !msg.includes(VIM_DO) ? `${msg} ${VIM_DO}` : msg,
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
    if (!window.confirm(`Remover "${c.name}"?`)) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/creatives/${c.id}`, { method: "DELETE" });
      if (!res.ok) return;
      setCreatives((prev) => prev.filter((x) => x.id !== c.id));
    } catch { /* ignore */ }
  }

  // Sitelink modal handlers
  function openCreateSitelink() {
    setError("");
    setSitelinkModal({ mode: "create", name: "", slug: "", sitelinkDesc1: "", sitelinkDesc2: "", isActive: true, slugTouched: false });
  }

  function openEditSitelink(c: Creative) {
    setError("");
    setSitelinkModal({
      mode: "edit",
      id: c.id,
      name: c.name,
      slug: c.slug,
      sitelinkDesc1: c.sitelinkDesc1 ?? "",
      sitelinkDesc2: c.sitelinkDesc2 ?? "",
      isActive: c.isActive,
      slugTouched: true,
    });
  }

  function closeSitelinkModal() { setSitelinkModal(null); setError(""); }

  function handleSitelinkNameChange(value: string) {
    if (!sitelinkModal) return;
    setSitelinkModal({ ...sitelinkModal, name: value, slug: sitelinkModal.slugTouched ? sitelinkModal.slug : slugifyClinicName(value) });
  }

  async function handleSitelinkSave() {
    if (!sitelinkModal) return;
    setError("");
    if (sitelinkModal.name.trim().length > 25) { setError("Titulo deve ter no maximo 25 caracteres."); return; }
    if (sitelinkModal.sitelinkDesc1.trim().length > 35) { setError("Descricao 1 deve ter no maximo 35 caracteres."); return; }
    if (sitelinkModal.sitelinkDesc2.trim().length > 35) { setError("Descricao 2 deve ter no maximo 35 caracteres."); return; }
    setSaving(true);
    try {
      const isCreate = sitelinkModal.mode === "create";
      const url = isCreate
        ? `/api/campaigns/${campaignId}/creatives`
        : `/api/campaigns/${campaignId}/creatives/${sitelinkModal.id}`;
      const res = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sitelinkModal.name,
          slug: sitelinkModal.slug,
          isActive: sitelinkModal.isActive,
          isSitelink: true,
          sitelinkDesc1: sitelinkModal.sitelinkDesc1 || null,
          sitelinkDesc2: sitelinkModal.sitelinkDesc2 || null,
        }),
      });
      const data = await res.json() as { creative?: Creative; error?: string };
      if (!res.ok) { setError(data.error || "Erro ao salvar sitelink."); return; }
      if (isCreate) {
        setCreatives((prev) => [...prev, data.creative!]);
      } else {
        setCreatives((prev) => prev.map((c) => (c.id === sitelinkModal.id ? data.creative! : c)));
      }
      closeSitelinkModal();
    } catch {
      setError("Erro de rede ao salvar sitelink.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="dashboard-creatives-section"><span className="dashboard-helper">Carregando criativos...</span></div>;
  }

  return (
    <div className="dashboard-creatives-section">
      {/* Regular creatives */}
      <div className="dashboard-creatives-header">
        <span className="dashboard-creatives-title">Criativos</span>
        {canManage ? (
          <button type="button" className="dashboard-button dashboard-button--ghost dashboard-button--sm" onClick={openCreate}>
            + Adicionar criativo
          </button>
        ) : null}
      </div>

      {regularCreatives.length === 0 ? (
        <div className="dashboard-helper" style={{ padding: "8px 0" }}>
          Nenhum criativo. {canManage ? "Clique em \"+ Adicionar criativo\" para comecar." : ""}
        </div>
      ) : (
        <div className="dashboard-creatives-list">
          {regularCreatives.map((c) => {
            const baseLink   = buildCreativeUrl(baseUrl, clientSlug, campaignSlug, c.slug, channel);
            const metaLink   = buildCreativeMetaUrl(baseUrl, clientSlug, campaignSlug, c.slug, channel);
            const googleLink = buildCreativeGoogleUrl(baseUrl, clientSlug, campaignSlug, c.slug, channel);

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

      {/* Sitelinks Google Ads */}
      <div className="dashboard-creatives-header" style={{ marginTop: 20 }}>
        <div>
          <span className="dashboard-creatives-title">Sitelinks Google Ads</span>
          <span className="dashboard-helper" style={{ marginLeft: 8 }}>
            {sitelinks.length}/6
          </span>
        </div>
        {canManage && sitelinks.length < 6 ? (
          <button type="button" className="dashboard-button dashboard-button--ghost dashboard-button--sm" onClick={openCreateSitelink}>
            + Adicionar sitelink
          </button>
        ) : null}
      </div>

      <p className="dashboard-helper" style={{ margin: "4px 0 8px" }}>
        Sitelinks aparecem abaixo do anuncio principal no Google Ads. Titulo max. 25 caracteres, descricoes max. 35 cada. Use a URL gerada como &ldquo;URL Final&rdquo; do sitelink no Google Ads.
      </p>

      {sitelinks.length === 0 ? (
        <div className="dashboard-helper" style={{ padding: "4px 0 8px" }}>
          Nenhum sitelink. {canManage ? "Clique em \"+ Adicionar sitelink\" para criar ate 6." : ""}
        </div>
      ) : (
        <div className="dashboard-creatives-list">
          {sitelinks.map((c) => {
            const googleLink = buildCreativeGoogleUrl(baseUrl, clientSlug, campaignSlug, c.slug, channel);
            return (
              <div key={c.id} className="dashboard-creative-card">
                <div className="dashboard-inline-actions">
                  <strong>{c.name}</strong>
                  <span className="dashboard-helper" style={{ fontSize: "0.72rem" }}>
                    {c.name.length}/25
                  </span>
                  <span className={`dashboard-pill ${c.isActive ? "dashboard-pill--success" : "dashboard-pill--error"}`}>
                    {c.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {(c.sitelinkDesc1 || c.sitelinkDesc2) ? (
                  <div style={{ margin: "4px 0", display: "grid", gap: 2 }}>
                    {c.sitelinkDesc1 ? (
                      <span className="dashboard-helper">Desc 1: {c.sitelinkDesc1}</span>
                    ) : null}
                    {c.sitelinkDesc2 ? (
                      <span className="dashboard-helper">Desc 2: {c.sitelinkDesc2}</span>
                    ) : null}
                  </div>
                ) : null}

                <div className="dashboard-creative-links">
                  <div className="dashboard-creative-link-row">
                    <span className="dashboard-table__sub">URL Final</span>
                    <code className="dashboard-code-block">{googleLink}</code>
                    <CopyButton value={googleLink} label="Copiar URL" />
                  </div>
                </div>

                {canManage ? (
                  <div className="dashboard-inline-actions" style={{ marginTop: 6 }}>
                    <button type="button" className="dashboard-button dashboard-button--ghost" onClick={() => openEditSitelink(c)}>Editar</button>
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

      {/* Regular creative modal */}
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
                  onChange={(e) =>
                    setModal({ ...modal, defaultMessage: enforceVimDo(e.target.value, modal.defaultMessage) })
                  }
                  placeholder={`Deixe vazio para usar a mensagem da campanha. Se preencher, deve conter "${VIM_DO}".`}
                />
                <span className="dashboard-helper">
                  Substitui a mensagem da campanha quando este criativo for acessado.
                  {modal.defaultMessage
                    ? <> A frase <strong>&ldquo;{VIM_DO}&rdquo;</strong> e obrigatoria e nao pode ser removida.</>
                    : null}
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

      {/* Sitelink modal */}
      {sitelinkModal ? (
        <div className="dashboard-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeSitelinkModal(); }}>
          <div className="dashboard-modal">
            <h3>{sitelinkModal.mode === "create" ? "Novo sitelink" : "Editar sitelink"}</h3>
            <div className="dashboard-form-stack">
              <div className="dashboard-field">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Titulo do sitelink</span>
                  <CharCounter value={sitelinkModal.name} max={25} />
                </div>
                <input
                  type="text"
                  value={sitelinkModal.name}
                  onChange={(e) => handleSitelinkNameChange(e.target.value)}
                  placeholder="Ex.: Entre em contato"
                  maxLength={25}
                  autoFocus
                />
                <span className="dashboard-helper">
                  Aparece como titulo clicavel no Google Ads. Max. 25 caracteres.
                </span>
              </div>

              <div className="dashboard-field">
                <span>Slug</span>
                <input
                  type="text"
                  value={sitelinkModal.slug}
                  onChange={(e) => setSitelinkModal({ ...sitelinkModal, slug: e.target.value, slugTouched: true })}
                  placeholder="entre-em-contato"
                />
                <span className="dashboard-helper">
                  URL Final: {baseUrl}/w/{clientSlug}/{campaignSlug}/{sitelinkModal.slug || "slug-do-sitelink"}?utm_source=google&amp;...
                </span>
              </div>

              <div className="dashboard-field">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Descricao 1 (opcional)</span>
                  <CharCounter value={sitelinkModal.sitelinkDesc1} max={35} />
                </div>
                <input
                  type="text"
                  value={sitelinkModal.sitelinkDesc1}
                  onChange={(e) => setSitelinkModal({ ...sitelinkModal, sitelinkDesc1: e.target.value })}
                  placeholder="Ex.: Fale com nossa equipe agora"
                  maxLength={35}
                />
              </div>

              <div className="dashboard-field">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Descricao 2 (opcional)</span>
                  <CharCounter value={sitelinkModal.sitelinkDesc2} max={35} />
                </div>
                <input
                  type="text"
                  value={sitelinkModal.sitelinkDesc2}
                  onChange={(e) => setSitelinkModal({ ...sitelinkModal, sitelinkDesc2: e.target.value })}
                  placeholder="Ex.: Atendimento rapido via WhatsApp"
                  maxLength={35}
                />
              </div>

              <div className="dashboard-field">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={sitelinkModal.isActive}
                    onChange={(e) => setSitelinkModal({ ...sitelinkModal, isActive: e.target.checked })}
                  />
                  <span>Sitelink ativo</span>
                </label>
              </div>

              {error ? <div className="dashboard-alert dashboard-alert--error">{error}</div> : null}

              <div className="dashboard-inline-actions">
                <button type="button" className="dashboard-button" onClick={handleSitelinkSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar sitelink"}
                </button>
                <button type="button" className="dashboard-button dashboard-button--ghost" onClick={closeSitelinkModal} disabled={saving}>
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

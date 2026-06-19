"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { slugifyClinicName } from "@/lib/clinic-shared";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { CampaignCreativesSection } from "@/components/dashboard/CampaignCreativesSection";
import { formatCurrency, type Currency } from "@/lib/format";

type CampaignSource = "direct" | "google" | "meta" | "tiktok" | "other";
type CampaignChannel = "whatsapp" | "sms";

type Campaign = {
  id: string;
  clientSlug: string;
  name: string;
  slug: string;
  defaultMessage: string;
  whatsappNumber: string | null;
  channel: CampaignChannel;
  smsPhone: string | null;
  isActive: boolean;
  dailyBudgetCents: number;
  currency: Currency;
  campaignSource: CampaignSource;
  seoKeywords: string[];
  seoLocations: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoBullets: string[] | null;
  media1Url: string | null;
  media1Type: "image" | "video" | null;
  media2Url: string | null;
  media2Type: "image" | "video" | null;
  createdAt: string;
  updatedAt: string;
};

type SavedNumber = { id: number; phone_number: string; label: string };

type CampaignSectionProps = {
  initialCampaigns: Campaign[];
  clientSlug: string;
  baseUrl: string;
  canManage: boolean;
  savedNumbers?: SavedNumber[];
  hasGoogleAds?: boolean;
};

type ModalState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  slug: string;
  defaultMessage: string;
  whatsappNumber: string;
  channel: CampaignChannel;
  smsPhone: string;
  isActive: boolean;
  dailyBudget: string;
  currency: Currency;
  slugTouched: boolean;
  campaignSource: CampaignSource;
  seoKeywords: string[];
  seoLocations: string[];
  seoTitle: string;
  seoDescription: string;
  seoBullets: string[];
};

function CampaignMediaSection({
  campaign,
  clientSlug,
  canManage,
  onUpdate,
}: {
  campaign: Campaign;
  clientSlug: string;
  canManage: boolean;
  onUpdate: (updates: Partial<Pick<Campaign, "media1Url" | "media1Type" | "media2Url" | "media2Type">>) => void;
}) {
  const [slot1Loading, setSlot1Loading] = useState(false);
  const [slot2Loading, setSlot2Loading] = useState(false);
  const slot1Ref = useRef<HTMLInputElement>(null);
  const slot2Ref = useRef<HTMLInputElement>(null);

  async function handleUpload(slot: "1" | "2", file: File) {
    const setLoading = slot === "1" ? setSlot1Loading : setSlot2Loading;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slot", slot);
      fd.append("clientSlug", clientSlug);
      const res = await fetch(`/api/campaigns/${campaign.id}/media`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao fazer upload."); return; }
      if (slot === "1") {
        onUpdate({ media1Url: data.url, media1Type: data.type });
      } else {
        onUpdate({ media2Url: data.url, media2Type: data.type });
      }
    } catch {
      alert("Erro de rede ao fazer upload.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(slot: "1" | "2") {
    const setLoading = slot === "1" ? setSlot1Loading : setSlot2Loading;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, slot }),
      });
      if (!res.ok) { alert("Erro ao remover mídia."); return; }
      if (slot === "1") {
        onUpdate({ media1Url: null, media1Type: null });
      } else {
        onUpdate({ media2Url: null, media2Type: null });
      }
    } catch {
      alert("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  const slots = [
    { slot: "1" as const, url: campaign.media1Url, type: campaign.media1Type, loading: slot1Loading, ref: slot1Ref },
    { slot: "2" as const, url: campaign.media2Url, type: campaign.media2Type, loading: slot2Loading, ref: slot2Ref },
  ];

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted, #9ca3af)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
        Mídia da Smart Page
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {slots.map(({ slot, url, type, loading, ref }) => (
          <div key={slot} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #6b7280)", fontWeight: 600 }}>Mídia {slot}</div>
            {url ? (
              <div style={{ position: "relative", width: 130, height: 98, borderRadius: 8, overflow: "hidden", background: "#f3f4f6" }}>
                {type === "video" ? (
                  <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                ) : (
                  <img src={url} alt={`Mídia ${slot}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleRemove(slot)}
                    disabled={loading}
                    style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontSize: "0.72rem", lineHeight: 1.4 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : canManage ? (
              <button
                type="button"
                onClick={() => !loading && ref.current?.click()}
                disabled={loading}
                style={{ width: 130, height: 98, border: "2px dashed var(--border, #e5e7eb)", borderRadius: 8, background: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: loading ? "wait" : "pointer", color: "var(--text-muted, #9ca3af)", fontSize: "0.78rem", gap: 4 }}
              >
                {loading ? "Enviando..." : (
                  <>
                    <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>+</span>
                    <span>Adicionar mídia</span>
                  </>
                )}
              </button>
            ) : (
              <div style={{ width: 130, height: 98, border: "2px dashed var(--border, #e5e7eb)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted, #9ca3af)", fontSize: "0.78rem" }}>
                Sem mídia
              </div>
            )}
            {canManage && (
              <input
                ref={ref}
                type="file"
                accept="image/*,video/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(slot, file);
                  e.target.value = "";
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted, #9ca3af)", margin: "8px 0 0" }}>
        Imagem até 5 MB · Vídeo até 50 MB. Aparece nas laterais da Smart Page no desktop e abaixo do CTA no mobile.
      </p>
    </div>
  );
}

const VIM_DO = "Vim do";

function enforceVimDo(newValue: string, prevValue: string): string {
  if (!newValue) return newValue;
  if (newValue.includes(VIM_DO)) return newValue;
  return prevValue;
}

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "BRL", label: "BRL — Real" },
  { value: "USD", label: "USD — Dólar" },
  { value: "EUR", label: "EUR — Euro" },
];

function formatBudgetBadge(cents: number, currency: Currency): string {
  return `${formatCurrency(cents / 100, currency)}/dia`;
}

export function CampaignSection({
  initialCampaigns,
  clientSlug,
  baseUrl,
  canManage,
  savedNumbers = [],
  hasGoogleAds = false,
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
      defaultMessage: VIM_DO,
      whatsappNumber: "",
      channel: "whatsapp",
      smsPhone: "",
      isActive: true,
      dailyBudget: "",
      currency: "BRL",
      slugTouched: false,
      campaignSource: "direct",
      seoKeywords: [],
      seoLocations: [],
      seoTitle: "",
      seoDescription: "",
      seoBullets: [],
    });
  }

  function openEdit(campaign: Campaign) {
    setError("");
    const ch = campaign.channel ?? "whatsapp";
    const defaultMsg = ch === "whatsapp"
      ? (campaign.defaultMessage.includes(VIM_DO)
          ? campaign.defaultMessage
          : campaign.defaultMessage
            ? `${campaign.defaultMessage} ${VIM_DO}`
            : VIM_DO)
      : campaign.defaultMessage;
    setModal({
      mode: "edit",
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      defaultMessage: defaultMsg,
      whatsappNumber: campaign.whatsappNumber ?? "",
      channel: ch,
      smsPhone: campaign.smsPhone ?? "",
      isActive: campaign.isActive,
      dailyBudget: campaign.dailyBudgetCents > 0
        ? (campaign.dailyBudgetCents / 100).toFixed(2)
        : "",
      currency: campaign.currency ?? "BRL",
      slugTouched: true,
      campaignSource: campaign.campaignSource ?? "direct",
      seoKeywords: campaign.seoKeywords ?? [],
      seoLocations: campaign.seoLocations ?? [],
      seoTitle: campaign.seoTitle ?? "",
      seoDescription: campaign.seoDescription ?? "",
      seoBullets: campaign.seoBullets ?? [],
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
          whatsappNumber: modal.channel === "whatsapp" ? (modal.whatsappNumber.replace(/\D/g, "") || null) : null,
          channel: modal.channel,
          smsPhone: modal.channel === "sms" ? (modal.smsPhone.trim() || null) : null,
          isActive: modal.isActive,
          dailyBudgetCents: isNaN(dailyBudgetCents) ? 0 : dailyBudgetCents,
          currency: modal.currency,
          campaignSource: modal.campaignSource,
          seoKeywords: modal.seoKeywords.filter(Boolean),
          seoLocations: modal.seoLocations.filter(Boolean),
          seoTitle: modal.seoTitle.trim() || null,
          seoDescription: modal.seoDescription.trim() || null,
          seoBullets: modal.seoBullets.filter(Boolean),
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
                  <span className={`dashboard-pill ${campaign.channel === "sms" ? "dashboard-pill--neutral" : "dashboard-pill--success"}`} title={campaign.channel === "sms" ? "Campanha SMS" : "Campanha WhatsApp"}>
                    {campaign.channel === "sms" ? "📱 SMS" : "💬 WhatsApp"}
                  </span>
                  {campaign.channel === "whatsapp" && campaign.whatsappNumber ? (
                    <span className="dashboard-pill dashboard-pill--neutral" title="WhatsApp especifico desta campanha">
                      WA: {campaign.whatsappNumber}
                    </span>
                  ) : null}
                  {campaign.channel === "sms" && campaign.smsPhone ? (
                    <span className="dashboard-pill dashboard-pill--neutral" title="Telefone SMS desta campanha">
                      SMS: {campaign.smsPhone}
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

                <CampaignCreativesSection
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  campaignSlug={campaign.slug}
                  clientSlug={clientSlug}
                  baseUrl={baseUrl}
                  canManage={canManage}
                  hasGoogleAds={hasGoogleAds}
                  channel={campaign.channel ?? "whatsapp"}
                />

                <CampaignMediaSection
                  campaign={campaign}
                  clientSlug={clientSlug}
                  canManage={canManage}
                  onUpdate={(updates) =>
                    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, ...updates } : c)))
                  }
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
              {/* Seletor de canal */}
              <div className="dashboard-field">
                <span>Canal da campanha</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {([["whatsapp", "💬 WhatsApp"], ["sms", "📱 SMS"]] as const).map(([val, label]) => (
                    <label
                      key={val}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: `2px solid ${modal.channel === val ? "var(--brand)" : "var(--border)"}`,
                        background: modal.channel === val ? "rgba(var(--brand-rgb,0,102,204),0.07)" : "transparent",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: modal.channel === val ? 700 : 400,
                        transition: "all 0.12s",
                      }}
                    >
                      <input
                        type="radio"
                        name="channel"
                        value={val}
                        checked={modal.channel === val}
                        onChange={() => setModal({
                          ...modal,
                          channel: val,
                          defaultMessage: val === "whatsapp" && !modal.defaultMessage.includes(VIM_DO)
                            ? VIM_DO
                            : modal.defaultMessage,
                        })}
                        style={{ display: "none" }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <span className="dashboard-helper">
                  {modal.channel === "sms"
                    ? `URL gerada: ${baseUrl}/s/${clientSlug}/${modal.slug || "slug-da-campanha"}`
                    : `URL gerada: ${baseUrl}/w/${clientSlug}/${modal.slug || "slug-da-campanha"}`}
                </span>
              </div>

              <div className="dashboard-field">
                <span>Nome da campanha</span>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={modal.channel === "sms" ? "Ex.: Sofa Cleaning NYC, Google US" : "Ex.: Vasinhos, Botox, Preenchimento"}
                  autoFocus
                />
              </div>

              <div className="dashboard-field">
                <span>Slug</span>
                <input
                  type="text"
                  value={modal.slug}
                  onChange={(e) => setModal({ ...modal, slug: e.target.value, slugTouched: true })}
                  placeholder={modal.channel === "sms" ? "sofa-cleaning-nyc" : "vasinhos"}
                />
                <span className="dashboard-helper">
                  URL: {baseUrl}/{modal.channel === "sms" ? "s" : "w"}/{clientSlug}/{modal.slug || "slug-da-campanha"}
                </span>
              </div>

              {modal.channel === "whatsapp" ? (
                <>
                  <div className="dashboard-field">
                    <span>Mensagem padrao no WhatsApp</span>
                    <textarea
                      rows={3}
                      value={modal.defaultMessage}
                      onChange={(e) =>
                        setModal({ ...modal, defaultMessage: enforceVimDo(e.target.value, modal.defaultMessage) })
                      }
                      placeholder={`Ola! Tenho interesse em... ${VIM_DO}`}
                    />
                    <span className="dashboard-helper">
                      Esta mensagem sera enviada automaticamente ao abrir o WhatsApp.
                      A frase <strong>&ldquo;{VIM_DO}&rdquo;</strong> e obrigatoria e nao pode ser removida.
                    </span>
                  </div>

                  <div className="dashboard-field">
                    <span>WhatsApp desta campanha</span>
                    <input
                      type="text"
                      value={modal.whatsappNumber}
                      onChange={(e) => setModal({ ...modal, whatsappNumber: e.target.value })}
                      placeholder="5511999999999 (deixe vazio para usar o padrao do cliente)"
                    />
                {savedNumbers.length > 0 ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    <button
                      type="button"
                      className={`dashboard-button dashboard-button--ghost${!modal.whatsappNumber ? " dashboard-button--active" : ""}`}
                      style={{ fontSize: "0.8rem", padding: "2px 10px" }}
                      onClick={() => setModal({ ...modal, whatsappNumber: "" })}
                    >
                      Padrao do cliente
                    </button>
                    {savedNumbers.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={`dashboard-button dashboard-button--ghost${modal.whatsappNumber === n.phone_number ? " dashboard-button--active" : ""}`}
                        style={{ fontSize: "0.8rem", padding: "2px 10px" }}
                        onClick={() => setModal({ ...modal, whatsappNumber: n.phone_number })}
                      >
                        {n.label || n.phone_number}
                      </button>
                    ))}
                  </div>
                ) : null}
                <span className="dashboard-helper">
                  Deixe vazio para usar o numero padrao do cliente.
                </span>
              </div>
                </>
              ) : (
                /* Bloco SMS */
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Configuração SMS — EUA
                  </div>
                  <div className="dashboard-field" style={{ margin: 0 }}>
                    <span>Telefone SMS (formato internacional)</span>
                    <input
                      type="text"
                      value={modal.smsPhone}
                      onChange={(e) => setModal({ ...modal, smsPhone: e.target.value })}
                      placeholder="+12125551234"
                    />
                    <span className="dashboard-helper">
                      Formato: +1 seguido de 10 dígitos. Ex: +12125551234
                    </span>
                  </div>
                  <div className="dashboard-field" style={{ margin: 0 }}>
                    <span>Mensagem padrão do SMS</span>
                    <textarea
                      rows={3}
                      value={modal.defaultMessage}
                      onChange={(e) => setModal({ ...modal, defaultMessage: e.target.value })}
                      placeholder="Hi, I want a quote for sofa cleaning"
                    />
                    <span className="dashboard-helper">
                      Esta mensagem será pré-preenchida no app de SMS do usuário. Use apenas texto simples.
                    </span>
                  </div>
                  {modal.smsPhone && modal.defaultMessage ? (
                    <div className="dashboard-helper" style={{ wordBreak: "break-all" }}>
                      Preview do link: <code style={{ fontSize: "0.78rem" }}>sms:{modal.smsPhone}?body={encodeURIComponent(modal.defaultMessage)}</code>
                    </div>
                  ) : null}
                </div>
              )}

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

              {/* Fonte da campanha */}
              <div className="dashboard-field">
                <span>Fonte da campanha</span>
                <select
                  value={modal.campaignSource}
                  onChange={(e) => setModal({ ...modal, campaignSource: e.target.value as CampaignSource })}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.9rem" }}
                >
                  <option value="direct">Direto / Orgânico</option>
                  <option value="google">Google Ads</option>
                  <option value="meta">Meta Ads (Facebook / Instagram)</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              {/* Bloco SEO — apenas para Google Ads */}
              {modal.campaignSource === "google" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Otimização Google Ads — Landing Page
                  </div>
                  <p className="dashboard-helper" style={{ margin: 0 }}>
                    Esses dados geram automaticamente o conteúdo da página de redirect, melhorando o Quality Score.
                  </p>

                  {/* Localização */}
                  <div className="dashboard-field" style={{ margin: 0 }}>
                    <span>Localização(ões) atendida(s) *</span>
                    <textarea
                      rows={3}
                      placeholder={"Londrina PR\nRegião Metropolitana de Londrina\nNorte do Paraná"}
                      value={modal.seoLocations.join("\n")}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          seoLocations: e.target.value.split("\n").map((s) => s.trim()),
                        })
                      }
                    />
                    <span className="dashboard-helper">Uma por linha. Ex: Londrina PR · Curitiba PR</span>
                  </div>

                  {/* Keywords */}
                  <div className="dashboard-field" style={{ margin: 0 }}>
                    <span>
                      Palavras-chave *{" "}
                      <span style={{ fontWeight: 400, color: modal.seoKeywords.filter(Boolean).length < 10 ? "#dc2626" : "#15803d" }}>
                        ({modal.seoKeywords.filter(Boolean).length}/10 mínimo)
                      </span>
                    </span>
                    <textarea
                      rows={6}
                      placeholder={"limpeza de sofá londrina\nhigienização de sofá londrina\nlavagem de sofá londrina\nlimpeza de estofados londrina\nhigienização de estofados londrina\nlavagem de sofa profissional\nimpermeabilização de sofá londrina\nlimpeza profissional de sofá\nlimpeza sofá perto de mim\nlimpar sofá londrina"}
                      value={modal.seoKeywords.join("\n")}
                      onChange={(e) => {
                        const kws = e.target.value.split("\n").map((s) => s.trim()).slice(0, 20);
                        setModal({ ...modal, seoKeywords: kws });
                      }}
                    />
                    <span className="dashboard-helper">Mínimo 10, máximo 20. Uma por linha. Use as mesmas do Google Ads.</span>
                  </div>

                  {/* Avançado */}
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "#15803d", fontWeight: 600 }}>
                      Personalização avançada (opcional — gerado automaticamente se vazio)
                    </summary>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                      <div className="dashboard-field" style={{ margin: 0 }}>
                        <span>Título da página</span>
                        <input
                          type="text"
                          placeholder='Se vazio → "[1ª keyword] em [localização]"'
                          value={modal.seoTitle}
                          onChange={(e) => setModal({ ...modal, seoTitle: e.target.value })}
                        />
                      </div>
                      <div className="dashboard-field" style={{ margin: 0 }}>
                        <span>Descrição</span>
                        <textarea
                          rows={3}
                          placeholder="Se vazia, gerada automaticamente."
                          value={modal.seoDescription}
                          onChange={(e) => setModal({ ...modal, seoDescription: e.target.value })}
                        />
                      </div>
                      <div className="dashboard-field" style={{ margin: 0 }}>
                        <span>Benefícios (bullets)</span>
                        <textarea
                          rows={4}
                          placeholder={"Atendemos Londrina e região\nProdutos seguros para pets\nOrçamento grátis pelo WhatsApp"}
                          value={modal.seoBullets.join("\n")}
                          onChange={(e) =>
                            setModal({
                              ...modal,
                              seoBullets: e.target.value.split("\n").map((s) => s.trim()),
                            })
                          }
                        />
                        <span className="dashboard-helper">Um por linha. Se vazio, gerado automaticamente.</span>
                      </div>
                    </div>
                  </details>
                </div>
              )}

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

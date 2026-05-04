"use client";

import { useState, useCallback } from "react";
import type { GroupCampaignWithStats } from "@/lib/group-campaigns";

type Props = {
  initialCampaigns: GroupCampaignWithStats[];
  isAgencyAdmin: boolean;
  currentUserClientSlug: string | null;
  clients: { slug: string; name: string }[];
  baseUrl: string;
  canCreate?: boolean;
};

export function GroupCampaignsManager({
  initialCampaigns,
  isAgencyAdmin,
  currentUserClientSlug,
  clients,
  baseUrl,
  canCreate = true,
}: Props) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    client_slug: currentUserClientSlug ?? "",
    name: "",
    tracking_slug: "",
    group_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const slug = isAgencyAdmin ? "" : (currentUserClientSlug ?? "");
    const url = slug
      ? `/api/group/campaigns?client_slug=${encodeURIComponent(slug)}`
      : "/api/group/campaigns";
    const res = await fetch(url);
    const data = (await res.json()) as { campaigns?: GroupCampaignWithStats[] };
    if (data.campaigns) setCampaigns(data.campaigns);
  }, [isAgencyAdmin, currentUserClientSlug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Nome obrigatorio."); return; }
    if (!form.tracking_slug.trim()) { setError("Slug obrigatorio."); return; }
    if (!form.group_url.trim()) { setError("Link do grupo obrigatorio."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/group/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as { campaign?: GroupCampaignWithStats; error?: string };
      if (!res.ok) { setError(data.error ?? "Erro ao criar campanha."); }
      else {
        setCreating(false);
        setForm({ client_slug: currentUserClientSlug ?? "", name: "", tracking_slug: "", group_url: "" });
        await refresh();
      }
    } catch { setError("Erro de rede."); }
    finally { setSaving(false); }
  };

  const handleToggle = async (camp: GroupCampaignWithStats) => {
    setToggling(camp.id);
    try {
      await fetch(`/api/group/campaigns/${camp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !camp.is_active })
      });
      setCampaigns((prev) =>
        prev.map((c) => c.id === camp.id ? { ...c, is_active: !camp.is_active } : c)
      );
    } finally { setToggling(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta campanha? Os dados de rastreamento tambem serao removidos.")) return;
    await fetch(`/api/group/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const copyLink = async (camp: GroupCampaignWithStats) => {
    const utmParams =
      "utm_source=facebook&utm_medium=cpc" +
      "&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}" +
      "&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}&placement={{placement}}";
    const link = `${baseUrl}/g/${camp.client_slug}/${camp.tracking_slug}?${utmParams}`;
    try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
    setCopiedId(camp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        {canCreate ? (
          <button
            className="dashboard-button"
            style={{ height: 36, fontSize: "0.85rem" }}
            onClick={() => setCreating((v) => !v)}
          >
            + Nova Campanha de Grupo
          </button>
        ) : null}
      </div>

      {creating && (
        <article className="dashboard-card" style={{ marginBottom: 20 }}>
          <div className="dashboard-card__header"><h3>Nova Campanha — Grupo WhatsApp</h3></div>
          <form onSubmit={(e) => void handleCreate(e)} className="dashboard-form-grid">

            {isAgencyAdmin && (
              <label className="dashboard-field dashboard-field--full">
                <span>Cliente *</span>
                <select
                  value={form.client_slug}
                  onChange={(e) => setForm((s) => ({ ...s, client_slug: e.target.value }))}
                  style={{ height: 40, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", padding: "0 10px", fontSize: "0.88rem", background: "var(--bg)", color: "var(--dark)", width: "100%" }}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="dashboard-field dashboard-field--full">
              <span>Nome da campanha *</span>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((s) => ({ ...s, name, tracking_slug: s.tracking_slug || autoSlug(name) }));
                }}
                placeholder="Ex: Grupo VIP Estetica"
              />
            </label>

            <label className="dashboard-field">
              <span>Slug rastreavel *</span>
              <input
                value={form.tracking_slug}
                onChange={(e) => setForm((s) => ({ ...s, tracking_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                placeholder="grupo-vip-estetica"
              />
              {form.tracking_slug && form.client_slug && (
                <span className="dashboard-helper" style={{ marginTop: 4 }}>
                  Link: {baseUrl}/g/{form.client_slug}/{form.tracking_slug}
                </span>
              )}
            </label>

            <label className="dashboard-field">
              <span>Link do grupo WhatsApp *</span>
              <input
                value={form.group_url}
                onChange={(e) => setForm((s) => ({ ...s, group_url: e.target.value.trim() }))}
                placeholder="https://chat.whatsapp.com/XXXXXXXX"
              />
              <span className="dashboard-helper" style={{ marginTop: 4 }}>
                Apenas links https://chat.whatsapp.com/... sao aceitos.
              </span>
            </label>

            {error && (
              <div className="dashboard-alert dashboard-alert--error dashboard-field--full">{error}</div>
            )}

            <div className="dashboard-actions dashboard-field--full">
              <button type="submit" className="dashboard-button" disabled={saving} style={{ height: 36, fontSize: "0.85rem" }}>
                {saving ? "Criando..." : "Criar campanha"}
              </button>
              <button type="button" className="dashboard-button dashboard-button--ghost"
                onClick={() => { setCreating(false); setError(""); }}
                style={{ height: 36, fontSize: "0.85rem" }}>
                Cancelar
              </button>
            </div>
          </form>
        </article>
      )}

      {campaigns.length === 0 ? (
        <div className="dashboard-card">
          <div className="dashboard-empty">
            Nenhuma campanha de grupo cadastrada. Clique em &ldquo;+ Nova Campanha de Grupo&rdquo; para comecar.
          </div>
        </div>
      ) : (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Campanha</th>
                {isAgencyAdmin && <th>Cliente</th>}
                <th style={{ textAlign: "center" }}>Visualizacoes</th>
                <th
                  style={{ textAlign: "center", cursor: "help" }}
                  title="Leads do grupo sao pessoas que clicaram no botao Entrar no grupo. O WhatsApp nao informa automaticamente quem entrou apos o clique."
                >
                  Cliques p/ entrar{" "}
                  <span style={{ fontSize: "0.7rem", opacity: 0.6, fontWeight: 400 }}>(?)</span>
                </th>
                <th style={{ textAlign: "center" }}>CTR</th>
                <th style={{ textAlign: "center" }}>Leads na CAPI</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => {
                const link = `${baseUrl}/g/${camp.client_slug}/${camp.tracking_slug}`;
                return (
                  <tr key={camp.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{camp.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                        /g/{camp.client_slug}/{camp.tracking_slug}
                      </div>
                    </td>
                    {isAgencyAdmin && (
                      <td style={{ fontSize: "0.82rem" }}>{camp.client_slug}</td>
                    )}
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{camp.page_views}</td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#25D366" }}>{camp.join_clicks}</td>
                    <td style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                      {camp.ctr}%
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#1d4ed8" }}>{camp.capi_leads}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className={`conn-badge ${camp.is_active ? "conn-badge--connected" : "conn-badge--disconnected"}`}
                        style={{ cursor: "pointer", border: "none", background: "none", padding: 0 }}
                        disabled={toggling === camp.id}
                        onClick={() => void handleToggle(camp)}
                        title={camp.is_active ? "Clique para desativar" : "Clique para ativar"}
                      >
                        {camp.is_active ? "Ativa" : "Inativa"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button
                          className="dashboard-button dashboard-button--ghost"
                          style={{
                            height: 28, fontSize: "0.75rem",
                            color: copiedId === camp.id ? "#16a34a" : undefined,
                            borderColor: copiedId === camp.id ? "#86efac" : undefined
                          }}
                          onClick={() => void copyLink(camp)}
                        >
                          {copiedId === camp.id ? "Copiado!" : "Copiar link"}
                        </button>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dashboard-button dashboard-button--ghost"
                          style={{ height: 28, fontSize: "0.75rem", textDecoration: "none" }}
                        >
                          Ver pagina
                        </a>
                        {isAgencyAdmin && (
                          <button
                            className="dashboard-button dashboard-button--ghost"
                            style={{ height: 28, fontSize: "0.75rem", color: "#DC2626", borderColor: "#FCA5A5" }}
                            onClick={() => void handleDelete(camp.id)}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="dashboard-card" style={{ marginTop: 20, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div style={{ fontSize: "0.82rem", color: "#1e3a8a", lineHeight: 1.6 }}>
          <strong>Como usar no Meta Ads:</strong>
          <p style={{ margin: "6px 0 0" }}>
            Use o botao <strong>Copiar link</strong> para obter a URL com parametros dinamicos da Meta
            ({"{{"} campaign.name {"}}"}, {"{{"} ad.name {"}}"}, etc.) e cole no campo <strong>URL do site</strong> da campanha de Leads.
            Ao clicar em &ldquo;Entrar no grupo&rdquo;, o sistema registra o Lead no Pixel e na CAPI automaticamente.
          </p>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginTop: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div style={{ fontSize: "0.82rem", color: "#166534", lineHeight: 1.6 }}>
          <strong>O que cada metrica significa:</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li><strong>Visualizacoes:</strong> pessoas que abriram a pagina intermediaria.</li>
            <li><strong>Cliques p/ entrar:</strong> interessados no grupo que clicaram no botao — representam <strong>intencao de entrada</strong>.</li>
            <li><strong>Leads na CAPI:</strong> cliques cujo evento Lead foi enviado com sucesso a API de Conversoes da Meta.</li>
            <li>O WhatsApp nao informa quem efetivamente entrou no grupo apos o clique.</li>
          </ul>
        </div>
      </div>
    </>
  );
}

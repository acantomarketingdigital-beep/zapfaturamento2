"use client";

import { useState, useEffect } from "react";

type Client = { value: string; label: string };
type Campaign = { id: string; name: string };
type Mode = "test_only" | "client_all" | "campaign_all" | "last_n_days" | "missing_utm_campaign";

const MODE_LABELS: Record<Mode, string> = {
  test_only:           "Todos os leads de teste",
  client_all:          "Todos os leads de um cliente",
  campaign_all:        "Todos os leads de uma campanha",
  last_n_days:         "Leads de teste dos últimos N dias",
  missing_utm_campaign:"Leads sem utm_campaign",
};

const MODE_WARNING: Record<Mode, string> = {
  test_only:
    "Apaga todos os leads marcados como teste. Leads reais, clientes, campanhas, links e Pixel serão mantidos.",
  client_all:
    "Apaga TODOS os leads do cliente selecionado — incluindo leads reais. Clientes, campanhas, links, Pixel e CAPI serão mantidos.",
  campaign_all:
    "Apaga todos os leads da campanha selecionada. Clientes, campanhas, links, Pixel e CAPI serão mantidos.",
  last_n_days:
    "Apaga todos os leads de teste criados nos últimos N dias.",
  missing_utm_campaign:
    "Apaga todos os leads sem utm_campaign definido. Pode incluir leads reais sem rastreamento.",
};

export function CleanTestLeadsButton({ clients }: { clients: Client[] }) {
  const [open, setOpen]                   = useState(false);
  const [mode, setMode]                   = useState<Mode>("test_only");
  const [clientSlug, setClientSlug]       = useState("");
  const [campaignId, setCampaignId]       = useState("");
  const [days, setDays]                   = useState(7);
  const [confirm, setConfirm]             = useState("");
  const [campaigns, setCampaigns]         = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState<{ deleted?: number; error?: string } | null>(null);

  // Fetch campaigns when client changes in campaign_all mode
  useEffect(() => {
    if (mode !== "campaign_all" || !clientSlug) {
      setCampaigns([]);
      setCampaignId("");
      return;
    }
    setLoadingCampaigns(true);
    setCampaignId("");
    fetch(`/api/admin/client-campaigns?clientSlug=${encodeURIComponent(clientSlug)}`)
      .then((r) => r.json())
      .then((data: { campaigns?: Campaign[] }) => setCampaigns(data.campaigns ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, [mode, clientSlug]);

  function handleOpen() {
    setOpen(true);
    setResult(null);
    setConfirm("");
    setMode("test_only");
    setClientSlug("");
    setCampaignId("");
    setDays(7);
    setCampaigns([]);
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setResult(null);
    setConfirm("");
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setClientSlug("");
    setCampaignId("");
    setConfirm("");
  }

  const needsClient   = mode === "client_all" || mode === "campaign_all";
  const needsCampaign = mode === "campaign_all";

  const canConfirm =
    !loading &&
    confirm === "LIMPAR" &&
    !(needsClient && !clientSlug) &&
    !(needsCampaign && !campaignId) &&
    !(result?.deleted !== undefined && !result?.error);

  async function handleConfirm() {
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { mode };
      if (needsClient)   body.clientSlug = clientSlug;
      if (needsCampaign) body.campaignId = Number(campaignId);
      if (mode === "last_n_days") body.days = days;

      const res  = await fetch("/api/leads/clean", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = (await res.json()) as { deleted?: number; error?: string };
      setResult(data);
      if (!data.error) {
        setTimeout(() => {
          setOpen(false);
          setResult(null);
          setConfirm("");
          window.location.reload();
        }, 1800);
      }
    } catch {
      setResult({ error: "Erro ao conectar com o servidor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="dashboard-button dashboard-button--ghost"
        onClick={handleOpen}
        style={{ fontSize: "0.8rem", height: 32 }}
      >
        Limpar leads
      </button>

      {open && (
        <div className="dashboard-modal-backdrop" onClick={handleClose}>
          <div
            className="dashboard-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div className="dashboard-card__header" style={{ marginBottom: 0 }}>
              <div>
                <h3 style={{ margin: 0 }}>Limpar leads</h3>
                <p className="dashboard-helper" style={{ marginTop: 4 }}>
                  Ação irreversível. Leads excluídos não podem ser recuperados.
                </p>
              </div>
            </div>

            <div className="dashboard-form-stack" style={{ marginTop: 16 }}>

              {/* Mode */}
              <label className="dashboard-field">
                <span>O que deletar</span>
                <select
                  value={mode}
                  onChange={(e) => handleModeChange(e.target.value as Mode)}
                  disabled={loading}
                >
                  {(Object.entries(MODE_LABELS) as [Mode, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>

              {/* Client */}
              {needsClient && (
                <label className="dashboard-field">
                  <span>
                    Cliente <span style={{ color: "#dc2626" }}>*</span>
                  </span>
                  <select
                    value={clientSlug}
                    onChange={(e) => { setClientSlug(e.target.value); setCampaignId(""); setConfirm(""); }}
                    disabled={loading}
                  >
                    <option value="">Selecione um cliente…</option>
                    {clients.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              )}

              {/* Campaign */}
              {needsCampaign && clientSlug && (
                <label className="dashboard-field">
                  <span>
                    Campanha <span style={{ color: "#dc2626" }}>*</span>
                  </span>
                  <select
                    value={campaignId}
                    onChange={(e) => { setCampaignId(e.target.value); setConfirm(""); }}
                    disabled={loading || loadingCampaigns}
                  >
                    <option value="">
                      {loadingCampaigns ? "Carregando…" : campaigns.length === 0 ? "Nenhuma campanha encontrada" : "Selecione uma campanha…"}
                    </option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
              )}

              {/* Days */}
              {mode === "last_n_days" && (
                <label className="dashboard-field">
                  <span>Período (dias)</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    disabled={loading}
                  />
                </label>
              )}

              {/* Warning */}
              <div style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: "0.82rem",
                color: "#7f1d1d",
                lineHeight: 1.5,
              }}>
                {MODE_WARNING[mode]}
              </div>

              {/* Confirmation input */}
              <label className="dashboard-field">
                <span>
                  Digite <strong>LIMPAR</strong> para confirmar
                </span>
                <input
                  type="text"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="LIMPAR"
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>

              {result?.error && (
                <div className="dashboard-alert dashboard-alert--error">{result.error}</div>
              )}
              {result?.deleted !== undefined && !result.error && (
                <div className="dashboard-alert dashboard-alert--success">
                  {result.deleted} lead(s) excluído(s) com sucesso. Recarregando…
                </div>
              )}
            </div>

            <div className="dashboard-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="dashboard-button"
                style={{ background: "#DC2626", borderColor: "#DC2626" }}
                onClick={handleConfirm}
                disabled={!canConfirm}
              >
                {loading ? "Excluindo…" : "Confirmar exclusão"}
              </button>
              <button
                type="button"
                className="dashboard-button dashboard-button--ghost"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

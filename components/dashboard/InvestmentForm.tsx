"use client";

import { useEffect, useState } from "react";
import { formatCurrency, type Currency } from "@/lib/format";

type ClientOption = {
  clientSlug: string;
  clientName: string;
};

type CampaignOption = {
  id: string;
  slug: string;
  name: string;
  dailyBudgetCents: number;
  currency: Currency;
};

type InvestmentFormProps = {
  clients: ClientOption[];
  isAgencyAdmin: boolean;
  defaultClientSlug: string;
};

export function InvestmentForm({ clients, isAgencyAdmin, defaultClientSlug }: InvestmentFormProps) {
  const [clientSlug, setClientSlug]         = useState(defaultClientSlug);
  const [campaigns, setCampaigns]           = useState<CampaignOption[]>([]);
  const [campaignId, setCampaignId]         = useState("");
  const [audiences, setAudiences]           = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [loadingCampaigns, setLoadingCampaigns]   = useState(false);
  const [loadingAudiences, setLoadingAudiences]   = useState(false);
  const [investment, setInvestment]         = useState("");
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");
  const [success, setSuccess]               = useState("");

  useEffect(() => {
    if (!clientSlug) { setCampaigns([]); setCampaignId(""); return; }
    setLoadingCampaigns(true);
    setCampaignId(""); setAudiences([]); setSelectedAudiences([]); setInvestment("");
    fetch(`/api/campaigns?clientSlug=${encodeURIComponent(clientSlug)}`)
      .then((r) => r.json())
      .then((data: { campaigns?: CampaignOption[] }) => setCampaigns(data.campaigns ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false));
  }, [clientSlug]);

  const selectedCampaign = campaigns.find((c) => c.id === campaignId);

  useEffect(() => {
    if (!campaignId || !selectedCampaign) { setAudiences([]); setSelectedAudiences([]); return; }
    if (selectedCampaign.dailyBudgetCents > 0) {
      setInvestment((selectedCampaign.dailyBudgetCents / 100).toFixed(2));
    }
    setLoadingAudiences(true);
    setAudiences([]); setSelectedAudiences([]);
    fetch(
      `/api/investments/audiences?clientSlug=${encodeURIComponent(clientSlug)}&campaignSlug=${encodeURIComponent(selectedCampaign.slug)}`
    )
      .then((r) => r.json())
      .then((data: { audiences?: string[] }) => setAudiences(data.audiences ?? []))
      .catch(() => setAudiences([]))
      .finally(() => setLoadingAudiences(false));
  }, [campaignId]);

  const currency: Currency = selectedCampaign?.currency ?? "BRL";

  const toggleAudience = (a: string) =>
    setSelectedAudiences((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const selectAll = () => setSelectedAudiences([...audiences]);
  const clearAll  = () => setSelectedAudiences([]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setSuccess("");
    if (!clientSlug)       { setError("Selecione o cliente."); return; }
    if (!selectedCampaign) { setError("Selecione a campanha."); return; }
    if (!investment || Number(investment) <= 0) { setError("Informe um valor valido."); return; }

    setSaving(true);
    const targets = selectedAudiences.length > 0 ? selectedAudiences : [null];

    try {
      for (const audience of targets) {
        const res = await fetch("/dashboard/investimentos/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientSlug,
            campaign:             selectedCampaign.slug,
            campaignName:         selectedCampaign.name,
            internalCampaignSlug: selectedCampaign.slug,
            audience,
            investmentCents: Math.round(Number(investment) * 100),
            currency,
          }),
        });
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          throw new Error(data.error || "Erro ao salvar.");
        }
      }
      const label = targets.length > 1 ? `${targets.length} publicos` : targets[0] ?? "sem publico";
      setSuccess(`Investimento salvo para ${label}.`);
      setSelectedAudiences([]);
      setTimeout(() => { setSuccess(""); window.location.reload(); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar investimento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="dashboard-form-grid">
      {isAgencyAdmin && (
        <label className="dashboard-field">
          <span>Cliente</span>
          <select value={clientSlug} onChange={(e) => setClientSlug(e.target.value)} required>
            <option value="">Selecione</option>
            {clients.map((c) => (
              <option key={c.clientSlug} value={c.clientSlug}>{c.clientName}</option>
            ))}
          </select>
        </label>
      )}

      <label className="dashboard-field">
        <span>Campanha</span>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          required
          disabled={loadingCampaigns || !clientSlug}
        >
          <option value="">
            {loadingCampaigns ? "Carregando..." : campaigns.length === 0 && clientSlug ? "Nenhuma campanha" : "Selecione"}
          </option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.dailyBudgetCents > 0 ? ` — ${formatCurrency(c.dailyBudgetCents / 100, c.currency)}/dia` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-field">
        <span>Valor investido ({currency})</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={investment}
          onChange={(e) => setInvestment(e.target.value)}
          placeholder="0,00"
          required
        />
        {selectedCampaign?.dailyBudgetCents && selectedCampaign.dailyBudgetCents > 0 ? (
          <span className="dashboard-helper" style={{ marginTop: 4 }}>
            Orcamento diario: {formatCurrency(selectedCampaign.dailyBudgetCents / 100, currency)}/dia
          </span>
        ) : null}
      </label>

      {/* Audiences multi-select */}
      {campaignId && (
        <div className="dashboard-field dashboard-field--full">
          <span style={{ fontWeight: 500, fontSize: "0.85rem", display: "block", marginBottom: 8 }}>
            Publicos (conjuntos de anuncios)
            {loadingAudiences && (
              <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>carregando...</span>
            )}
          </span>

          {!loadingAudiences && audiences.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
              Nenhum publico encontrado nos leads desta campanha. O investimento sera salvo sem publico definido.
            </p>
          )}

          {audiences.length > 0 && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  className="dashboard-button dashboard-button--ghost"
                  style={{ height: 28, fontSize: "0.75rem" }}
                  onClick={selectAll}
                >
                  Selecionar todos
                </button>
                {selectedAudiences.length > 0 && (
                  <button
                    type="button"
                    className="dashboard-button dashboard-button--ghost"
                    style={{ height: 28, fontSize: "0.75rem" }}
                    onClick={clearAll}
                  >
                    Limpar ({selectedAudiences.length})
                  </button>
                )}
              </div>

              <div style={{
                display: "flex", flexDirection: "column", gap: 6,
                maxHeight: 220, overflowY: "auto",
                border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                padding: "10px 12px", background: "var(--bg)"
              }}>
                {audiences.map((a) => (
                  <label
                    key={a}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: "0.85rem", cursor: "pointer",
                      padding: "4px 6px", borderRadius: 4,
                      background: selectedAudiences.includes(a) ? "var(--accent-light, #f0fdf4)" : "transparent"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAudiences.includes(a)}
                      onChange={() => toggleAudience(a)}
                      style={{ width: 16, height: 16, accentColor: "var(--brand)", cursor: "pointer" }}
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </div>

              {selectedAudiences.length > 1 && (
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>
                  {selectedAudiences.length} publicos selecionados — sera criado 1 registro por publico com o valor informado.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {error   && <div className="dashboard-alert dashboard-alert--error   dashboard-field--full">{error}</div>}
      {success && <div className="dashboard-alert dashboard-alert--success  dashboard-field--full">{success}</div>}

      <div className="dashboard-actions dashboard-field--full">
        <button type="submit" className="dashboard-button" disabled={saving}>
          {saving ? "Salvando..." : selectedAudiences.length > 1 ? `Salvar (${selectedAudiences.length} publicos)` : "Salvar investimento"}
        </button>
      </div>
    </form>
  );
}

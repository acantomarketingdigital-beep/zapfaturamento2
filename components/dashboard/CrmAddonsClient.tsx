"use client";

import { useState } from "react";

type Props = {
  whatsappActive: boolean;
  stripeReady: boolean;
};

export function CrmAddonsClient({ whatsappActive, stripeReady }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addons = [
    {
      type: "whatsapp",
      label: "WhatsApp Adicional",
      description: "Conecte mais números WhatsApp ao seu atendimento. 1 número já incluso no CRM.",
      price: 29,
      isActive: whatsappActive,
    },
  ];

  async function handleBuy(addonType: string) {
    setLoading(addonType);
    setError(null);
    try {
      const res = await fetch("/api/stripe/crm-addon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addonType }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro ao criar sessão de pagamento.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Add-ons do plano CRM</h3>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          Expanda sua operação com recursos adicionais. Cobrado mensalmente por assinatura recorrente.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {addons.map((addon) => (
          <div
            key={addon.type}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "14px 16px",
              background: "var(--bg)",
              border: `1px solid ${addon.isActive ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
              borderRadius: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.9rem", color: "var(--dark)" }}>
                {addon.label}
                {addon.isActive && (
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, color: "#166534",
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    borderRadius: 99, padding: "1px 8px",
                  }}>
                    Ativo
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                {addon.description}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--brand)", marginTop: 3, fontWeight: 600 }}>
                R${addon.price}/mês
              </div>
            </div>

            {!addon.isActive && stripeReady && (
              <button
                type="button"
                className="dashboard-button dashboard-button--brand"
                disabled={loading === addon.type}
                onClick={() => void handleBuy(addon.type)}
                style={{ minWidth: 110, height: 36, fontSize: "0.82rem" }}
              >
                {loading === addon.type ? "Aguarde..." : "Contratar"}
              </button>
            )}

            {!addon.isActive && !stripeReady && (
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                Pagamento não configurado
              </span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: "0.83rem",
          background: "rgba(239,68,68,0.07)", color: "#9a3412",
          border: "1px solid rgba(239,68,68,0.25)",
        }}>
          {error}
        </div>
      )}
    </article>
  );
}

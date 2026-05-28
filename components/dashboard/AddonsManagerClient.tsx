"use client";

import { useState } from "react";

type AddonRow = {
  type: "form" | "whatsapp";
  label: string;
  included: number | null;
  unitPrice: number | null;
  current: number;
};

type Props = {
  planKey: string | null;
  extraFormPriceMonthly: number | null;
  extraWhatsappPriceMonthly: number | null;
  formsIncluded: number | null;
  whatsappsIncluded: number | null;
  initialForms: number;
  initialWhatsapps: number;
};

export default function AddonsManagerClient({
  planKey,
  extraFormPriceMonthly,
  extraWhatsappPriceMonthly,
  formsIncluded,
  whatsappsIncluded,
  initialForms,
  initialWhatsapps,
}: Props) {
  const [formQty, setFormQty] = useState(initialForms);
  const [waQty, setWaQty] = useState(initialWhatsapps);
  const [loading, setLoading] = useState<"form" | "whatsapp" | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Enterprise = unlimited (null included) — no add-ons needed
  const enterpriseLocked = formsIncluded === null && whatsappsIncluded === null;
  if (enterpriseLocked) return null;

  const addons: AddonRow[] = [
    {
      type: "form",
      label: "Formulários extras",
      included: formsIncluded,
      unitPrice: extraFormPriceMonthly,
      current: formQty,
    },
    {
      type: "whatsapp",
      label: "WhatsApps extras",
      included: whatsappsIncluded,
      unitPrice: extraWhatsappPriceMonthly,
      current: waQty,
    },
  ];

  async function handleUpdate(type: "form" | "whatsapp", qty: number) {
    setLoading(type);
    setMessage(null);
    try {
      const res = await fetch("/api/asaas/addon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity: qty }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage({ type: "err", text: json.error ?? "Erro ao atualizar add-on." });
      } else {
        setMessage({ type: "ok", text: "Add-on atualizado com sucesso." });
      }
    } catch {
      setMessage({ type: "err", text: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(null);
    }
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Add-ons</h3>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          Expanda sua capacidade sem mudar de plano. Cobranças proporcionais ao ciclo atual.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {addons.map((addon) => {
          const qty = addon.type === "form" ? formQty : waQty;
          const setQty = addon.type === "form" ? setFormQty : setWaQty;
          const isLoading = loading === addon.type;
          const changed = qty !== (addon.type === "form" ? initialForms : initialWhatsapps);

          return (
            <div
              key={addon.type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 16px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                flexWrap: "wrap",
              }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--dark)" }}>
                  {addon.label}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                  {addon.included !== null ? `${addon.included} incluídos no plano` : "Ilimitado"}
                  {qty > 0 && (
                    <span style={{ color: "var(--brand)", marginLeft: 6 }}>+ {qty} ativo{qty !== 1 ? "s" : ""}</span>
                  )}
                </div>
                {addon.unitPrice !== null && (
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>
                    R${addon.unitPrice}/mês por unidade extra
                  </div>
                )}
              </div>

              {/* Quantity control */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  aria-label="Diminuir"
                  onClick={() => setQty((v) => Math.max(0, v - 1))}
                  disabled={qty <= 0 || isLoading}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    border: "1px solid var(--border)", background: "var(--bg-alt)",
                    cursor: qty <= 0 || isLoading ? "not-allowed" : "pointer",
                    fontSize: "1rem", fontWeight: 700, color: "var(--dark)",
                    opacity: qty <= 0 || isLoading ? 0.4 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  −
                </button>

                <input
                  type="number"
                  min={0}
                  max={99}
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 0 && v <= 99) setQty(v);
                  }}
                  disabled={isLoading}
                  style={{
                    width: 52, height: 32, textAlign: "center",
                    border: "1px solid var(--border)", borderRadius: 6,
                    background: "var(--bg)", color: "var(--dark)",
                    fontSize: "0.95rem", fontWeight: 700,
                  }}
                />

                <button
                  type="button"
                  aria-label="Aumentar"
                  onClick={() => setQty((v) => Math.min(99, v + 1))}
                  disabled={qty >= 99 || isLoading}
                  style={{
                    width: 32, height: 32, borderRadius: 6,
                    border: "1px solid var(--border)", background: "var(--bg-alt)",
                    cursor: qty >= 99 || isLoading ? "not-allowed" : "pointer",
                    fontSize: "1rem", fontWeight: 700, color: "var(--dark)",
                    opacity: qty >= 99 || isLoading ? 0.4 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={() => handleUpdate(addon.type, qty)}
                disabled={!changed || isLoading}
                className="dashboard-button"
                style={{
                  minWidth: 110, height: 36, fontSize: "0.82rem",
                  opacity: !changed || isLoading ? 0.5 : 1,
                  cursor: !changed || isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Salvando…" : "Salvar"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feedback message */}
      {message && (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: "0.83rem",
          background: message.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.07)",
          color: message.type === "ok" ? "#166534" : "#9a3412",
          border: `1px solid ${message.type === "ok" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}>
          {message.text}
        </div>
      )}

      {planKey && (
        <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 12 }}>
          Plano {planKey} · Alterações têm efeito imediato com cobrança proporcional ao ciclo atual.
        </p>
      )}
    </article>
  );
}

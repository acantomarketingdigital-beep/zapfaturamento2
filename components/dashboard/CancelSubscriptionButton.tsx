"use client";

import { useState } from "react";

export function CancelSubscriptionButton() {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/asaas/cancel", { method: "POST" });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erro ao cancelar. Tente novamente.");
        setConfirm(false);
      } else {
        setDone(true);
        setTimeout(() => { window.location.reload(); }, 2000);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span style={{ fontSize: "0.83rem", color: "#166534", padding: "8px 14px", background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.25)" }}>
        Assinatura cancelada.
      </span>
    );
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="dashboard-button dashboard-button--ghost"
        style={{ color: "#dc2626", borderColor: "rgba(239,68,68,0.4)" }}
      >
        Cancelar assinatura
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.83rem", color: "var(--muted)" }}>Confirmar cancelamento?</span>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleCancel()}
        style={{
          background: "#dc2626", color: "#fff", border: "none", borderRadius: 8,
          padding: "6px 16px", fontSize: "0.83rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Cancelando..." : "Sim, cancelar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="dashboard-button dashboard-button--ghost"
        style={{ fontSize: "0.83rem" }}
      >
        Voltar
      </button>
      {error && <span style={{ fontSize: "0.78rem", color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { WhatsappConversation } from "@/lib/whatsapp-connections";

const STAGES = [
  { key: "novo_lead", label: "Novo Lead" },
  { key: "primeiro_contato", label: "Primeiro Contato" },
  { key: "em_atendimento", label: "Em Atendimento" },
  { key: "orcamento_enviado", label: "Orcamento Enviado" },
  { key: "agendamento", label: "Agendamento" },
  { key: "compareceu", label: "Compareceu" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
] as const;

type StageKey = typeof STAGES[number]["key"];

type Props = {
  initialConversations: WhatsappConversation[];
  trafficOnly?: boolean;
};

type DealModal = {
  convId: string;
  value: string;
};

export function PipelineClient({ initialConversations, trafficOnly = false }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dealModal, setDealModal] = useState<DealModal | null>(null);
  const [savingDeal, setSavingDeal] = useState(false);
  const [filterClient, setFilterClient] = useState<string>("");

  const clients = Array.from(
    new Map(
      initialConversations
        .filter((c) => c.client_name)
        .map((c) => [c.client_slug, c.client_name!])
    ).entries()
  ).map(([slug, name]) => ({ slug, name }));

  const visibleConversations = filterClient
    ? conversations.filter((c) => c.client_slug === filterClient)
    : conversations;

  async function moveStage(convId: string, stage: StageKey) {
    setMovingId(convId);
    try {
      await fetch(`/api/pipeline/conversations/${convId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, pipeline_stage: stage } : c))
      );
    } catch {}
    setMovingId(null);
  }

  async function toggleHot(conv: WhatsappConversation) {
    const next = conv.temperature === "hot" ? "cold" : "hot";
    const reason = next === "hot" ? (prompt("Motivo do lead quente (opcional):") ?? "") : undefined;
    try {
      await fetch(`/api/pipeline/conversations/${conv.id}/temperature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature: next, reason })
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? { ...c, temperature: next as "cold" | "warm" | "hot", hot_reason: reason ?? null }
            : c
        )
      );
    } catch {}
  }

  async function markDeal(convId: string, status: "won" | "lost") {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    if (status === "won") {
      // Show modal to enter value
      setDealModal({ convId, value: conv.deal_value != null ? String(conv.deal_value) : "" });
      return;
    }

    // Mark lost immediately
    try {
      await fetch(`/api/pipeline/conversations/${convId}/deal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "lost" })
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, deal_status: "lost" } : c))
      );
    } catch {}
  }

  async function saveDealWon() {
    if (!dealModal) return;
    setSavingDeal(true);
    const value = parseFloat(dealModal.value.replace(",", ".")) || null;
    try {
      await fetch(`/api/pipeline/conversations/${dealModal.convId}/deal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "won", value })
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === dealModal.convId ? { ...c, deal_status: "won", deal_value: value } : c
        )
      );
      setDealModal(null);
    } catch {}
    setSavingDeal(false);
  }

  async function reopenDeal(convId: string) {
    try {
      await fetch(`/api/pipeline/conversations/${convId}/deal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" })
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, deal_status: "open" } : c))
      );
    } catch {}
  }

  return (
    <>
      {/* Deal value modal */}
      {dealModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDealModal(null); }}
        >
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 12 }}>✅ Marcar como Ganho</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 12 }}>Valor da venda (R$):</p>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={dealModal.value}
              onChange={(e) => setDealModal({ ...dealModal, value: e.target.value })}
              style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: "1rem", boxSizing: "border-box", marginBottom: 14 }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="dashboard-button" onClick={saveDealWon} disabled={savingDeal}>
                {savingDeal ? "Salvando..." : "Confirmar"}
              </button>
              <button className="dashboard-button dashboard-button--ghost" onClick={() => setDealModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Traffic / todos toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Origem:
        </span>
        <a
          href="/dashboard/pipeline"
          style={{
            fontSize: "0.72rem", padding: "4px 12px", borderRadius: 20,
            border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none",
            background: !trafficOnly ? "var(--brand)" : "transparent",
            color: !trafficOnly ? "#fff" : "var(--muted)",
            fontWeight: !trafficOnly ? 600 : 400,
          }}
        >
          Todos
        </a>
        <a
          href="/dashboard/pipeline?mode=traffic"
          style={{
            fontSize: "0.72rem", padding: "4px 12px", borderRadius: 20,
            border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none",
            background: trafficOnly ? "var(--brand)" : "transparent",
            color: trafficOnly ? "#fff" : "var(--muted)",
            fontWeight: trafficOnly ? 600 : 400,
          }}
        >
          Só Tráfego
        </a>
      </div>

      {clients.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cliente:</span>
          <button
            onClick={() => setFilterClient("")}
            style={{
              fontSize: "0.72rem", padding: "3px 12px", borderRadius: 20,
              border: "1px solid var(--border)", cursor: "pointer",
              background: filterClient === "" ? "var(--brand)" : "transparent",
              color: filterClient === "" ? "#fff" : "var(--muted)",
              fontWeight: filterClient === "" ? 600 : 400,
            }}
          >
            Todos
          </button>
          {clients.map(({ slug, name }) => (
            <button
              key={slug}
              onClick={() => setFilterClient(slug)}
              style={{
                fontSize: "0.72rem", padding: "3px 12px", borderRadius: 20,
                border: "1px solid var(--border)", cursor: "pointer",
                background: filterClient === slug ? "var(--brand)" : "transparent",
                color: filterClient === slug ? "#fff" : "var(--muted)",
                fontWeight: filterClient === slug ? 600 : 400,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
        {STAGES.map((stage) => {
          const cards = visibleConversations.filter((c) => c.pipeline_stage === stage.key);
          const wonCount = cards.filter((c) => c.deal_status === "won").length;
          return (
            <div
              key={stage.key}
              style={{ minWidth: 220, maxWidth: 240, background: "var(--surface, #f8fafc)", border: "1px solid var(--border, #e2e8f0)", borderRadius: 10, padding: "10px 10px 14px", flexShrink: 0 }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{stage.label}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {wonCount > 0 && (
                    <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 99, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>
                      ✅ {wonCount}
                    </span>
                  )}
                  <span style={{ background: "var(--border)", borderRadius: 99, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                    {cards.length}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.length === 0 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", padding: "14px 0", opacity: 0.5 }}>Vazio</div>
                )}
                {cards.map((conv) => (
                  <div
                    key={conv.id}
                    style={{
                      background: conv.deal_status === "won" ? "#f0fdf4" : conv.deal_status === "lost" ? "#fef2f2" : "#fff",
                      border: `1px solid ${conv.deal_status === "won" ? "#bbf7d0" : conv.deal_status === "lost" ? "#fecaca" : "var(--border)"}`,
                      borderRadius: 8,
                      padding: "10px 10px 8px",
                    }}
                  >
                    {/* Name + temp */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {conv.contact_name ?? conv.contact_phone}
                      </span>
                      <button
                        title={conv.temperature === "hot" ? "Desmarcar quente" : "Marcar como quente"}
                        onClick={() => toggleHot(conv)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1, flexShrink: 0 }}
                      >
                        {conv.temperature === "hot" ? "🔴" : "⚪"}
                      </button>
                    </div>

                    {/* Last message preview */}
                    {conv.last_message_text && (
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>
                        {conv.last_message_text}
                      </div>
                    )}

                    {/* Deal value if won */}
                    {conv.deal_status === "won" && conv.deal_value != null && (
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#065f46", marginBottom: 5 }}>
                        {conv.deal_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    )}

                    {/* Stage select */}
                    <select
                      value={conv.pipeline_stage}
                      disabled={movingId === conv.id}
                      onChange={(e) => moveStage(conv.id, e.target.value as StageKey)}
                      style={{ fontSize: "0.7rem", width: "100%", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 4px", background: "transparent", cursor: "pointer", marginBottom: 5 }}
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>

                    {/* Won / Lost actions */}
                    {conv.deal_status === "open" && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <button
                          onClick={() => markDeal(conv.id, "won")}
                          style={{ flex: 1, fontSize: "0.65rem", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 5, padding: "3px 0", cursor: "pointer", fontWeight: 600, color: "#065f46" }}
                        >
                          ✅ Ganho
                        </button>
                        <button
                          onClick={() => markDeal(conv.id, "lost")}
                          style={{ flex: 1, fontSize: "0.65rem", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 5, padding: "3px 0", cursor: "pointer", fontWeight: 600, color: "#991b1b" }}
                        >
                          ❌ Perdido
                        </button>
                      </div>
                    )}
                    {conv.deal_status !== "open" && (
                      <button
                        onClick={() => reopenDeal(conv.id)}
                        style={{ width: "100%", fontSize: "0.65rem", background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 0", cursor: "pointer", color: "var(--muted)", marginTop: 4 }}
                      >
                        Reabrir
                      </button>
                    )}

                    {conv.connection_name && (
                      <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 4, opacity: 0.7 }}>{conv.connection_name}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/kanban-shared";
import type { WorkspaceSettings } from "@/lib/workspace-settings";

const STATUS_ORDER: LeadStatus[] = [
  "novo_lead", "em_atendimento", "agendado", "compareceu",
  "negociacao", "pagamento_pendente", "pago", "finalizado", "perdido",
];

// Statuses that drive business logic — shown with a lock icon as reminder
const LOGIC_STATUSES = new Set<LeadStatus>(["agendado", "compareceu", "pago", "perdido"]);

type Props = { initial: WorkspaceSettings };

export function WorkspaceSettingsForm({ initial }: Props) {
  const [kanban, setKanban] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    STATUS_ORDER.forEach((s) => { out[s] = initial.kanban_labels?.[s] ?? ""; });
    return out;
  });

  const [tagsText, setTagsText] = useState(initial.crm_tags_preset.join(", "));
  const [membersText, setMembersText] = useState(initial.team_members.join("\n"));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function parseList(text: string, sep: RegExp) {
    return text.split(sep).map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const labels: Partial<Record<LeadStatus, string>> = {};
      STATUS_ORDER.forEach((s) => {
        const v = kanban[s]?.trim();
        if (v) labels[s] = v;
      });

      const res = await fetch("/api/workspace/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kanban_labels: labels,
          crm_tags_preset: parseList(tagsText, /[,\n]+/),
          team_members: parseList(membersText, /\n+/),
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Kanban labels ── */}
      <section>
        <h3 style={{ marginBottom: 4 }}>Etapas do Kanban</h3>
        <p className="dashboard-helper" style={{ marginBottom: 16 }}>
          Renomeie as etapas como preferir. O sistema continua funcionando normalmente por baixo —
          relatórios, taxas e pagamentos usam a chave interna, não o nome exibido.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {STATUS_ORDER.map((status) => (
            <label key={status} className="dashboard-field" style={{ margin: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.68rem", fontFamily: "monospace", background: "var(--surface-2,#f3f3f3)", padding: "1px 6px", borderRadius: 4, color: "var(--muted)" }}>
                  {status}
                </span>
                {LOGIC_STATUSES.has(status) && (
                  <span title="Usado em relatórios e métricas" style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700 }}>
                    ⚠ lógica
                  </span>
                )}
              </span>
              <input
                type="text"
                placeholder={LEAD_STATUS_LABELS[status]}
                value={kanban[status]}
                onChange={(e) => setKanban((prev) => ({ ...prev, [status]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <p className="dashboard-helper" style={{ marginTop: 10 }}>
          ⚠ Etapas marcadas com <strong>"lógica"</strong> aparecem em relatórios e métricas.
          Renomear só afeta o visual — nunca a estrutura de dados.
        </p>
      </section>

      {/* ── Tags predefinidas ── */}
      <section>
        <h3 style={{ marginBottom: 4 }}>Tags predefinidas (CRM)</h3>
        <p className="dashboard-helper" style={{ marginBottom: 10 }}>
          Separe por vírgula. Aparecem como sugestão ao adicionar tags nos leads.
        </p>
        <textarea
          rows={3}
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="Quente, VIP, Retorno, Indicação, Cold"
          style={{ width: "100%", maxWidth: 500 }}
        />
        {tagsText.trim() && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {parseList(tagsText, /[,\n]+/).map((tag) => (
              <span key={tag} style={{ fontSize: "0.72rem", padding: "2px 10px", borderRadius: 999, background: "rgba(99,102,241,0.12)", color: "#4F46E5", fontWeight: 600, border: "1px solid rgba(99,102,241,0.3)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Membros da equipe ── */}
      <section>
        <h3 style={{ marginBottom: 4 }}>Membros da equipe</h3>
        <p className="dashboard-helper" style={{ marginBottom: 10 }}>
          Um nome por linha. Aparecem no dropdown "Responsável" ao atribuir leads.
        </p>
        <textarea
          rows={5}
          value={membersText}
          onChange={(e) => setMembersText(e.target.value)}
          placeholder={"João Silva\nMaria Santos\nCarlos Oliveira"}
          style={{ width: "100%", maxWidth: 400 }}
        />
      </section>

      {/* ── Save ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          className="dashboard-button dashboard-button--brand"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <span style={{ color: "#10b981", fontWeight: 600, fontSize: "0.85rem" }}>✓ Salvo!</span>}
        {error && <span style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</span>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { formatCurrencyFromCents } from "@/lib/format";
import type { AutoImportPreviewItem } from "@/lib/investments";

type Props = {
  clientSlug: string;
};

export function AutoImportSection({ clientSlug }: Props) {
  const [items, setItems] = useState<AutoImportPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, { days: number; totalCents: number }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/investments/auto-import?clientSlug=${encodeURIComponent(clientSlug)}`)
      .then((r) => r.json())
      .then((data: { items?: AutoImportPreviewItem[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [clientSlug]);

  const handleImport = async (item: AutoImportPreviewItem) => {
    setImporting(item.campaignId);
    setErrors((prev) => { const n = { ...prev }; delete n[item.campaignId]; return n; });
    try {
      const res = await fetch("/api/investments/auto-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSlug, campaignId: item.campaignId })
      });
      const data = (await res.json()) as { ok?: boolean; days?: number; totalCents?: number; error?: string };
      if (!res.ok || !data.ok) {
        setErrors((prev) => ({ ...prev, [item.campaignId]: data.error ?? "Erro ao importar." }));
      } else {
        setDone((prev) => ({ ...prev, [item.campaignId]: { days: data.days!, totalCents: data.totalCents! } }));
        setItems((prev) => prev.map((i) => i.campaignId === item.campaignId ? { ...i, alreadyImported: true } : i));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [item.campaignId]: "Erro de rede." }));
    } finally {
      setImporting(null);
    }
  };

  const available = items.filter((i) => !i.alreadyImported && i.leadDays > 0);
  const imported = items.filter((i) => i.alreadyImported);
  const noLeads = items.filter((i) => !i.alreadyImported && i.leadDays === 0);

  if (!clientSlug) return null;

  if (loading) {
    return (
      <article className="dashboard-card" style={{ marginTop: 20 }}>
        <div className="dashboard-card__header"><h2>Importar automaticamente</h2></div>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", padding: "12px 0" }}>Carregando campanhas...</p>
      </article>
    );
  }

  if (items.length === 0) return null;

  return (
    <article className="dashboard-card" style={{ marginTop: 20 }}>
      <div className="dashboard-card__header">
        <h2>Importar automaticamente</h2>
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
        Calcula o investimento total multiplicando o <strong>orcamento diario</strong> da campanha pelo
        numero de <strong>dias que tiveram leads</strong>. Um registro e criado na tabela de investimentos.
      </p>

      {available.length > 0 && (
        <div className="dashboard-table-wrap" style={{ marginBottom: 12 }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th style={{ textAlign: "center" }}>Orcamento/dia</th>
                <th style={{ textAlign: "center" }}>Dias com leads</th>
                <th style={{ textAlign: "center" }}>Total estimado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {available.map((item) => {
                const result = done[item.campaignId];
                return (
                  <tr key={item.campaignId}>
                    <td>
                      <strong style={{ fontSize: "0.88rem" }}>{item.campaignName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.campaignSlug}</div>
                    </td>
                    <td style={{ textAlign: "center", fontSize: "0.85rem" }}>
                      {formatCurrencyFromCents(item.dailyBudgetCents, item.currency)}/dia
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{item.leadDays}</td>
                    <td style={{ textAlign: "center", fontWeight: 600, color: "#16a34a" }}>
                      {formatCurrencyFromCents(item.totalCents, item.currency)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {result ? (
                        <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>
                          Importado!
                        </span>
                      ) : (
                        <button
                          className="dashboard-button"
                          style={{ height: 30, fontSize: "0.78rem" }}
                          disabled={importing === item.campaignId}
                          onClick={() => void handleImport(item)}
                        >
                          {importing === item.campaignId ? "Importando..." : "Importar"}
                        </button>
                      )}
                      {errors[item.campaignId] && (
                        <div style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: 4 }}>
                          {errors[item.campaignId]}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {noLeads.length > 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 8 }}>
          Sem leads registrados ainda:{" "}
          {noLeads.map((i) => <strong key={i.campaignId}>{i.campaignName}</strong>).reduce<React.ReactNode[]>(
            (acc, el, idx) => idx === 0 ? [el] : [...acc, ", ", el], []
          )}
        </div>
      )}

      {imported.length > 0 && (
        <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          Ja importado:{" "}
          {imported.map((i) => <strong key={i.campaignId}>{i.campaignName}</strong>).reduce<React.ReactNode[]>(
            (acc, el, idx) => idx === 0 ? [el] : [...acc, ", ", el], []
          )}
          {" "}— va em <em>Investimentos cadastrados</em> para excluir e reimportar se necessario.
        </div>
      )}
    </article>
  );
}

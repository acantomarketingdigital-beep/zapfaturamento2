"use client";

import { useMemo, useState } from "react";
import { formatCurrencyFromCents, formatPercent, type Currency } from "@/lib/format";
import type { RelatorioRow } from "@/lib/relatorio";

type SortKey = keyof RelatorioRow;

type Props = {
  rows: RelatorioRow[];
  isAgencyAdmin: boolean;
};

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.25, fontSize: "0.7rem" }}>
      {active ? (asc ? "▲" : "▼") : "⇅"}
    </span>
  );
}

function exportCsv(rows: RelatorioRow[]) {
  const headers = [
    "Campanha", "Chave", "Cliente", "Moeda", "Investimento", "Leads", "Leads c/ msg",
    "CPL Real", "Agendados", "Taxa Ag.", "Compareceram", "Taxa Comp.", "Fechados",
    "Taxa Fech.", "Faturamento", "Ticket Medio", "ROAS"
  ];

  const escape = (v: string | number | null) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const fmtCents = (c: number) => (c / 100).toFixed(2);
  const fmtPct = (v: number) => `${v}%`;

  const lines = rows.map((r) => [
    escape(r.campaign_name || ""),
    escape(r.campaign_key),
    escape(r.client_slug),
    escape(r.currency),
    fmtCents(r.investment_cents),
    r.leads,
    r.leads_com_mensagem,
    fmtCents(r.cpl_cents),
    r.agendados,
    fmtPct(r.taxa_agendamento),
    r.compareceram,
    fmtPct(r.taxa_comparecimento),
    r.fechados,
    fmtPct(r.taxa_conversao),
    fmtCents(r.faturamento_cents),
    fmtCents(r.ticket_medio_cents),
    r.roas.toFixed(2)
  ].join(","));

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-campanhas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RelatorioTable({ rows, isAgencyAdmin }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("faturamento_cents");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortKey, sortAsc]);

  function th(label: string, key: SortKey, title?: string) {
    return (
      <th
        key={key}
        onClick={() => handleSort(key)}
        title={title}
        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
      >
        {label}
        <SortIcon active={sortKey === key} asc={sortAsc} />
      </th>
    );
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Detalhamento por campanha</h2>
        {rows.length > 0 && (
          <button
            className="dashboard-button dashboard-button--ghost"
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            onClick={() => exportCsv(rows)}
          >
            Exportar CSV
          </button>
        )}
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              {th("Campanha", "campaign_name")}
              {th("Investimento", "investment_cents")}
              {th("Leads", "leads")}
              <th title="Leads que enviaram mensagem no WhatsApp" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("leads_com_mensagem")}>
                Leads msg. <SortIcon active={sortKey === "leads_com_mensagem"} asc={sortAsc} />
              </th>
              <th title="Custo por lead que enviou mensagem" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("cpl_cents")}>
                CPL real <SortIcon active={sortKey === "cpl_cents"} asc={sortAsc} />
              </th>
              {th("Agendados", "agendados")}
              {th("Taxa ag.", "taxa_agendamento")}
              {th("Compareceram", "compareceram")}
              {th("Taxa comp.", "taxa_comparecimento")}
              {th("Fechados", "fechados")}
              {th("Taxa fech.", "taxa_conversao")}
              {th("Faturamento", "faturamento_cents")}
              {th("Ticket medio", "ticket_medio_cents")}
              {th("ROAS", "roas")}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ textAlign: "center", opacity: 0.5 }}>
                  Nenhum dado encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const cur = (row.currency || "BRL") as Currency;
                return (
                  <tr key={`${row.client_slug}-${row.campaign_key}`}>
                    <td>
                      <strong>{row.campaign_name || row.campaign_key || "Sem campanha"}</strong>
                      {row.campaign_name && row.campaign_key !== row.campaign_name ? (
                        <div className="dashboard-table__sub">{row.campaign_key}</div>
                      ) : null}
                      {isAgencyAdmin ? (
                        <div className="dashboard-table__sub">{row.client_slug}</div>
                      ) : null}
                      {cur !== "BRL" ? (
                        <div className="dashboard-table__sub">{cur}</div>
                      ) : null}
                    </td>
                    <td>{formatCurrencyFromCents(row.investment_cents, cur)}</td>
                    <td>{row.leads}</td>
                    <td>{row.leads_com_mensagem}</td>
                    <td>{formatCurrencyFromCents(row.cpl_cents, cur)}</td>
                    <td>{row.agendados}</td>
                    <td>{formatPercent(row.taxa_agendamento)}</td>
                    <td>{row.compareceram}</td>
                    <td>{formatPercent(row.taxa_comparecimento)}</td>
                    <td>{row.fechados}</td>
                    <td>{formatPercent(row.taxa_conversao)}</td>
                    <td>{formatCurrencyFromCents(row.faturamento_cents, cur)}</td>
                    <td>{formatCurrencyFromCents(row.ticket_medio_cents, cur)}</td>
                    <td>{row.roas.toFixed(2)}x</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

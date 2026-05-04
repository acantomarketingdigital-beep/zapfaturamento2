"use client";

import { useState } from "react";
import { EXPORTABLE_STATUSES } from "@/lib/export-shared";

type StatusGroup = "all_leads" | "all" | "agendados" | "fechados";

const STATUS_GROUPS: Array<{
  value: StatusGroup;
  label: string;
  desc: string;
  statuses: string;
}> = [
  {
    value: "all_leads",
    label: "Todos os leads",
    desc: "Inclui todos os leads cadastrados no Kanban/CRM, independente do status. Use para remarketing, exclusoes ou publicos amplos.",
    statuses: "all_leads"
  },
  {
    value: "all",
    label: "Todos os leads qualificados",
    desc: "Inclui agendados, compareceu, negociacao, pago e finalizado.",
    statuses: [...EXPORTABLE_STATUSES].join(",")
  },
  {
    value: "agendados",
    label: "Apenas agendados",
    desc: "Leads que marcaram atendimento ou consulta.",
    statuses: "agendado"
  },
  {
    value: "fechados",
    label: "Apenas fechados",
    desc: "Leads que viraram clientes ou vendas.",
    statuses: "pago,finalizado"
  }
];

type ExportFormProps = {
  clients: Array<{ value: string; label: string }>;
  isAgencyAdmin: boolean;
  defaultClientSlug: string;
};

export function ExportForm({ clients, isAgencyAdmin, defaultClientSlug }: ExportFormProps) {
  const [clientSlug, setClientSlug] = useState(defaultClientSlug);
  const [statusGroup, setStatusGroup] = useState<StatusGroup>("all_leads");
  const [period, setPeriod] = useState("all");

  function buildDownloadUrl(): string {
    const params = new URLSearchParams();
    if (clientSlug) params.set("clientSlug", clientSlug);
    const group = STATUS_GROUPS.find((g) => g.value === statusGroup);
    params.set("statuses", group?.statuses ?? "all_leads");
    if (period !== "all") params.set("period", period);
    return `/api/export/leads?${params.toString()}`;
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Configurar exportacao</h2>
      </div>

      <div className="dashboard-form-stack">
        {isAgencyAdmin && clients.length > 0 ? (
          <div className="dashboard-field">
            <span>Cliente</span>
            <select value={clientSlug} onChange={(e) => setClientSlug(e.target.value)}>
              <option value="">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="dashboard-field">
          <span>Periodo</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Todo o historico</option>
            <option value="today">Hoje</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="90d">Ultimos 90 dias</option>
          </select>
        </div>

        <div className="dashboard-field">
          <span>Tipo de lista</span>
          <div className="selection-card-group">
            {STATUS_GROUPS.map((group) => (
              <label
                key={group.value}
                className={`selection-card${statusGroup === group.value ? " selection-card--active" : ""}`}
              >
                <input
                  type="radio"
                  name="statusGroup"
                  value={group.value}
                  checked={statusGroup === group.value}
                  onChange={() => setStatusGroup(group.value)}
                />
                <div>
                  <div className="selection-card__title">{group.label}</div>
                  <div className="selection-card__desc">{group.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <a
            href={buildDownloadUrl()}
            className="export-action-button"
            download
            style={{ width: "fit-content" }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Gerar lista para Meta Ads
          </a>
          <p className="export-action-sub">
            Compativel com Publicos Personalizados e Semelhantes (Lookalike). Duplicados sao removidos automaticamente.
          </p>
        </div>
      </div>
    </article>
  );
}

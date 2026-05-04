import type { LeadEventRecord } from "@/lib/leads";
import { buildWhatsAppWebUrl } from "@/lib/export-shared";

type LeadTableProps = {
  rows: LeadEventRecord[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function KommoBadge({ row }: { row: LeadEventRecord }) {
  if (row.kommo_status === "success") {
    return (
      <span className="dashboard-pill dashboard-pill--success">
        Enviado #{row.kommo_lead_id ?? "-"}
      </span>
    );
  }

  if (row.kommo_status === "disabled") {
    return <span className="dashboard-pill dashboard-pill--crm">Sem CRM</span>;
  }

  if (row.kommo_status === "error") {
    return (
      <span className="dashboard-pill dashboard-pill--error" title={row.kommo_error || ""}>
        Erro
      </span>
    );
  }

  return <span className="dashboard-pill dashboard-pill--pending">Pendente</span>;
}

function CapiBadge({ row }: { row: LeadEventRecord }) {
  if (row.meta_capi_success === true) {
    return <span className="dashboard-pill dashboard-pill--success">CAPI OK</span>;
  }
  if (row.meta_capi_success === false) {
    return (
      <span className="dashboard-pill dashboard-pill--error" title={row.meta_capi_error || ""}>
        CAPI Erro
      </span>
    );
  }
  return null;
}

function LeadFlags({ row }: { row: LeadEventRecord }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {row.is_test && (
        <span className="dashboard-pill dashboard-pill--test">Teste</span>
      )}
      {row.duplicate && (
        <span className="dashboard-pill dashboard-pill--duplicate">Duplicado</span>
      )}
    </div>
  );
}

export function LeadTable({ rows }: LeadTableProps) {
  if (!rows.length) {
    return (
      <article className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Leads detalhados</h2>
        </div>
        <div className="dashboard-empty">Nenhum lead encontrado para os filtros atuais.</div>
      </article>
    );
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Leads detalhados</h2>
      </div>
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Cliente</th>
              <th>Origem</th>
              <th>Campanha</th>
              <th>Criativo</th>
              <th>Publico</th>
              <th>WhatsApp do lead</th>
              <th>Kommo / CRM</th>
              <th>CAPI</th>
              <th>Flags</th>
              <th>Pagina</th>
              <th>Posicionamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.is_test ? "dashboard-table__row--test" : ""}>
                <td>{formatDateTime(row.created_at)}</td>
                <td>
                  <strong>{row.client_name}</strong>
                  <div className="dashboard-table__sub">{row.client_slug}</div>
                </td>
                <td>{row.source_platform}</td>
                <td>
                  <div>{row.utm_campaign || "-"}</div>
                  <div className="dashboard-table__sub">
                    {row.utm_source || "-"} / {row.utm_medium || "-"}
                  </div>
                </td>
                <td>{row.utm_content || "-"}</td>
                <td>{row.utm_term || "-"}</td>
                <td>
                  {(row.lead_phone || row.whatsapp_number) ? (
                    <a
                      href={buildWhatsAppWebUrl(row.lead_phone || row.whatsapp_number)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#15803D", textDecoration: "none", whiteSpace: "nowrap" }}
                      title="Abrir no WhatsApp Web"
                    >
                      {row.lead_phone || row.whatsapp_number}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <KommoBadge row={row} />
                  <div className="dashboard-table__sub">
                    {row.kommo_enabled ? "CRM habilitado" : "CRM desativado"}
                  </div>
                </td>
                <td>
                  <CapiBadge row={row} />
                </td>
                <td>
                  <LeadFlags row={row} />
                </td>
                <td>
                  <a href={row.page_url} target="_blank" rel="noreferrer">
                    {row.page_path}
                  </a>
                  <div className="dashboard-table__sub">{row.referrer || "Direto"}</div>
                </td>
                <td>{row.placement || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

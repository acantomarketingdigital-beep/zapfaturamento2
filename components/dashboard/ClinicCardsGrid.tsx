import { CustomerLogo } from "@/components/CustomerLogo";
import type { ManagedClinicListItem } from "@/lib/clinics";

type ClinicCardsGridProps = {
  clinics: ManagedClinicListItem[];
  redirectTo: string;
  databaseReady: boolean;
  canManage: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sem leads ainda";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function ClientLogo({
  clinic
}: {
  clinic: Pick<ManagedClinicListItem, "clientName" | "logoUrl">;
}) {
  return (
    <CustomerLogo
      logoUrl={clinic.logoUrl}
      clientName={clinic.clientName}
      imageClassName="dashboard-clinic-card__logo"
      placeholderClassName="dashboard-clinic-card__logo dashboard-clinic-card__logo--placeholder"
    />
  );
}

export function ClinicCardsGrid({
  clinics,
  redirectTo,
  databaseReady,
  canManage
}: ClinicCardsGridProps) {
  if (!clinics.length) {
    return (
      <article className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Clientes</h2>
        </div>
        <div className="dashboard-empty">
          Nenhum cliente encontrado para os filtros atuais.
        </div>
      </article>
    );
  }

  return (
    <section className="dashboard-clinic-grid">
      {clinics.map((clinic) => {
        const detailsHref = `/dashboard/clinicas/${encodeURIComponent(clinic.clientSlug)}`;

        return (
          <article key={clinic.clientSlug} className="dashboard-card dashboard-clinic-card">
            <div className="dashboard-clinic-card__top">
              <ClientLogo clinic={clinic} />
              <div className="dashboard-clinic-card__identity">
                <h3>{clinic.clientName}</h3>
                <p>/{clinic.clientSlug}</p>
                <div className="dashboard-inline-actions">
                  <span
                    className={`dashboard-pill ${
                      clinic.isActive
                        ? "dashboard-pill--success"
                        : "dashboard-pill--error"
                    }`}
                  >
                    {clinic.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <span className="dashboard-pill dashboard-pill--crm">
                    {clinic.kommoEnabled ? "Kommo ativo" : "Sem CRM"}
                  </span>
                  <span className="dashboard-pill dashboard-pill--meta">
                    {clinic.metaCapiConfigured ? "CAPI ativa" : "CAPI off"}
                  </span>
                </div>
              </div>
            </div>

            <div className="dashboard-summary-list dashboard-summary-list--metrics">
              <div>
                <span>WhatsApp</span>
                <strong>{clinic.whatsappNumber}</strong>
              </div>
              <div>
                <span>Total de leads</span>
                <strong>{clinic.totalLeads}</strong>
              </div>
              <div>
                <span>Leads hoje</span>
                <strong>{clinic.leadsToday}</strong>
              </div>
              <div>
                <span>Ultimo lead</span>
                <strong>{formatDateTime(clinic.lastLeadAt)}</strong>
              </div>
            </div>

            <div className="dashboard-inline-actions">
              <a href={detailsHref} className="dashboard-button">
                Ver detalhes
              </a>
              {canManage ? (
                <a
                  href={`${detailsHref}?novaCampanha=1`}
                  className="dashboard-button dashboard-button--ghost"
                >
                  Criar campanha
                </a>
              ) : null}
              {canManage ? (
                <a
                  href={`${detailsHref}/editar`}
                  className="dashboard-button dashboard-button--ghost"
                >
                  Editar
                </a>
              ) : null}
              <a
                href={`/dashboard?client=${encodeURIComponent(clinic.clientSlug)}`}
                className="dashboard-button dashboard-button--ghost"
              >
                Ver dashboard
              </a>
            </div>

            {canManage ? (
              <div className="dashboard-inline-actions">
                <form action="/dashboard/clinicas/toggle" method="post">
                  <input type="hidden" name="slug" value={clinic.clientSlug} />
                  <input
                    type="hidden"
                    name="nextStatus"
                    value={clinic.isActive ? "inactive" : "active"}
                  />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <button
                    type="submit"
                    className="dashboard-button dashboard-button--ghost"
                    disabled={!databaseReady}
                  >
                    {clinic.isActive ? "Desativar" : "Ativar"}
                  </button>
                </form>

                {clinic.source === "database" ? (
                  <form action="/dashboard/clinicas/delete" method="post">
                    <input type="hidden" name="slug" value={clinic.clientSlug} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <button
                      type="submit"
                      className="dashboard-button dashboard-button--ghost"
                      disabled={!databaseReady}
                    >
                      Remover
                    </button>
                  </form>
                ) : (
                  <span className="dashboard-table__sub">
                    Fallback de arquivo ativo.
                  </span>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

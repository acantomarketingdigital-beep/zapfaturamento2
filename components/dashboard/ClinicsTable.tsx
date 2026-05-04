import type { ManagedClinicRecord } from "@/lib/clinics";

type ClinicsTableProps = {
  clinics: ManagedClinicRecord[];
  databaseReady: boolean;
};

export function ClinicsTable({
  clinics,
  databaseReady
}: ClinicsTableProps) {
  if (!clinics.length) {
    return (
      <article className="dashboard-card">
        <div className="dashboard-card__header">
          <h2>Clinicas cadastradas</h2>
        </div>
        <div className="dashboard-empty">
          Nenhuma clinica cadastrada ainda.
        </div>
      </article>
    );
  }

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Clinicas cadastradas</h2>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Clinica</th>
              <th>Status</th>
              <th>WhatsApp</th>
              <th>Integracoes</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((clinic) => {
              return (
                <tr key={clinic.clientSlug}>
                  <td>
                    <strong>{clinic.clientName}</strong>
                    <div className="dashboard-table__sub">/{clinic.clientSlug}</div>
                    <div className="dashboard-table__sub">
                      Fonte: {clinic.source === "database" ? "Banco" : "Arquivo"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`dashboard-pill ${
                        clinic.isActive
                          ? "dashboard-pill--success"
                          : "dashboard-pill--error"
                      }`}
                    >
                      {clinic.isActive ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <strong>{clinic.whatsappNumber || "-"}</strong>
                  </td>
                  <td>
                    <div className="dashboard-table__sub">
                      Pixel: {clinic.metaPixelId || "-"}
                    </div>
                    <div className="dashboard-table__sub">GTM: {clinic.gtmId || "-"}</div>
                    <div className="dashboard-table__sub">GA4: {clinic.ga4Id || "-"}</div>
                  </td>
                  <td>
                    <div className="dashboard-inline-actions dashboard-inline-actions--stack">
                      <a
                        href={`/dashboard/clinicas?edit=${encodeURIComponent(
                          clinic.clientSlug
                        )}`}
                        className="dashboard-button dashboard-button--ghost"
                      >
                        Editar
                      </a>

                      <form action="/dashboard/clinicas/toggle" method="post">
                        <input type="hidden" name="slug" value={clinic.clientSlug} />
                        <input
                          type="hidden"
                          name="nextStatus"
                          value={clinic.isActive ? "inactive" : "active"}
                        />
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
                          Remocao definitiva so para registros do banco.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

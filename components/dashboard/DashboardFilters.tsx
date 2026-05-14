import type { DashboardFilters, FilterOptions } from "@/lib/leads";

type DashboardFiltersProps = {
  filters: DashboardFilters;
  options: FilterOptions;
};

export function DashboardFiltersPanel({
  filters,
  options
}: DashboardFiltersProps) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>Filtros</h2>
      </div>
      <form className="dashboard-filters-grid" method="get">
        <label className="dashboard-field">
          <span>Busca</span>
          <input
            type="text"
            name="q"
            placeholder="Clinica, slug, WhatsApp, campanha, criativo ou publico"
            defaultValue={filters.query}
          />
        </label>

        <label className="dashboard-field">
          <span>Periodo</span>
          <select name="period" defaultValue={filters.period}>
            <option value="all">Todo o periodo</option>
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="90d">Ultimos 90 dias</option>
          </select>
        </label>

        <label className="dashboard-field">
          <span>Cliente</span>
          <select name="client" defaultValue={filters.clientSlug}>
            <option value="">Todas</option>
            {options.clients.map((client) => (
              <option key={client.value} value={client.value}>
                {client.label}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-field">
          <span>Origem</span>
          <select name="origin" defaultValue={filters.origin}>
            <option value="">Todas</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Outro">Outro</option>
          </select>
        </label>

        <label className="dashboard-field">
          <span>Campanha</span>
          <select name="campaign" defaultValue={filters.campaign}>
            <option value="">Todas</option>
            {options.campaigns.map((campaign) => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-field">
          <span>Criativo</span>
          <select name="creative" defaultValue={filters.creative}>
            <option value="">Todos</option>
            {options.creatives.map((creative) => (
              <option key={creative} value={creative}>
                {creative}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-field">
          <span>Publico / conjunto</span>
          <select name="audience" defaultValue={filters.audience}>
            <option value="">Todos</option>
            {options.audiences.map((audience) => (
              <option key={audience} value={audience}>
                {audience}
              </option>
            ))}
          </select>
        </label>

        <label className="dashboard-field">
          <span>Status Kommo</span>
          <select name="kommo" defaultValue={filters.kommoStatus}>
            <option value="all">Todos</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="pending">Pendente</option>
            <option value="disabled">Desativado / Sem CRM</option>
          </select>
        </label>

        <label className="dashboard-field">
          <span>Tipo de lead</span>
          <select name="lead_type" defaultValue={filters.leadType}>
            <option value="all">Todos os cliques</option>
            <option value="whatsapp">Iniciaram conversa no WhatsApp</option>
            <option value="real">Apenas reais (sem teste)</option>
            <option value="test">Apenas teste</option>
          </select>
        </label>

        <div className="dashboard-actions">
          <button type="submit" className="dashboard-button">
            Aplicar filtros
          </button>
          <a href="/dashboard" className="dashboard-button dashboard-button--ghost">
            Limpar
          </a>
        </div>
      </form>
    </article>
  );
}

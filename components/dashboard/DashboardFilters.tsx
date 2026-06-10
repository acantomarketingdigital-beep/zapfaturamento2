import type { DashboardFilters, FilterOptions } from "@/lib/leads";

type DashboardFiltersProps = {
  filters: DashboardFilters;
  options: FilterOptions;
};

const input =
  "w-full h-9 rounded-lg border border-slate-800 bg-[#050505] px-3 text-sm text-gray-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 appearance-none transition-colors";

const label = "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1 block";

export function DashboardFiltersPanel({ filters, options }: DashboardFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0a0a0a] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
        Filtros
      </p>
      <form
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
        method="get"
      >
        <label className="flex flex-col">
          <span className={label}>Busca</span>
          <input
            type="text"
            name="q"
            placeholder="Clínica, campanha, criativo..."
            defaultValue={filters.query}
            className={input}
          />
        </label>

        <label className="flex flex-col">
          <span className={label}>Período</span>
          <select name="period" defaultValue={filters.period} className={input}>
            <option value="all">Todo o período</option>
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Cliente</span>
          <select name="client" defaultValue={filters.clientSlug} className={input}>
            <option value="">Todos</option>
            {options.clients.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Origem</span>
          <select name="origin" defaultValue={filters.origin} className={input}>
            <option value="">Todas</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Outro">Outro</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Campanha</span>
          <select name="campaign" defaultValue={filters.campaign} className={input}>
            <option value="">Todas</option>
            {options.campaigns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Criativo</span>
          <select name="creative" defaultValue={filters.creative} className={input}>
            <option value="">Todos</option>
            {options.creatives.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Público / conjunto</span>
          <select name="audience" defaultValue={filters.audience} className={input}>
            <option value="">Todos</option>
            {options.audiences.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Status Kommo</span>
          <select name="kommo" defaultValue={filters.kommoStatus} className={input}>
            <option value="all">Todos</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
            <option value="pending">Pendente</option>
            <option value="disabled">Desativado / Sem CRM</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className={label}>Tipo de lead</span>
          <select name="lead_type" defaultValue={filters.leadType} className={input}>
            <option value="all">Todos os cliques</option>
            <option value="whatsapp">Iniciaram WhatsApp</option>
            <option value="real">Apenas reais</option>
            <option value="test">Apenas teste</option>
          </select>
        </label>

        <div className="flex flex-col justify-end gap-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold px-4 py-2 hover:bg-cyan-400/15 transition-colors"
          >
            Aplicar
          </button>
          <a
            href="/dashboard"
            className="w-full text-center rounded-lg border border-slate-800 text-slate-500 text-sm font-medium px-4 py-2 hover:text-slate-300 hover:border-slate-700 transition-colors"
          >
            Limpar
          </a>
        </div>
      </form>
    </div>
  );
}

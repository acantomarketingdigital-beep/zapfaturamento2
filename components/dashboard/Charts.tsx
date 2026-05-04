import type { ChartDatum } from "@/lib/leads";

type ChartCardProps = {
  title: string;
  data: ChartDatum[];
  mode?: "horizontal" | "vertical";
};

function EmptyChart() {
  return <div className="dashboard-empty">Sem dados para este filtro.</div>;
}

function HorizontalChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="dashboard-bars">
      {data.map((item) => (
        <div key={item.label} className="dashboard-bars__row">
          <div className="dashboard-bars__meta">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="dashboard-bars__track">
            <div
              className="dashboard-bars__fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VerticalChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="dashboard-columns">
      {data.map((item) => (
        <div key={item.label} className="dashboard-columns__item">
          <div className="dashboard-columns__value">{item.value}</div>
          <div className="dashboard-columns__track">
            <div
              className="dashboard-columns__fill"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="dashboard-columns__label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({
  title,
  data,
  mode = "horizontal"
}: ChartCardProps) {
  return (
    <article className="dashboard-card">
      <div className="dashboard-card__header">
        <h2>{title}</h2>
      </div>
      {data.length ? (
        mode === "vertical" ? (
          <VerticalChart data={data} />
        ) : (
          <HorizontalChart data={data} />
        )
      ) : (
        <EmptyChart />
      )}
    </article>
  );
}

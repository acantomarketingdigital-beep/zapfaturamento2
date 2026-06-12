import type { ChartDatum } from "@/lib/leads";

type ChartCardProps = {
  title: string;
  data: ChartDatum[];
  mode?: "horizontal" | "vertical";
};

function EmptyChart() {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-sm text-slate-600">Sem dados para este filtro.</p>
    </div>
  );
}

function HorizontalChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400 truncate max-w-[70%]">{item.label}</span>
            <strong className="text-xs font-semibold text-slate-300 tabular-nums">{item.value}</strong>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
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
    <div className="flex items-end gap-1.5 h-32">
      {data.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-[10px] text-slate-500 tabular-nums">{item.value}</span>
          <div className="w-full rounded-t bg-slate-800/80 flex-1 relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t bg-gradient-to-t from-cyan-400 to-blue-500"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-600 truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({ title, data, mode = "horizontal" }: ChartCardProps) {
  return (
    <article className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{title}</h2>
        <span className="text-[10px] font-semibold text-slate-600 tabular-nums">
          {data.reduce((s, d) => s + d.value, 0)} total
        </span>
      </div>
      {data.length ? (
        mode === "vertical" ? <VerticalChart data={data} /> : <HorizontalChart data={data} />
      ) : (
        <EmptyChart />
      )}
    </article>
  );
}

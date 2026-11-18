// Peças comuns dos gráficos (SVG feito à mão, sem biblioteca).
// Cores validadas para o fundo escuro #0f172a (contraste ≥ 3:1 e separação para daltonismo).
import { useState, type ReactNode } from 'react';
import { Table2, BarChart3 } from 'lucide-react';

export const C = {
  br: '#3987e5', // Brasil
  py: '#d95926', // Paraguai
  income: '#199e70', // entradas
  expense: '#9085e9', // saídas
  profit: '#c98500', // lucro
  grid: '#1e293b',
  axis: '#334155',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  surface: '#0f172a',
};

export interface Series {
  name: string;
  color: string;
  values: number[];
}

/** Marcas "redondas" do eixo Y. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) max = min + 1;
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export function Legend({ series }: { series: { name: string; color: string }[] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.textSecondary }}>
      {series.map((s) => (
        <span key={s.name} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ background: s.color, height: 3 }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function Tooltip({ x, y, title, rows, width }: { x: number; y: number; title: string; rows: { name: string; color: string; value: string }[]; width: number }) {
  const left = Math.min(Math.max(x + 12, 0), width - 190);
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ left, top: Math.max(0, y), background: '#020617', borderColor: '#334155', minWidth: 160 }}
      role="status"
    >
      <div className="mb-1" style={{ color: C.textSecondary }}>{title}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2 py-0.5">
          <span className="inline-block w-3 rounded" style={{ background: r.color, height: 2 }} />
          <strong className="num" style={{ color: C.textPrimary }}>{r.value}</strong>
          <span style={{ color: C.textSecondary }}>{r.name}</span>
        </div>
      ))}
    </div>
  );
}

/** Moldura: título, legenda e botão para ver os números em tabela. */
export function ChartCard({
  title,
  subtitle,
  series,
  labels,
  format,
  children,
  extra,
}: {
  title: string;
  subtitle?: string;
  series: Series[];
  labels: string[];
  format: (v: number) => string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  const [table, setTable] = useState(false);
  return (
    <section className="card p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <button
            onClick={() => setTable((t) => !t)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            title={table ? 'Ver gráfico' : 'Ver tabela'}
            aria-label={table ? 'Ver gráfico' : 'Ver tabela'}
          >
            {table ? <BarChart3 size={16} /> : <Table2 size={16} />}
          </button>
        </div>
      </div>
      {table ? (
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="py-1.5 pr-3 font-medium">Período</th>
                {series.map((s) => (
                  <th key={s.name} className="py-1.5 pr-3 font-medium text-right">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((l, i) => (
                <tr key={l} className="border-t border-slate-800">
                  <td className="py-1.5 pr-3 text-slate-300">{l}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-1.5 pr-3 text-right num text-slate-200">{format(s.values[i] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="mb-2"><Legend series={series} /></div>
          {children}
        </>
      )}
    </section>
  );
}

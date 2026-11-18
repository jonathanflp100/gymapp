import { useEffect, useRef, useState } from 'react';
import { C, niceTicks, Tooltip, type Series } from './chartKit';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const PAD = { top: 10, right: 12, bottom: 26, left: 64 };

/** Mostra um rótulo a cada "every" e sempre o último, sem deixar dois encostados. */
function showLabel(i: number, n: number, every: number) {
  const last = n - 1;
  if (i === last) return true;
  if (i % every !== 0) return false;
  return last - i >= Math.max(1, every * 0.75);
}

function Axes({ ticks, y, w, h, labels, x, fmt, every }: { ticks: number[]; y: (v: number) => number; w: number; h: number; labels: string[]; x: (i: number) => number; fmt: (v: number) => string; every: number }) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? C.axis : C.grid} strokeWidth={1} />
          <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={C.textMuted} className="num">
            {fmt(t)}
          </text>
        </g>
      ))}
      {labels.map((l, i) =>
        showLabel(i, labels.length, every) ? (
          <text key={l} x={x(i)} y={h - 6} textAnchor="middle" fontSize={11} fill={C.textMuted}>
            {l}
          </text>
        ) : null,
      )}
    </g>
  );
}

/** Linhas com régua vertical: passe o mouse para ver todos os valores daquele mês. */
export function LineChart({ labels, series, format, axisFormat, height = 240 }: { labels: string[]; series: Series[]; format: (v: number) => string; axisFormat?: (v: number) => string; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const h = height;
  const all = series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.min(0, ...all), Math.max(1, ...all));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const innerW = w - PAD.left - PAD.right - 70; // espaço para o nome no fim da linha
  const x = (i: number) => PAD.left + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (h - PAD.top - PAD.bottom);
  const every = Math.ceil(labels.length / Math.max(2, Math.floor(innerW / 60)));

  // nomes no fim das linhas, sem encavalar
  const ends = series
    .map((s) => ({ name: s.name, color: s.color, y: y(s.values[s.values.length - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round((px / (r.width || 1)) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative select-none overflow-hidden" style={{ minHeight: h }}>
      {w > 0 && <svg width={w} height={h} role="img" aria-label={series.map((s) => s.name).join(', ')}>
        <Axes ticks={ticks} y={y} w={w - 70} h={h} labels={labels} x={x} fmt={axisFormat ?? format} every={every} />
        {series.map((s) => (
          <path
            key={s.name}
            d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.length <= 4 &&
          ends.map((e) => (
            <text key={e.name} x={x(labels.length - 1) + 8} y={e.y} dy="0.32em" fontSize={11} fill={C.textSecondary}>
              {e.name}
            </text>
          ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={h - PAD.bottom} stroke={C.textMuted} strokeWidth={1} />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill={s.color} stroke={C.surface} strokeWidth={2} />
            ))}
          </g>
        )}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={h - PAD.top - PAD.bottom}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>}
      {w > 0 && hover !== null && (
        <Tooltip
          x={x(hover)}
          y={PAD.top}
          width={w}
          title={labels[hover]}
          rows={series.map((s) => ({ name: s.name, color: s.color, value: format(s.values[hover] ?? 0) }))}
        />
      )}
    </div>
  );
}

/** Barras agrupadas (aceita negativos). Cada barra é o alvo do mouse. */
export function BarChart({ labels, series, format, axisFormat, height = 240 }: { labels: string[]; series: Series[]; format: (v: number) => string; axisFormat?: (v: number) => string; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const h = height;
  const all = series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.min(0, ...all), Math.max(1, ...all));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const innerW = w - PAD.left - PAD.right;
  const band = innerW / Math.max(1, labels.length);
  const groupW = Math.min(band * 0.72, 18 * series.length + 2 * (series.length - 1));
  const gap = 2;
  const barW = Math.max(3, (groupW - gap * (series.length - 1)) / series.length);
  const xc = (i: number) => PAD.left + band * (i + 0.5);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * (h - PAD.top - PAD.bottom);
  const every = Math.ceil(labels.length / Math.max(2, Math.floor(innerW / 60)));
  const r = Math.min(4, barW / 2);

  // retângulo com só a ponta (lado oposto ao zero) arredondada
  const bar = (x0: number, v: number) => {
    const y0 = y(0);
    const y1 = y(v);
    const hgt = Math.abs(y1 - y0);
    if (hgt < 0.5) return '';
    const rr = Math.min(r, hgt);
    if (v >= 0)
      return `M${x0},${y0}V${y1 + rr}Q${x0},${y1} ${x0 + rr},${y1}H${x0 + barW - rr}Q${x0 + barW},${y1} ${x0 + barW},${y1 + rr}V${y0}Z`;
    return `M${x0},${y0}V${y1 - rr}Q${x0},${y1} ${x0 + rr},${y1}H${x0 + barW - rr}Q${x0 + barW},${y1} ${x0 + barW},${y1 - rr}V${y0}Z`;
  };

  return (
    <div ref={ref} className="relative select-none overflow-hidden" style={{ minHeight: h }}>
      {w > 0 && <svg width={w} height={h} role="img" aria-label={series.map((s) => s.name).join(', ')}>
        <Axes ticks={ticks} y={y} w={w} h={h} labels={labels} x={xc} fmt={axisFormat ?? format} every={every} />
        {labels.map((l, i) => {
          const start = xc(i) - groupW / 2;
          return (
            <g key={l} opacity={hover === null || hover === i ? 1 : 0.55}>
              {series.map((s, k) => (
                <path key={s.name} d={bar(start + k * (barW + gap), s.values[i] ?? 0)} fill={s.color} />
              ))}
              <rect
                x={xc(i) - band / 2}
                y={PAD.top}
                width={band}
                height={h - PAD.top - PAD.bottom}
                fill="transparent"
                tabIndex={0}
                aria-label={`${l}: ${series.map((s) => `${s.name} ${format(s.values[i] ?? 0)}`).join(', ')}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>}
      {w > 0 && hover !== null && (
        <Tooltip
          x={xc(hover)}
          y={PAD.top}
          width={w}
          title={labels[hover]}
          rows={series.map((s) => ({ name: s.name, color: s.color, value: format(s.values[hover] ?? 0) }))}
        />
      )}
    </div>
  );
}

/** Barras horizontais simples (categorias). */
export function HBars({ rows, color, format }: { rows: { label: string; value: number }[]; color: string; format: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${format(r.value)}`}>
          <span className="text-slate-300 truncate">{r.label}</span>
          <div className="h-3 rounded-r" style={{ width: `${Math.max(1, (r.value / max) * 100)}%`, background: color, borderRadius: '0 4px 4px 0' }} />
          <span className="num text-slate-200 text-right">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

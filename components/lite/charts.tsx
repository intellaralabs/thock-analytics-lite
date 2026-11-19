"use client";

/*
 * Dependency-free charts drawn in SVG at the container's real pixel width, so text stays crisp
 * on every screen. Colours come from the tactile tokens, so they follow light and dark mode.
 * Hover (or focus and use the arrow keys) to read exact values.
 */

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Series = { label: string; color: string; values: number[]; area?: boolean; dashed?: boolean };

/** Measures an element's width and keeps it up to date. */
function useWidth<T extends HTMLElement>(initial = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A round axis maximum: 1, 2, 2.5 or 5 times a power of ten. */
export function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = [1, 2, 2.5, 5, 10].find((s) => s * p >= v) ?? 10;
  return m * p;
}

/** Which label indexes to print so they never overlap. */
function labelStep(count: number, width: number, minGap = 64) {
  return Math.max(1, Math.ceil(count / Math.max(1, Math.floor(width / minGap))));
}

/** Pointer + keyboard index tracking shared by the charts. */
function useActive(count: number, left: number, slot: number) {
  const [active, setActive] = useState<number | null>(null);
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - box.left - left) / slot);
    setActive(i >= 0 && i < count ? i : null);
  };
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((a) => {
        const base = a ?? (e.key === "ArrowRight" ? -1 : count);
        return Math.min(count - 1, Math.max(0, base + (e.key === "ArrowRight" ? 1 : -1)));
      });
    }
    if (e.key === "Escape") setActive(null);
  };
  return {
    active,
    handlers: { onPointerMove, onPointerLeave: () => setActive(null), onKeyDown, onBlur: () => setActive(null), tabIndex: 0 },
  };
}

function Tooltip({ x, width, title, rows }: { x: number; width: number; title: ReactNode; rows: { label: string; color: string; value: ReactNode }[] }) {
  const flip = x > width - 170;
  return (
    <div
      role="status"
      className="tactile-surface pointer-events-none absolute top-1 z-10 grid min-w-36 gap-1 rounded-xl px-3 py-2 text-xs shadow-lg"
      style={flip ? { right: width - x + 10 } : { left: x + 10 }}
    >
      <span className="font-semibold text-fg">{title}</span>
      {rows.map((r) => (
        <span key={r.label} className="flex items-center gap-2 text-subtle">
          <span aria-hidden className="size-2 flex-none rounded-sm" style={{ background: r.color }} />
          {r.label}
          <span className="ml-auto pl-3 font-mono font-semibold tabular-nums text-fg">{r.value}</span>
        </span>
      ))}
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; color: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle", className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Lines (optionally filled) over time. */
export function TrendChart({
  series,
  labels,
  height = 240,
  format = (v) => String(v),
  axisFormat,
  label,
}: {
  series: Series[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
  axisFormat?: (v: number) => string;
  /** Accessible summary. */
  label: string;
}) {
  const gid = useId();
  const [ref, W] = useWidth<HTMLDivElement>();
  const n = labels.length;
  const pad = { l: 44, r: 12, t: 12, b: 26 };
  const plotW = W - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
  const x = (i: number) => pad.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => pad.t + plotH - (v / max) * plotH;
  const slot = plotW / Math.max(1, n - 1);
  const { active, handlers } = useActive(n, pad.l - slot / 2, slot);
  const step = labelStep(n, plotW);
  const axis = axisFormat ?? format;

  return (
    <div ref={ref} className="relative w-full min-w-0" style={{ height }}>
      <svg width={W} height={height} role="img" aria-label={label} className="absolute inset-0 block touch-pan-y rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-(--tactile-focus)" {...handlers}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`${gid}-${si}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * t)} y2={y(max * t)} stroke="var(--tactile-line)" strokeDasharray={t ? "3 4" : undefined} />
            <text x={pad.l - 8} y={y(max * t) + 3.5} textAnchor="end" fontSize="11" fill="var(--tactile-muted)">
              {axis(max * t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % step === 0 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : "middle"} fontSize="11" fill="var(--tactile-muted)">
              {l}
            </text>
          ) : null,
        )}
        {series.map((s, si) => {
          const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          return (
            <g key={s.label}>
              {s.area && <path d={`${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${gid}-${si})`} />}
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "5 5" : undefined} />
            </g>
          );
        })}
        {active != null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + plotH} stroke="var(--tactile-fg)" strokeOpacity="0.25" />
            {series.map((s) => (
              <circle key={s.label} cx={x(active)} cy={y(s.values[active])} r={4} fill={s.color} stroke="var(--tactile-bg)" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {active != null && (
        <Tooltip x={x(active)} width={W} title={labels[active]} rows={series.map((s) => ({ label: s.label, color: s.color, value: format(s.values[active]) }))} />
      )}
    </div>
  );
}

/** Stacked bars. Negative values stack downwards (e.g. churned MRR). An optional line rides on top. */
export function BarChart({
  series,
  labels,
  height = 240,
  format = (v) => String(v),
  axisFormat,
  line,
  label,
}: {
  series: Series[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
  axisFormat?: (v: number) => string;
  line?: Series;
  label: string;
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const n = labels.length;
  const pad = { l: 48, r: 12, t: 12, b: 26 };
  const plotW = W - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const ups = labels.map((_, i) => series.reduce((s, x) => s + Math.max(0, x.values[i]), 0));
  const downs = labels.map((_, i) => series.reduce((s, x) => s + Math.min(0, x.values[i]), 0));
  const top = niceMax(Math.max(...ups, ...(line?.values ?? [0]), 0));
  const bottom = Math.min(...downs) < 0 ? -niceMax(-Math.min(...downs)) : 0;
  const span = top - bottom;
  const y = (v: number) => pad.t + ((top - v) / span) * plotH;
  const slot = plotW / n;
  const bar = Math.min(36, slot * 0.62);
  const cx = (i: number) => pad.l + i * slot + slot / 2;
  const { active, handlers } = useActive(n, pad.l, slot);
  const step = labelStep(n, plotW, 44);
  const ticks = bottom < 0 ? [bottom, bottom / 2, 0, top / 2, top] : [0, top / 4, top / 2, (top * 3) / 4, top];
  const axis = axisFormat ?? format;

  return (
    <div ref={ref} className="relative w-full min-w-0" style={{ height }}>
      <svg width={W} height={height} role="img" aria-label={label} className="absolute inset-0 block touch-pan-y rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-(--tactile-focus)" {...handlers}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--tactile-line)" strokeDasharray={t ? "3 4" : undefined} />
            <text x={pad.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize="11" fill="var(--tactile-muted)">
              {axis(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) => {
          let up = 0;
          let down = 0;
          return (
            <g key={i} opacity={active == null || active === i ? 1 : 0.55}>
              {series.map((s) => {
                const v = s.values[i];
                if (!v) return null;
                const from = v > 0 ? up : down;
                const to = from + v;
                if (v > 0) up = to;
                else down = to;
                const y1 = y(Math.max(from, to));
                const h = Math.max(1, Math.abs(y(from) - y(to)));
                return <rect key={s.label} x={cx(i) - bar / 2} y={y1} width={bar} height={h} rx={3} fill={s.color} />;
              })}
              {i % step === 0 && (
                <text x={cx(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--tactile-muted)">
                  {l}
                </text>
              )}
            </g>
          );
        })}
        {line && (
          <g>
            <path
              d={line.values.map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
            />
            {line.values.map((v, i) => (
              <circle key={i} cx={cx(i)} cy={y(v)} r={active === i ? 4.5 : 3} fill={line.color} stroke="var(--tactile-bg)" strokeWidth={1.5} />
            ))}
          </g>
        )}
      </svg>
      {active != null && (
        <Tooltip
          x={cx(active)}
          width={W}
          title={labels[active]}
          rows={[...series, ...(line ? [line] : [])].map((s) => ({ label: s.label, color: s.color, value: format(s.values[active]) }))}
        />
      )}
    </div>
  );
}

/** A ring split into shares, with a readout in the middle. */
export function Donut({
  items,
  size = 168,
  center,
  label,
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
  center?: ReactNode;
  label: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const shares = items.map((i) => (i.value / total) * c);
  const offsets = shares.map((_, k) => shares.slice(0, k).reduce((a, b) => a + b, 0));
  return (
    <div className="tactile-well relative grid flex-none place-items-center rounded-full" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={label} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--tactile-led-off)" strokeWidth={14} />
        {items.map((it, k) =>
          it.value > 0 ? (
            <circle
              key={it.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth={14}
              strokeDasharray={`${Math.max(0, shares[k] - 2)} ${c}`}
              strokeDashoffset={-offsets[k]}
            >
              <title>{`${it.label}: ${Math.round((it.value / total) * 100)}%`}</title>
            </circle>
          ) : null,
        )}
      </svg>
      {center && <div className="relative grid justify-items-center text-center">{center}</div>}
    </div>
  );
}

/** Horizontal share bars with a value column. */
export function ShareBars({
  items,
  format = (v) => String(v),
  color = "var(--tactile-accent)",
  labelWidth = "8rem",
}: {
  items: { label: ReactNode; value: number; hint?: ReactNode; color?: string }[];
  format?: (v: number) => ReactNode;
  color?: string;
  labelWidth?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0.0001);
  return (
    <ul className="grid gap-3">
      {items.map((i, k) => (
        <li key={k} className="grid items-center gap-3 text-sm" style={{ gridTemplateColumns: `minmax(0, ${labelWidth}) 1fr auto` }}>
          <span className="truncate text-subtle">{i.label}</span>
          <span className="tactile-well h-2.5 overflow-hidden rounded-full p-px">
            <span className="block h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: i.color ?? color }} />
          </span>
          <span className="text-right font-mono text-xs tabular-nums text-fg">
            {format(i.value)}
            {i.hint && <span className="ml-2 text-subtle">{i.hint}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Retention cohorts: one row per signup month, one cell per month since. */
export function CohortHeatmap({ rows }: { rows: { cohort: string; size: number; retention: number[] }[] }) {
  const months = Math.max(...rows.map((r) => r.retention.length));
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[560px] border-separate border-spacing-1 text-xs">
        <caption className="sr-only">Share of each monthly signup cohort still active, by month since signup</caption>
        <thead>
          <tr>
            <th scope="col" className="px-2 pb-1 text-left font-semibold text-subtle">Cohort</th>
            <th scope="col" className="px-2 pb-1 text-right font-semibold text-subtle">Users</th>
            {Array.from({ length: months }, (_, i) => (
              <th key={i} scope="col" className="pb-1 text-center font-semibold text-subtle">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cohort}>
              <th scope="row" className="whitespace-nowrap px-2 text-left font-medium text-fg">
                {r.cohort}
              </th>
              <td className="px-2 text-right font-mono tabular-nums text-subtle">{r.size}</td>
              {Array.from({ length: months }, (_, i) => {
                const v = r.retention[i];
                if (v == null) return <td key={i} className="tactile-well h-9 rounded-md opacity-40" />;
                const strength = i === 0 ? 1 : Math.min(1, v / 70);
                return (
                  <td
                    key={i}
                    className="h-9 rounded-md text-center font-mono font-semibold tabular-nums"
                    style={{
                      background: `color-mix(in oklab, var(--tactile-accent) ${Math.round(12 + strength * 78)}%, var(--tactile-well))`,
                      color: strength > 0.45 ? "var(--tactile-accent-fg)" : "var(--tactile-fg)",
                    }}
                  >
                    {v}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Funnel steps as bars, with conversion and drop-off between them. */
export function FunnelChart({ steps, format = (v) => String(v) }: { steps: { name: string; users: number; medianTime?: string }[]; format?: (v: number) => string }) {
  const first = steps[0]?.users || 1;
  return (
    <ol className="grid gap-3">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].users : s.users;
        const fromStart = (s.users / first) * 100;
        const step = (s.users / (prev || 1)) * 100;
        return (
          <li key={s.name} className="grid gap-2">
            {i > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-10 text-xs text-subtle">
                <span className="font-mono tabular-nums text-fg">{step.toFixed(1)}%</span> continued
                <span className="font-mono tabular-nums" style={{ color: "var(--tactile-accent)" }}>
                  −{format(prev - s.users)}
                </span>
                dropped off
                {s.medianTime && <span>· median {s.medianTime}</span>}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="tactile-key pointer-events-none grid size-7 flex-none place-items-center rounded-lg font-mono text-xs">{i + 1}</span>
              <div className="grid min-w-0 flex-1 gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-fg">{s.name}</span>
                  <span className="flex-none font-mono tabular-nums text-fg">
                    {format(s.users)} <span className="text-subtle">· {fromStart.toFixed(1)}%</span>
                  </span>
                </div>
                <div className="tactile-well h-7 overflow-hidden rounded-lg p-0.5">
                  <div
                    className="h-full rounded-md transition-[width] duration-500"
                    style={{
                      width: `${Math.max(1.5, fromStart)}%`,
                      background: "linear-gradient(to right, var(--tactile-accent-from), var(--tactile-accent))",
                      boxShadow: "0 0 10px var(--tactile-accent-glow)",
                    }}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

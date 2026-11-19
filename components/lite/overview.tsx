"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CircleDollarSign, Eye, Percent, UserPlus } from "lucide-react";
import { addDays, iso, sources, today, workspace } from "@/data/analytics";
import { proScreens } from "@/data/pro-screens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAnalytics } from "@/components/lite/analytics-provider";
import { Legend, ShareBars, TrendChart } from "@/components/lite/charts";
import { PageHeader } from "@/components/lite/page-header";
import { ProBadge } from "@/components/lite/pro-badge";
import { ProShot } from "@/components/lite/pro-shot";
import { change, compact, moneyCompact, num, pct, shortDate, slice, sum } from "@/lib/format";
import { proUrl, showProPreviews } from "@/lib/links";

/** A KPI tile: label, value, change vs the previous period and a tiny trend line. */
function Kpi({ label, value, delta, icon, data, color = "var(--tactile-accent)" }: { label: string; value: string; delta: number; icon: ReactNode; data: number[]; color?: string }) {
  const min = Math.min(...data);
  const span = Math.max(...data) - min || 1;
  const points = data.map((v, i) => `${((i / (data.length - 1)) * 100).toFixed(2)},${(30 - ((v - min) / span) * 26 - 2).toFixed(2)}`).join(" ");
  const good = delta >= 0;
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</span>
        <span className="tactile-key pointer-events-none grid size-8 place-items-center rounded-lg [&_svg]:size-4">{icon}</span>
      </div>
      <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-fg">{value}</span>
      <span className="flex items-center gap-2 text-xs">
        <span className="tactile-well rounded-md px-2 py-1 font-mono font-semibold tabular-nums" style={{ color: good ? "var(--tactile-success)" : "var(--tactile-accent)" }}>
          {good ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
        <span className="text-subtle">vs previous period</span>
      </span>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-9 w-full" role="img" aria-label={`${label} trend`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </Card>
  );
}

export function Overview() {
  const { days, setDays } = useAnalytics();
  const { current, previous } = slice(iso(addDays(today, -days + 1)), iso(today));
  const total = (rows: typeof current, k: "visitors" | "signups" | "revenue") => sum(rows.map((r) => r[k]));
  const visitors = total(current, "visitors");
  const signups = total(current, "signups");
  const conv = (signups / visitors) * 100;
  const prevConv = (total(previous, "signups") / total(previous, "visitors")) * 100;

  return (
    <>
      <PageHeader title="Overview" description={`${workspace.product} · last ${days} days`}>
        <ToggleGroup type="single" value={String(days)} onValueChange={(v) => v && setDays(Number(v))} aria-label="Period">
          {[7, 30, 90].map((d) => (
            <ToggleGroupItem key={d} value={String(d)} className="h-9 px-3 text-sm" led>
              {d}D
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Visitors" value={compact(visitors)} delta={change(visitors, total(previous, "visitors"))} icon={<Eye />} data={current.map((r) => r.visitors)} />
        <Kpi label="Signups" value={num(signups)} delta={change(signups, total(previous, "signups"))} icon={<UserPlus />} data={current.map((r) => r.signups)} />
        <Kpi
          label="Revenue"
          value={moneyCompact(total(current, "revenue"))}
          delta={change(total(current, "revenue"), total(previous, "revenue"))}
          icon={<CircleDollarSign />}
          data={current.map((r) => r.revenue)}
          color="var(--tactile-success)"
        />
        <Kpi label="Conversion" value={pct(conv, 2)} delta={Math.round((conv - prevConv) * 100) / 100} icon={<Percent />} data={current.map((r) => r.signups / r.visitors)} color="var(--tactile-warning)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Visitors</CardTitle>
            <Legend
              items={[
                { label: "This period", color: "var(--tactile-accent)" },
                { label: "Previous period", color: "var(--tactile-muted)" },
              ]}
            />
          </CardHeader>
          <CardContent>
            <TrendChart
              label={`Visitors per day, ${num(visitors)} in the last ${days} days`}
              labels={current.map((r) => shortDate(r.date))}
              series={[
                { label: "This period", color: "var(--tactile-accent)", values: current.map((r) => r.visitors), area: true },
                ...(previous.length === current.length ? [{ label: "Previous", color: "var(--tactile-muted)", values: previous.map((r) => r.visitors), dashed: true }] : []),
              ]}
              format={num}
              axisFormat={compact}
              height={280}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareBars labelWidth="7rem" items={sources.map((s) => ({ label: s.label, value: s.visitors, hint: pct(s.conversion) }))} format={compact} />
            <p className="mt-4 text-xs text-subtle">Visitors · signup conversion</p>
          </CardContent>
        </Card>
      </div>

      {showProPreviews && (
        <section aria-labelledby="pro" className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="pro" className="flex items-center gap-2 text-sm font-semibold text-fg">
                In the full template <ProBadge />
              </h2>
              <p className="mt-1 text-sm text-subtle">Revenue and cohorts, funnels, live events and more, built from the same components.</p>
            </div>
            <a href={proUrl} className="text-sm text-subtle underline-offset-4 hover:text-fg hover:underline">
              See the full template
            </a>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {proScreens.map(({ slug, name, icon: Icon }) => (
              <Link
                key={slug}
                href={`/pro/${slug}`}
                className="tactile-tray group grid w-56 flex-none snap-start gap-2 rounded-2xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-(--tactile-focus) sm:w-auto"
              >
                <span className="overflow-hidden rounded-xl">
                  <ProShot slug={slug} alt="" sizes="(min-width: 640px) 33vw, 224px" className="transition-transform duration-300 group-hover:scale-105" />
                </span>
                <span className="flex items-center gap-2 px-1.5 pb-1 text-sm font-medium text-fg [&_svg]:size-4">
                  <Icon aria-hidden /> {name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

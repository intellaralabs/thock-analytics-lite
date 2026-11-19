"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Lock, UserX, X } from "lucide-react";
import { planIds, planNames, statusLabels, type Customer, type CustomerStatus, type PlanId } from "@/data/analytics";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalytics } from "@/components/lite/analytics-provider";
import { PageHeader } from "@/components/lite/page-header";
import { ProBadge } from "@/components/lite/pro-badge";
import { formatDate, initials, lastSeen, money } from "@/lib/format";
import { proUrl, showProPreviews } from "@/lib/links";
import { cn } from "@/lib/utils";

const PER_PAGE = 10;
type SortKey = "company" | "mrr" | "signedUp";
type Sort = { key: SortKey; dir: "asc" | "desc" };
const tone: Record<CustomerStatus, "success" | "warning" | "error" | "neutral"> = { active: "success", trial: "neutral", past_due: "warning", churned: "error" };

function downloadCsv(rows: Customer[]) {
  const head = "id,company,contact,email,plan,status,mrr,signed_up";
  const body = rows.map((c) => [c.id, c.company, c.contact, c.email, c.plan, c.status, c.mrr, c.signedUp].join(","));
  const url = URL.createObjectURL(new Blob([[head, ...body].join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "customers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function SortHead({ k, sort, onSort, children, className }: { k: SortKey; sort: Sort; onSort: (k: SortKey) => void; children: string; className?: string }) {
  const on = sort.key === k;
  const Icon = !on ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("h-10 px-3 text-left", className)}>
      <button type="button" onClick={() => onSort(k)} className="-mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 uppercase outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-(--tactile-focus)">
        {children}
        <Icon className={on ? "size-3 text-fg" : "size-3 opacity-50"} aria-hidden />
      </button>
    </th>
  );
}

export function CustomersScreen() {
  const { customers, updateCustomers } = useAnalytics();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CustomerStatus>("all");
  const [plan, setPlan] = useState<"all" | PlanId>("all");
  const [sort, setSort] = useState<Sort>({ key: "mrr", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();
  const filtered = customers
    .filter((c) => (status === "all" || c.status === status) && (plan === "all" || c.plan === plan) && (!q || `${c.company} ${c.contact} ${c.email}`.toLowerCase().includes(q)))
    .sort((a, b) => {
      const cmp = sort.key === "mrr" ? a.mrr - b.mrr : String(a[sort.key]).localeCompare(String(b[sort.key]));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const ids = rows.map((r) => r.id);
  const onPage = ids.filter((id) => selected.has(id)).length;
  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "company" ? "asc" : "desc" }));
  const reset = () => setPage(1);

  return (
    <>
      <PageHeader title="Customers" description={`${customers.length} accounts · ${customers.filter((c) => c.mrr > 0).length} paying`}>
        <Button size="sm" onClick={() => downloadCsv(filtered)}>
          <Download /> Export CSV
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={query} onValueChange={(v) => (setQuery(v), reset())} placeholder="Search company, contact or email…" aria-label="Search customers" className="md:max-w-80" />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={status} onValueChange={(v) => (setStatus(v as typeof status), reset())}>
            <SelectTrigger aria-label="Status" className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(statusLabels) as CustomerStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={plan} onValueChange={(v) => (setPlan(v as typeof plan), reset())}>
            <SelectTrigger aria-label="Plan" className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {planIds.map((p) => (
                <SelectItem key={p} value={p}>
                  {planNames[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-subtle md:ml-auto" aria-live="polite">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {selected.size > 0 && (
        <div role="region" aria-label="Bulk actions" className="tactile-tray flex flex-wrap items-center gap-2 rounded-2xl p-2 pl-4">
          <span className="mr-auto flex items-center gap-2 text-sm font-medium text-fg">
            <span className="tactile-led size-1.5" data-on /> {selected.size} selected
          </span>
          <Button size="sm" onClick={() => downloadCsv(customers.filter((c) => selected.has(c.id)))}>
            <Download /> Export
          </Button>
          <Button size="sm" onClick={() => (updateCustomers([...selected], { status: "churned", mrr: 0 }), setSelected(new Set()))}>
            <UserX /> Mark churned
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
            <X />
          </Button>
        </div>
      )}

      <div className="tactile-tray relative w-full overflow-x-auto rounded-3xl p-2">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Customers</caption>
          <thead className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
            <tr>
              <th scope="col" className="h-10 w-10 px-3 text-left">
                <Checkbox
                  aria-label="Select all on this page"
                  checked={onPage === 0 ? false : onPage === ids.length ? true : "indeterminate"}
                  onCheckedChange={(on) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      ids.forEach((id) => (on === true ? next.add(id) : next.delete(id)));
                      return next;
                    })
                  }
                />
              </th>
              <SortHead k="company" sort={sort} onSort={onSort}>Company</SortHead>
              <th scope="col" className="h-10 px-3 text-left">Plan</th>
              <th scope="col" className="h-10 px-3 text-left">Status</th>
              <SortHead k="mrr" sort={sort} onSort={onSort} className="text-right">MRR</SortHead>
              <SortHead k="signedUp" sort={sort} onSort={onSort} className="hidden lg:table-cell">Signed up</SortHead>
              <th scope="col" className="hidden h-10 px-3 text-left md:table-cell">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const on = selected.has(c.id);
              return (
                <tr key={c.id} className={cn("[&>td]:px-3 [&>td]:py-3 [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl hover:[&>td]:bg-surface/50", on && "[&>td]:bg-well")}>
                  <td>
                    <Checkbox
                      aria-label={`Select ${c.company}`}
                      checked={on}
                      onCheckedChange={(v) =>
                        setSelected((s) => {
                          const next = new Set(s);
                          if (v === true) next.add(c.id);
                          else next.delete(c.id);
                          return next;
                        })
                      }
                    />
                  </td>
                  <td>
                    <div className="flex min-w-48 items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(c.company)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{c.company}</p>
                        <p className="truncate text-xs text-subtle">{c.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={c.plan === "enterprise" ? "accent" : "key"}>{planNames[c.plan]}</Badge>
                  </td>
                  <td>
                    <Badge variant="well" status={tone[c.status]}>
                      {statusLabels[c.status]}
                    </Badge>
                  </td>
                  <td className="text-right font-mono tabular-nums text-fg">{c.mrr ? money(c.mrr) : <span className="text-subtle">—</span>}</td>
                  <td className="hidden whitespace-nowrap text-subtle lg:table-cell">{formatDate(c.signedUp)}</td>
                  <td className="hidden whitespace-nowrap text-subtle md:table-cell">{lastSeen(c.lastSeenDays)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <div className="grid justify-items-center gap-3 px-6 py-12 text-center">
            <p className="font-semibold text-fg">No customers match</p>
            <Button size="sm" onClick={() => (setQuery(""), setStatus("all"), setPlan("all"), reset())}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-sm text-subtle sm:flex-row">
        <span>
          {filtered.length ? `Showing ${(current - 1) * PER_PAGE + 1}–${Math.min(current * PER_PAGE, filtered.length)} of ${filtered.length}` : "No results"}
        </span>
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <Button size="icon-sm" aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            <ChevronLeft />
          </Button>
          <span className="tactile-well rounded-lg px-3 py-1.5 font-mono text-xs tabular-nums text-fg" aria-live="polite">
            {current} / {pages}
          </span>
          <Button size="icon-sm" aria-label="Next page" disabled={current >= pages} onClick={() => setPage(current + 1)}>
            <ChevronRight />
          </Button>
        </nav>
      </div>

      {showProPreviews && (
        <a href={proUrl} className="tactile-well flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm text-subtle outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-(--tactile-focus)">
          <Lock className="size-4 flex-none" aria-hidden />
          <span className="flex-1">Customer detail pages, health scores, bulk plan changes and a quick-view panel are in the full template.</span>
          <ProBadge />
        </a>
      )}
    </>
  );
}

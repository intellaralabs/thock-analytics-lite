# Analytics Lite: free SaaS analytics dashboard

A free, MIT-licensed SaaS analytics dashboard built with **[Thock UI](https://thock-ui.vercel.app)**, the tactile React
component library by Intellara Labs. It has three screens, light and dark themes, and works on phones.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI, lucide-react, next-themes.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Screens

| Route | What it shows |
| --- | --- |
| `/` | KPI cards (visitors, signups, revenue, conversion) with trend lines and change vs the previous period, a 7/30/90-day visitors chart against the previous period, and top traffic sources |
| `/customers` | 64 customers with search, status and plan filters, sortable columns, paging, row selection, bulk "mark churned" and CSV export |
| `/settings` | Profile, light/dark/system theme and notification switches |

## Project structure

```
app/                  layout.tsx (theme + state + shell) and one page per screen
components/ui/        Thock UI components (free, MIT; yours to edit)
components/lite/      app parts: shell, state provider, SVG charts, screens
data/analytics.ts     demo data and the types the UI expects
lib/format.ts         number, money, percent and date formatting
lib/links.ts          Pro links and previews; set showProPreviews = false to remove them all
```

The demo data uses a seeded random generator and a fixed "today", so the server and the browser render the same
numbers.

## Connecting real data

All state lives in `components/lite/analytics-provider.tsx`. Screens only call `useAnalytics()`
(`customers`, `days`, `setDays`, `updateCustomers`, `removeCustomers`). To use your own data:

1. Replace `daily` and `sources` in `data/analytics.ts` with rows from your warehouse or analytics API, keeping the
   `DayMetrics` shape (one row per day).
2. Load customers from your billing system or database instead of the generated `customers` list.
3. In the provider, send `updateCustomers` / `removeCustomers` to your API as well as to the reducer.

The charts in `components/lite/charts.tsx` are plain SVG with no chart library, so you can restyle or replace them
freely.

## Building your own product on this?

The "More screens" menu, the `/pro/*` preview pages, the overview teaser, the "Get Pro" button and the footer
are all switched off by one line in `lib/links.ts`:

```ts
export const showProPreviews = false;
```

You can then also delete `app/pro`, `data/pro-screens.ts`, `components/lite/pro-*.tsx` and `public/pro`.

## Want more?

The **full Analytics template** has 13 screens:

- revenue: MRR movements, plan mix and a retention cohort heatmap
- customer detail pages with health scores, invoices and an activity timeline
- conversion funnels with segment comparison
- a live event stream with pause and filters
- a report builder with saved reports
- team roles and invites, billing and usage, API keys and integrations
- a ⌘K command menu and sign-in screens

It's built with the Pro components (stat cards, sparklines, data tables, sheets, toasts, date pickers and more):
[thock-ui.vercel.app/templates/analytics](https://thock-ui.vercel.app/templates/analytics).

## Licence

MIT. See [LICENSE](LICENSE).

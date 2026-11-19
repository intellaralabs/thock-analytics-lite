import { Activity, CreditCard, FileBarChart, Filter, TrendingUp, UsersRound, type LucideIcon } from "lucide-react";

/** Screens that are only in the full template. Screenshots live in public/pro/<slug>-{dark,light}.jpg. */
export type ProScreen = { slug: string; name: string; icon: LucideIcon; summary: string; points: string[] };

export const proScreens: ProScreen[] = [
  {
    slug: "revenue",
    name: "Revenue",
    icon: TrendingUp,
    summary: "MRR, churn and retention, and what moved them.",
    points: ["MRR, ARR, net revenue retention and churn", "New, expansion, contraction and churned MRR by month", "MRR by plan with a donut and table", "Cohort retention heatmap"],
  },
  {
    slug: "funnels",
    name: "Funnels",
    icon: Filter,
    summary: "See where people drop off between the steps that matter.",
    points: ["Step conversion and drop-off", "Median time between steps", "Desktop, mobile and paid-search segments", "Biggest drop-off and weekly trend"],
  },
  {
    slug: "events",
    name: "Live events",
    icon: Activity,
    summary: "Product events as they happen.",
    points: ["Streaming event feed you can pause and filter", "Active users right now", "Events per 10 seconds", "Top events with trends"],
  },
  {
    slug: "reports",
    name: "Reports",
    icon: FileBarChart,
    summary: "Build a view once, save it, have it emailed.",
    points: ["Pick metrics from a searchable list", "Break down by any property", "Line, bar or table preview", "Email schedule with a date picker"],
  },
  {
    slug: "team",
    name: "Team",
    icon: UsersRound,
    summary: "People, roles and what each role can do.",
    points: ["Invite by email with a role", "Change roles inline, remove with confirmation", "Seats and two-factor status", "Permission matrix"],
  },
  {
    slug: "billing",
    name: "Billing",
    icon: CreditCard,
    summary: "Plan, usage and invoices for your workspace.",
    points: ["Change or cancel the plan", "Event quota gauge and usage meters", "Invoices you can download", "Payment method via your provider's portal"],
  },
];

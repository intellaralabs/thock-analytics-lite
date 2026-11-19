/*
 * Demo data for the Oak Dial workspace. Everything is generated from a fixed seed so the
 * server and the browser render the same numbers. Replace these exports with your API; the
 * types describe the shape the screens expect.
 */

// ---------------------------------------------------------------- helpers

/** Small seeded PRNG (mulberry32), so demo numbers never change between renders. */
export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
/** The demo's "today". Fixed so the data reads the same on every visit. */
export const today = new Date(2026, 10, 16);
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);

// ---------------------------------------------------------------- workspace

export const workspace = { name: "Oak Dial", product: "Oak Dial Cloud", domain: "oakdial.example" };
export const me = { name: "Sam Carter", email: "sam@oakdial.example", initials: "SC", role: "Owner" };

// ---------------------------------------------------------------- plans

export type PlanId = "free" | "starter" | "growth" | "enterprise";
export const planIds: PlanId[] = ["free", "starter", "growth", "enterprise"];
export const planNames: Record<PlanId, string> = { free: "Free", starter: "Starter", growth: "Growth", enterprise: "Enterprise" };
/** Chart colour for each plan (tactile tokens, so they follow the theme). */
export const planColors: Record<PlanId, string> = {
  free: "var(--tactile-led-off)",
  starter: "var(--tactile-muted)",
  growth: "var(--tactile-warning)",
  enterprise: "var(--tactile-accent)",
};


// ---------------------------------------------------------------- customers

export type CustomerStatus = "active" | "trial" | "past_due" | "churned";
export const statusLabels: Record<CustomerStatus, string> = { active: "Active", trial: "Trial", past_due: "Past due", churned: "Churned" };

export type Customer = {
  id: string;
  company: string;
  contact: string;
  email: string;
  plan: PlanId;
  status: CustomerStatus;
  /** Monthly recurring revenue, USD. */
  mrr: number;
  seats: number;
  country: string;
  /** ISO date. */
  signedUp: string;
  lastSeenDays: number;
  /** 0–100 account health score. */
  health: number;
  events30d: number;
  /** Weekly active users, last 12 weeks. */
  usage: number[];
};

const prefixes = [
  "Bluefin", "Cobalt", "Driftwood", "Ember", "Fernhill", "Granite", "Harbor", "Ironleaf",
  "Juniper", "Kestrel", "Lumen", "Meadow", "Brightwater", "Oakridge", "Pinecone", "Quillby",
  "Redwood", "Saltmarsh", "Tidewater", "Umberly", "Larkspur", "Willow", "Yellowtail", "Zephyr",
  "Alder", "Birchway", "Cedarline", "Dunmore", "Elmstead", "Flintlock", "Glacier", "Heronsgate",
];
const suffixes = ["Labs", "Logistics", "Studio", "Health", "Foods", "Systems", "Finance", "Media"];
const firstNames = ["Sam", "Alex", "Jordan", "Taylor", "Casey", "Riley", "Jamie", "Morgan", "Avery", "Quinn", "Drew", "Rowan", "Parker", "Skyler", "Reese", "Emerson"];
const lastNames = ["Carter", "Morgan", "Lee", "Reed", "Brooks", "Hayes", "Patel", "Diaz", "Kim", "Foster", "Ellis", "Shah", "Nguyen", "Grant", "Collins", "Price"];
const countries = ["United States", "United Kingdom", "Germany", "Canada", "France", "Netherlands", "Australia", "Spain", "Sweden", "Japan"];
const seatPrice: Record<PlanId, number> = { free: 0, starter: 29, growth: 110, enterprise: 1200 };

export const customers: Customer[] = (() => {
  const r = rng(7);
  return Array.from({ length: 64 }, (_, i) => {
    const company = `${prefixes[i % prefixes.length]} ${suffixes[(i * 3 + Math.floor(i / prefixes.length)) % suffixes.length]}`;
    const first = firstNames[Math.floor(r() * firstNames.length)];
    const last = lastNames[Math.floor(r() * lastNames.length)];
    const p = r();
    const plan: PlanId = p < 0.18 ? "free" : p < 0.55 ? "starter" : p < 0.88 ? "growth" : "enterprise";
    const s = r();
    const status: CustomerStatus = plan === "free" ? (s < 0.3 ? "trial" : s < 0.85 ? "active" : "churned") : s < 0.72 ? "active" : s < 0.84 ? "trial" : s < 0.93 ? "past_due" : "churned";
    const seats = plan === "enterprise" ? 40 + Math.floor(r() * 160) : plan === "growth" ? 5 + Math.floor(r() * 30) : plan === "starter" ? 1 + Math.floor(r() * 9) : 1 + Math.floor(r() * 3);
    const mrr = status === "churned" || status === "trial" ? 0 : plan === "enterprise" ? seatPrice.enterprise + seats * 18 : seats * seatPrice[plan];
    const health = status === "churned" ? 8 + Math.floor(r() * 15) : status === "past_due" ? 30 + Math.floor(r() * 25) : 55 + Math.floor(r() * 45);
    const base = Math.max(2, Math.round(seats * (0.5 + r() * 0.5)));
    const trend = status === "churned" ? -0.12 : status === "past_due" ? -0.04 : 0.03;
    const usage = Array.from({ length: 12 }, (_, w) => Math.max(0, Math.round(base * (1 + trend * w) * (0.85 + r() * 0.3))));
    return {
      id: `cus_${(((i + 7) * 2654435761) % 2147483647).toString(36)}`,
      company,
      contact: `${first} ${last}`,
      email: `${first}.${last}@${company.toLowerCase().replace(/[^a-z]+/g, "")}.example`.toLowerCase(),
      plan,
      status,
      mrr,
      seats,
      country: countries[Math.floor(r() * countries.length)],
      signedUp: iso(addDays(today, -Math.floor(20 + r() * 700))),
      lastSeenDays: status === "churned" ? 30 + Math.floor(r() * 90) : Math.floor(r() * r() * 14),
      health,
      events30d: Math.round(seats * (status === "churned" ? 4 : 220) * (0.5 + r())),
      usage,
    };
  });
})();

// ---------------------------------------------------------------- daily metrics

export type DayMetrics = { date: string; visitors: number; signups: number; activations: number; revenue: number; sessions: number };

/** 180 days of site and product metrics, ending today. */
export const daily: DayMetrics[] = (() => {
  const r = rng(42);
  return Array.from({ length: 180 }, (_, i) => {
    const d = addDays(today, i - 179);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.68 : 1;
    const growth = 1 + i * 0.0032;
    const campaign = i > 150 && i < 158 ? 1.35 : 1;
    const visitors = Math.round(5200 * growth * weekend * campaign * (0.9 + r() * 0.2));
    const signups = Math.round(visitors * (0.031 + r() * 0.008));
    return {
      date: iso(d),
      visitors,
      sessions: Math.round(visitors * (1.38 + r() * 0.12)),
      signups,
      activations: Math.round(signups * (0.46 + r() * 0.1)),
      revenue: Math.round(6300 * growth * (dow === 1 ? 1.4 : weekend) * (0.85 + r() * 0.3)),
    };
  });
})();

// ---------------------------------------------------------------- traffic

export const sources = [
  { label: "Organic search", visitors: 48_210, conversion: 3.6 },
  { label: "Direct", visitors: 31_480, conversion: 4.4 },
  { label: "Referral", visitors: 14_920, conversion: 5.1 },
  { label: "Paid search", visitors: 12_300, conversion: 2.7 },
  { label: "Newsletter", visitors: 8_640, conversion: 6.2 },
  { label: "Social", visitors: 6_150, conversion: 1.9 },
];


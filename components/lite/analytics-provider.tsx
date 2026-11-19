"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { customers as initialCustomers, type Customer } from "@/data/analytics";

/*
 * All app state lives here, in memory. To connect a real backend, load customers from your API
 * and send each action to it as well as to the reducer.
 */

type State = { customers: Customer[]; days: number };
type Action =
  | { type: "update"; ids: string[]; patch: Partial<Customer> }
  | { type: "remove"; ids: string[] }
  | { type: "days"; days: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "update": {
      const ids = new Set(action.ids);
      return { ...state, customers: state.customers.map((c) => (ids.has(c.id) ? { ...c, ...action.patch } : c)) };
    }
    case "remove": {
      const ids = new Set(action.ids);
      return { ...state, customers: state.customers.filter((c) => !ids.has(c.id)) };
    }
    case "days":
      return { ...state, days: action.days };
  }
}

type Ctx = State & {
  updateCustomers: (ids: string[], patch: Partial<Customer>) => void;
  removeCustomers: (ids: string[]) => void;
  setDays: (days: number) => void;
};

const AnalyticsCtx = createContext<Ctx | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { customers: initialCustomers, days: 30 });
  const value = useMemo<Ctx>(
    () => ({
      ...state,
      updateCustomers: (ids, patch) => dispatch({ type: "update", ids, patch }),
      removeCustomers: (ids) => dispatch({ type: "remove", ids }),
      setDays: (days) => dispatch({ type: "days", days }),
    }),
    [state],
  );
  return <AnalyticsCtx.Provider value={value}>{children}</AnalyticsCtx.Provider>;
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsCtx);
  if (!ctx) throw new Error("useAnalytics must be used inside <AnalyticsProvider>");
  return ctx;
}

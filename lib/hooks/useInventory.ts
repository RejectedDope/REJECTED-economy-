"use client";

import { useState, useEffect, useReducer } from "react";
import { scoreAll } from "@/lib/scoring";
import type { ScoredItem, InventoryItem } from "@/lib/types";
import { MOCK_ITEMS } from "@/lib/mock-data";

type FetchResult =
  | { authenticated: false }
  | { authenticated: true; items: InventoryItem[] };

async function fetchInventoryClient(): Promise<FetchResult> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { authenticated: false };

    const { fetchUserInventory } = await import("@/app/actions/inventory");
    const result = await fetchUserInventory("active", 500);
    return { authenticated: true, items: result.items ?? [] };
  } catch {
    return { authenticated: false };
  }
}

type State = {
  items: ScoredItem[];
  loading: boolean;
  error: string | null;
  isRealData: boolean;
  isAuthenticated: boolean;
};

type Action =
  | { type: "loaded"; items: ScoredItem[]; isRealData: boolean; isAuthenticated: boolean }
  | { type: "error"; error: string };

function reducer(state: State, action: Action): State {
  if (action.type === "loaded") {
    return { ...state, items: action.items, loading: false, isRealData: action.isRealData, isAuthenticated: action.isAuthenticated, error: null };
  }
  return { ...state, loading: false, error: action.error };
}

export interface UseInventoryState {
  items: ScoredItem[];
  loading: boolean;
  error: string | null;
  isRealData: boolean;
  isAuthenticated: boolean;
  refresh: () => void;
}

export function useInventory(): UseInventoryState {
  const [state, dispatch] = useReducer(reducer, {
    items: scoreAll(MOCK_ITEMS),
    loading: true,
    error: null,
    isRealData: false,
    isAuthenticated: false,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchInventoryClient().then((result) => {
      if (cancelled) return;
      if (!result.authenticated) {
        // Unauthenticated — show demo data
        dispatch({ type: "loaded", items: scoreAll(MOCK_ITEMS), isRealData: false, isAuthenticated: false });
        return;
      }
      // Authenticated — show real data (may be empty)
      dispatch({
        type: "loaded",
        items: result.items.length > 0 ? scoreAll(result.items) : [],
        isRealData: true,
        isAuthenticated: true,
      });
    }).catch((err: unknown) => {
      if (cancelled) return;
      dispatch({ type: "error", error: String(err) });
    });

    return () => { cancelled = true; };
  }, [tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}

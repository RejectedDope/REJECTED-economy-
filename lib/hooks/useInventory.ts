"use client";

import { useState, useEffect, useReducer } from "react";
import { scoreAll } from "@/lib/scoring";
import type { ScoredItem, InventoryItem } from "@/lib/types";
import { MOCK_ITEMS } from "@/lib/mock-data";

async function fetchInventoryClient(): Promise<InventoryItem[]> {
  try {
    const { fetchUserInventory } = await import("@/app/actions/inventory");
    const result = await fetchUserInventory("active", 500);
    if (result.error || result.items.length === 0) return [];
    return result.items;
  } catch {
    return [];
  }
}

type State = {
  items: ScoredItem[];
  loading: boolean;
  error: string | null;
  isRealData: boolean;
};

type Action =
  | { type: "loaded"; items: ScoredItem[]; isRealData: boolean }
  | { type: "error"; error: string };

function reducer(state: State, action: Action): State {
  if (action.type === "loaded") {
    return { ...state, items: action.items, loading: false, isRealData: action.isRealData, error: null };
  }
  return { ...state, loading: false, error: action.error };
}

export interface UseInventoryState {
  items: ScoredItem[];
  loading: boolean;
  error: string | null;
  isRealData: boolean;
  refresh: () => void;
}

export function useInventory(): UseInventoryState {
  const [state, dispatch] = useReducer(reducer, {
    items: scoreAll(MOCK_ITEMS),
    loading: true,
    error: null,
    isRealData: false,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchInventoryClient().then((fetched) => {
      if (cancelled) return;
      dispatch({
        type: "loaded",
        items: fetched.length > 0 ? scoreAll(fetched) : scoreAll(MOCK_ITEMS),
        isRealData: fetched.length > 0,
      });
    }).catch((err: unknown) => {
      if (cancelled) return;
      dispatch({ type: "error", error: String(err) });
    });

    return () => { cancelled = true; };
  }, [tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}

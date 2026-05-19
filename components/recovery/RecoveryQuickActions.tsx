"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Clock, Loader2 } from "lucide-react";
import type { ScoredItem } from "@/lib/types";

interface RecoveryQuickActionsProps {
  item: ScoredItem;
  onDone?: (itemId: string, action: "sold" | "relisted" | "snoozed") => void;
}

export function RecoveryQuickActions({ item, onDone }: RecoveryQuickActionsProps) {
  const [pending, setPending] = useState<"sold" | "relisted" | "snoozed" | null>(null);
  const [done, setDone] = useState<"sold" | "relisted" | "snoozed" | null>(null);

  async function handleAction(action: "sold" | "relisted" | "snoozed") {
    if (pending || done) return;
    setPending(action);
    try {
      const { updateItemStatus } = await import("@/app/actions/inventory");
      const status = action === "sold" ? "sold" : action === "relisted" ? "relisted" : "active";
      const result = await updateItemStatus(item.id, status);
      if (result.ok) {
        setDone(action);
        onDone?.(item.id, action);
      }
    } catch {
      // Silent fail — item remains in list
    } finally {
      setPending(null);
    }
  }

  if (done) {
    const labels = { sold: "Marked Sold", relisted: "Marked Relisted", snoozed: "Snoozed" };
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        {labels[done]}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
      <button
        onClick={() => handleAction("sold")}
        disabled={!!pending}
        title="Mark as sold"
        className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {pending === "sold" ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
        Sold
      </button>
      <button
        onClick={() => handleAction("relisted")}
        disabled={!!pending}
        title="Mark as relisted"
        className="flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
      >
        {pending === "relisted" ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
        Relisted
      </button>
      <button
        onClick={() => handleAction("snoozed")}
        disabled={!!pending}
        title="Snooze for now"
        className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
      >
        {pending === "snoozed" ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Clock className="h-2.5 w-2.5" />}
        Snooze
      </button>
    </div>
  );
}

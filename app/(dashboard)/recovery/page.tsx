"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Zap, Upload } from "lucide-react";
import { useInventory } from "@/lib/hooks/useInventory";
import { buildRecoveryPlan } from "@/lib/scoring";
import { prioritizeRecovery } from "@/lib/inventory/prioritization";
import { ActionCards } from "@/components/recovery/ActionCards";
import { PriorityQueue } from "@/components/recovery/PriorityQueue";
import { RecoveryEffectivenessSummary } from "@/components/recovery/RecoveryEffectivenessSummary";
import { ActionEffectivenessTable } from "@/components/recovery/ActionEffectivenessTable";
import { formatCurrency } from "@/lib/utils";

export default function RecoveryPage() {
  const { items: scored, loading, isAuthenticated, isRealData } = useInventory();
  const plan      = useMemo(() => buildRecoveryPlan(scored), [scored]);
  const priority  = useMemo(() => prioritizeRecovery(scored), [scored]);

  const totalRecoverable = plan.reduce(
    (sum, p) => sum + p.estimated_cash_recovery,
    0
  );
  const immediateActions = plan.filter((p) => p.urgency === "immediate");
  const immediateItems = immediateActions.reduce((s, p) => s + p.items.length, 0);

  const isEmpty = !loading && isAuthenticated && scored.length === 0;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-3.5 w-3.5 text-[#E935C1]" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
            Recovery Center
          </span>
          {!isRealData && !loading && (
            <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Demo
            </span>
          )}
        </div>
        <h1 className="text-2xl font-black text-zinc-100">Recovery Action Center</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isEmpty
            ? "Import your inventory to generate a recovery plan."
            : "Prioritized actions to unlock your trapped cash. Work from top to bottom."}
        </p>
      </div>

      {/* Empty state — authenticated with no inventory */}
      {isEmpty && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E935C1]/30 bg-[#E935C1]/10">
            <Upload className="h-5 w-5 text-[#E935C1]" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-300">No inventory to analyze</p>
            <p className="mt-1 text-xs text-zinc-600">Import your listings to generate a recovery action plan.</p>
          </div>
          <Link
            href="/inventory/import"
            className="rounded-lg bg-[#E935C1] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Import Inventory →
          </Link>
        </div>
      )}

      {/* Main recovery content — hidden when empty */}
      {!isEmpty && <div>
      {/* Summary strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E935C1]/30 bg-[#E935C1]/5 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Total Recoverable
          </p>
          <p className="mt-2 text-2xl font-black text-[#FF2D95]">
            {formatCurrency(totalRecoverable)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">across all actions</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Immediate Actions
          </p>
          <p className="mt-2 text-2xl font-black text-zinc-100">
            {immediateActions.length}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            {immediateItems} listings need attention now
          </p>
        </div>

        <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900 p-5 sm:col-span-1">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Action Categories
          </p>
          <p className="mt-2 text-2xl font-black text-zinc-100">{plan.length}</p>
          <p className="mt-0.5 text-xs text-zinc-600">recovery strategies active</p>
        </div>
      </div>

      {/* Recovery Effectiveness (shows only when real data exists) */}
      <RecoveryEffectivenessSummary />

      {/* Action Effectiveness (shows only when logged actions exist) */}
      <ActionEffectivenessTable />

      {/* Priority Queue — ranked by urgency + ROI */}
      <PriorityQueue items={priority} limit={6} />

      {/* Priority guide */}
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">
          How to Use This
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Actions are sorted by urgency. Work through{" "}
          <span className="text-[#FF2D95] font-semibold">Immediate</span> first, then{" "}
          <span className="text-orange-400 font-semibold">This Week</span>, then{" "}
          <span className="text-zinc-400 font-semibold">This Month</span>. Each card shows the
          reasoning so you understand the why — not just the what.
        </p>
      </div>

      {/* Action cards */}
      <ActionCards plan={plan} />
      </div>}
    </div>
  );
}

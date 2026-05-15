"use client";

import { useMemo } from "react";
import { MOCK_ITEMS } from "@/lib/mock-data";
import { scoreAll, calcDashboardStats } from "@/lib/scoring";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AgingChart } from "@/components/dashboard/AgingChart";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { DeathPileTable } from "@/components/dashboard/DeathPileTable";

export default function DashboardPage() {
  const scored = useMemo(() => scoreAll(MOCK_ITEMS), []);
  const stats = useMemo(() => calcDashboardStats(MOCK_ITEMS), []);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E935C1] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
            Live Inventory
          </span>
        </div>
        <h1 className="text-2xl font-black text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your inventory health at a glance. No sugarcoating.
        </p>
      </div>

      {/* Stats grid */}
      <StatsCards stats={stats} />

      {/* Charts + Insights row */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AgingChart buckets={stats.aging_breakdown} />
        <InsightCards stats={stats} items={scored} />
      </div>

      {/* Death pile table */}
      <div className="mt-6">
        <DeathPileTable items={scored} />
      </div>
    </div>
  );
}

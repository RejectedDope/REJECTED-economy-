"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { PrioritizedItem } from "@/lib/inventory/prioritization";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  relist_now:          "Relist Now",
  sell_similar:        "Sell Similar",
  strategic_markdown:  "Markdown",
  title_rewrite:       "Rewrite Title",
  bundle:              "Bundle",
  move_platform:       "Move Platform",
  optimize_specifics:  "Fix Specifics",
  add_photos:          "Add Photos",
  liquidate:           "Liquidate",
  hold:                "Hold",
};

function urgencyClass(score: number): string {
  if (score >= 60) return "text-[#FF2D95] border-[#FF2D95]/30 bg-[#FF2D95]/10";
  if (score >= 40) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  if (score >= 20) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
  return "text-zinc-500 border-zinc-700 bg-zinc-800";
}

function effortDot(effort: "low" | "medium" | "high"): string {
  if (effort === "low") return "bg-emerald-400";
  if (effort === "medium") return "bg-yellow-400";
  return "bg-orange-400";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PriorityQueueProps {
  items: PrioritizedItem[];
  limit?: number;
}

export function PriorityQueue({ items, limit = 6 }: PriorityQueueProps) {
  if (items.length === 0) return null;

  const displayed = items.slice(0, limit);
  const quickWins = items.filter((i) => i.is_quick_win);

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#E935C1]" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Recovery Priority Queue
          </span>
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
            {items.length} items
          </span>
        </div>
        {quickWins.length > 0 && (
          <span className="rounded-full border border-[#E935C1]/30 bg-[#E935C1]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#E935C1]">
            {quickWins.length} quick win{quickWins.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Queue rows */}
      <div className="divide-y divide-zinc-800/60">
        {displayed.map((prioritized, idx) => {
          const item = prioritized.item;
          const actionLabel = ACTION_LABELS[prioritized.action] ?? prioritized.action;

          return (
            <Link
              key={item.id}
              href={`/inventory/${item.id}`}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-800/50"
            >
              {/* Rank number */}
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-500 group-hover:bg-zinc-700">
                {idx + 1}
              </span>

              {/* Title + reasoning */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-200 max-w-[280px]">
                    {item.title}
                  </p>
                  {prioritized.is_quick_win && (
                    <span className="shrink-0 rounded bg-[#E935C1]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#E935C1]">
                      Quick Win
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                  {prioritized.reasoning}
                </p>
              </div>

              {/* Metrics */}
              <div className="hidden items-center gap-3 sm:flex">
                {/* Urgency score */}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    urgencyClass(prioritized.urgency_score)
                  )}
                >
                  {prioritized.urgency_score}
                </span>

                {/* Action */}
                <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                  {actionLabel}
                </span>

                {/* Effort dot */}
                <div className="flex items-center gap-1">
                  <span className={cn("h-2 w-2 rounded-full", effortDot(prioritized.effort_level))} />
                  <span className="text-[10px] text-zinc-600">{prioritized.effort_level} effort</span>
                </div>

                {/* Recovery estimate */}
                <span className="w-16 text-right text-xs font-bold text-emerald-400">
                  {formatCurrency(prioritized.estimated_recovery)}
                </span>
              </div>

              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-500" />
            </Link>
          );
        })}
      </div>

      {/* Footer: show total if truncated */}
      {items.length > limit && (
        <div className="border-t border-zinc-800 px-5 py-3 text-center">
          <p className="text-xs text-zinc-600">
            Showing {limit} of {items.length} items.{" "}
            <Link href="/inventory" className="text-[#E935C1] hover:underline">
              View all in inventory →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Tag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  DollarSign,
  BarChart2,
} from "lucide-react";
import { MOCK_ITEMS } from "@/lib/mock-data";
import { scoreItem, RISK_COLORS, RISK_BG } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatCurrencyDecimal } from "@/lib/utils";

const ACTION_DETAILS: Record<
  string,
  { label: string; description: string; steps: string[] }
> = {
  relist_now: {
    label: "Relist Now",
    description:
      "End this listing and create a new one. The algorithm clock resets, impressions restart, and you get a fresh shot at the buyer pool. Do not just revise — end and relist.",
    steps: [
      "End the current listing",
      "Update photos if possible (6+ shots)",
      "Fill all item specifics fields",
      "Create new listing with refreshed title",
      "Consider a slight price adjustment (5–10% down)",
    ],
  },
  strategic_markdown: {
    label: "Strategic Markdown",
    description:
      "A targeted price reduction (15–25%) sends eBay watcher notifications and surfaces your listing in 'Recently Lowered' results. It's not surrender — it's a tactic.",
    steps: [
      "Calculate 15–25% below current price",
      "Revise listing price (or end/relist)",
      "Add 'OR BEST OFFER' to capture negotiated sales",
      "Monitor for 14 days before further action",
    ],
  },
  bundle: {
    label: "Bundle It",
    description:
      "Low-priced stale items rarely justify shipping cost alone. Bundle 2–4 complementary pieces into a single higher-value listing. Better margins, better buyer experience, less clutter.",
    steps: [
      "Identify 2–4 related items from your inventory",
      "Set bundle price at ~80% of individual sum",
      "Create new multi-item listing",
      "Highlight bundle value in title",
    ],
  },
  move_platform: {
    label: "Move Platform",
    description:
      "This item's buyer base may live on a different platform. eBay buyers for this category may have moved to Poshmark, Mercari, or Facebook Marketplace. Cross-list or migrate entirely.",
    steps: [
      "Research where comparable items sell fastest",
      "Cross-list on 2–3 platforms",
      "Adjust pricing for platform fees",
      "End the underperforming listing after 30 days",
    ],
  },
  optimize_specifics: {
    label: "Fix Item Specifics",
    description:
      "Missing item specifics is the most fixable problem in your inventory. eBay's Cassini algorithm specifically penalizes incomplete listings in filtered searches. This is a quick win.",
    steps: [
      "Open listing for revision",
      "Fill every available item specifics field",
      "Add brand, condition, size, color, material",
      "Save — no need to relist",
    ],
  },
  add_photos: {
    label: "Add More Photos",
    description:
      "Single-photo listings convert at a fraction of multi-photo listings. Buyers need to see all angles, flaws, tags, measurements. More photos = more trust = more sales.",
    steps: [
      "Photograph all angles (front, back, sides)",
      "Capture close-ups of brand tags, condition issues",
      "Add measurement reference shot",
      "Aim for 8–12 photos minimum",
    ],
  },
  liquidate: {
    label: "Liquidate",
    description:
      "This inventory has been carrying costs too long. The math no longer works for a full-price sale. Price at 20–30 cents on the dollar, move it in lots, or donate for a tax deduction. Clear the shelf.",
    steps: [
      "Price at 20–30% of original ask",
      "Consider lot listing with similar items",
      "Explore local auction or liquidation buyer",
      "Document and donate remaining items for tax deduction",
    ],
  },
  hold: {
    label: "Hold — Monitor",
    description:
      "This listing is within normal performance parameters. No immediate action required — watch sell-through over 30 days and revisit.",
    steps: [
      "Monitor for 30 days",
      "Check if comparable items have sold",
      "Consider a minor price test if no activity",
    ],
  },
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();

  const item = useMemo(() => {
    const found = MOCK_ITEMS.find((i) => i.id === id);
    if (!found) return null;
    return scoreItem(found);
  }, [id]);

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-bold text-zinc-400">Item not found</p>
          <Link href="/inventory" className="mt-4 text-sm text-[#E935C1]">
            ← Back to inventory
          </Link>
        </div>
      </div>
    );
  }

  const actionDetail = ACTION_DETAILS[item.primary_recovery_action];
  const healthColor =
    item.listing_health_score >= 70
      ? "bg-emerald-400"
      : item.listing_health_score >= 40
      ? "bg-yellow-400"
      : "bg-[#FF2D95]";

  const issueFlags = [
    {
      ok: item.item_specifics_complete,
      label: "Item specifics",
      okText: "Complete",
      badText: "Incomplete — invisible in filtered search",
    },
    {
      ok: item.image_count >= 4,
      label: "Photo count",
      okText: `${item.image_count} photos — good`,
      badText: `Only ${item.image_count} photo${item.image_count !== 1 ? "s" : ""} — low CTR`,
    },
    {
      ok: item.title_keyword_strength >= 70,
      label: "Title strength",
      okText: `${item.title_keyword_strength}/100 — strong`,
      badText: `${item.title_keyword_strength}/100 — weak keyword coverage`,
    },
    {
      ok: item.days_listed <= 60,
      label: "Listing age",
      okText: `${item.days_listed} days — fresh`,
      badText: `${item.days_listed} days — stale traffic`,
    },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/inventory"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Inventory
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Item info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-zinc-100 leading-snug">
                  {item.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-zinc-500">{item.platform}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-sm text-zinc-500">{item.category}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-sm font-semibold text-zinc-300">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
              <Badge
                variant={item.visibility_risk.toLowerCase() as "critical" | "high" | "medium" | "low"}
                className="shrink-0"
              >
                {item.visibility_risk}
              </Badge>
            </div>

            {/* Quick stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: Calendar,
                  label: "Listed",
                  value: `${item.days_listed}d ago`,
                },
                {
                  icon: BarChart2,
                  label: "Decay Score",
                  value: `${item.dead_inventory_score}/100`,
                },
                {
                  icon: Camera,
                  label: "Photos",
                  value: item.image_count.toString(),
                },
                {
                  icon: DollarSign,
                  label: "Est. Recovery",
                  value: formatCurrency(item.estimated_recovery),
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-md border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3 w-3 text-zinc-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                      {label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-zinc-200">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why this listing is struggling */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#E935C1]" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Why This Listing Is Struggling
              </h2>
            </div>

            <div className="space-y-3">
              {issueFlags.map(({ ok, label, okText, badText }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-md border border-zinc-800 bg-zinc-950 p-3"
                >
                  {ok ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF2D95]" />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                      {label}
                    </p>
                    <p className={`text-sm ${ok ? "text-zinc-400" : "text-zinc-300"}`}>
                      {ok ? okText : badText}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Days context */}
            <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-600 mb-2">
                Listing Age Context
              </p>
              <div className="flex items-center gap-3">
                <Progress
                  value={Math.min(100, (item.days_listed / 365) * 100)}
                  className="flex-1 h-2"
                  indicatorClassName={
                    item.days_listed > 180
                      ? "bg-[#FF2D95]"
                      : item.days_listed > 90
                      ? "bg-orange-400"
                      : item.days_listed > 60
                      ? "bg-yellow-400"
                      : "bg-emerald-400"
                  }
                />
                <span className="text-xs font-bold text-zinc-400">
                  {item.days_listed}d
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                {item.days_listed <= 30 &&
                  "Fresh listing — give it more time before making changes."}
                {item.days_listed > 30 &&
                  item.days_listed <= 60 &&
                  "Starting to age. Monitor closely and consider optimizations."}
                {item.days_listed > 60 &&
                  item.days_listed <= 90 &&
                  "Approaching the 90-day algorithm penalty window. Act soon."}
                {item.days_listed > 90 &&
                  item.days_listed <= 180 &&
                  "Over 90 days — eBay has likely deprioritized this listing. Relist."}
                {item.days_listed > 180 &&
                  "6+ months. This is textbook death pile. Recovery action required immediately."}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Scores + Action */}
        <div className="space-y-6">
          {/* Score cards */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
              Performance Scores
            </h2>

            <div className="space-y-5">
              {/* Dead score */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">
                    Dead Inventory Score
                  </span>
                  <span
                    className={`text-sm font-black ${
                      item.dead_inventory_score >= 75
                        ? "text-[#FF2D95]"
                        : item.dead_inventory_score >= 55
                        ? "text-orange-400"
                        : item.dead_inventory_score >= 30
                        ? "text-yellow-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {item.dead_inventory_score}/100
                  </span>
                </div>
                <Progress
                  value={item.dead_inventory_score}
                  className="h-2"
                  indicatorClassName={
                    item.dead_inventory_score >= 75
                      ? "bg-[#FF2D95]"
                      : item.dead_inventory_score >= 55
                      ? "bg-orange-400"
                      : item.dead_inventory_score >= 30
                      ? "bg-yellow-400"
                      : "bg-emerald-400"
                  }
                />
                <p className="mt-1 text-[11px] text-zinc-600">
                  Higher = more dead. Based on age + listing quality.
                </p>
              </div>

              {/* Health score */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">
                    Listing Health Score
                  </span>
                  <span className="text-sm font-black text-zinc-300">
                    {item.listing_health_score}/100
                  </span>
                </div>
                <Progress
                  value={item.listing_health_score}
                  className="h-2"
                  indicatorClassName={healthColor}
                />
                <p className="mt-1 text-[11px] text-zinc-600">
                  Photos, specifics, title, freshness.
                </p>
              </div>

              {/* Title keyword strength */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">
                    Title Keyword Strength
                  </span>
                  <span className="text-sm font-black text-zinc-300">
                    {item.title_keyword_strength}/100
                  </span>
                </div>
                <Progress
                  value={item.title_keyword_strength}
                  className="h-2"
                  indicatorClassName="bg-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Recovery action */}
          <div className="rounded-lg border border-[#E935C1]/30 bg-[#E935C1]/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-[#E935C1]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#E935C1]">
                Recommended Action
              </h2>
            </div>

            <p className="text-base font-black text-zinc-100">
              {actionDetail.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {actionDetail.description}
            </p>

            <div className="mt-4 rounded-md border border-zinc-700 bg-zinc-900 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                Steps
              </p>
              <ol className="space-y-1.5">
                {actionDetail.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-bold text-zinc-500">
                      {i + 1}
                    </span>
                    <span className="text-xs text-zinc-400">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3">
              <span className="text-xs text-zinc-500">Est. recovery</span>
              <span className="text-sm font-black text-emerald-400">
                {formatCurrencyDecimal(item.estimated_recovery)}
              </span>
            </div>
          </div>

          {/* Back to recovery center */}
          <Link
            href="/recovery"
            className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            View Full Recovery Plan →
          </Link>
        </div>
      </div>
    </div>
  );
}

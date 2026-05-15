import type {
  InventoryItem,
  ScoredItem,
  VisibilityRisk,
  RecoveryAction,
  RecoveryActionDetail,
  DashboardStats,
  AgingBucket,
} from "./types";

// Dead Inventory Score: 0–100 (higher = more dead/trapped)
// Weighted heuristic: days_listed is the primary signal
export function calcDeadScore(item: InventoryItem): number {
  let score = 0;

  // Days listed — heaviest weight (60 pts max)
  if (item.days_listed <= 30) score += 0;
  else if (item.days_listed <= 60) score += 20;
  else if (item.days_listed <= 90) score += 35;
  else if (item.days_listed <= 180) score += 50;
  else if (item.days_listed <= 365) score += 60;
  else score += 60; // 60 is max for days alone

  // Missing item specifics kills eBay visibility (15 pts)
  if (!item.item_specifics_complete) score += 15;

  // Weak photo count crushes click-through (12 pts)
  if (item.image_count === 1) score += 12;
  else if (item.image_count <= 3) score += 5;

  // Weak title keyword strength (13 pts)
  if (item.title_keyword_strength < 40) score += 13;
  else if (item.title_keyword_strength < 60) score += 7;
  else if (item.title_keyword_strength < 75) score += 3;

  return Math.min(100, Math.round(score));
}

// Listing Health Score: 0–100 (higher = healthier)
export function calcHealthScore(item: InventoryItem): number {
  let score = 0;

  // Item specifics (20 pts)
  if (item.item_specifics_complete) score += 20;

  // Image count (20 pts)
  if (item.image_count >= 8) score += 20;
  else if (item.image_count >= 4) score += 15;
  else if (item.image_count >= 2) score += 8;

  // Title keyword strength (30 pts)
  score += Math.round((item.title_keyword_strength / 100) * 30);

  // Freshness (30 pts) — inverse of age decay
  if (item.days_listed <= 14) score += 30;
  else if (item.days_listed <= 30) score += 25;
  else if (item.days_listed <= 60) score += 18;
  else if (item.days_listed <= 90) score += 10;
  else if (item.days_listed <= 180) score += 4;
  else score += 0;

  return Math.min(100, Math.round(score));
}

// Visibility Risk: driven by days + listing quality
export function calcVisibilityRisk(item: InventoryItem): VisibilityRisk {
  const dead = calcDeadScore(item);
  if (dead >= 75) return "Critical";
  if (dead >= 55) return "High";
  if (dead >= 30) return "Medium";
  return "Low";
}

// Primary Recovery Action — single most impactful move
export function calcPrimaryAction(item: InventoryItem): RecoveryAction {
  const risk = calcVisibilityRisk(item);

  if (risk === "Critical") {
    if (item.price < 15) return "bundle";
    return "liquidate";
  }

  if (risk === "High") {
    if (item.days_listed >= 180) return "relist_now";
    if (!item.item_specifics_complete) return "optimize_specifics";
    return "strategic_markdown";
  }

  if (risk === "Medium") {
    if (!item.item_specifics_complete) return "optimize_specifics";
    if (item.image_count <= 2) return "add_photos";
    if (item.days_listed >= 60) return "strategic_markdown";
    return "add_photos";
  }

  // Low risk — small nudges
  if (item.title_keyword_strength < 60) return "optimize_specifics";
  return "hold";
}

// Estimated cash recovery — how much of the listed price is realistically recoverable
export function calcEstimatedRecovery(item: InventoryItem): number {
  const action = calcPrimaryAction(item);
  const price = item.price;

  const recoveryRates: Record<RecoveryAction, number> = {
    hold: 1.0,
    add_photos: 0.9,
    optimize_specifics: 0.85,
    relist_now: 0.8,
    strategic_markdown: 0.65,
    move_platform: 0.7,
    bundle: 0.5,
    liquidate: 0.25,
  };

  return Math.round(price * (recoveryRates[action] ?? 0.6) * 100) / 100;
}

export function scoreItem(item: InventoryItem): ScoredItem {
  return {
    ...item,
    dead_inventory_score: calcDeadScore(item),
    listing_health_score: calcHealthScore(item),
    visibility_risk: calcVisibilityRisk(item),
    primary_recovery_action: calcPrimaryAction(item),
    estimated_recovery: calcEstimatedRecovery(item),
  };
}

export function scoreAll(items: InventoryItem[]): ScoredItem[] {
  return items.map(scoreItem);
}

export function calcDashboardStats(items: InventoryItem[]): DashboardStats {
  const scored = scoreAll(items);
  const active = scored.filter((i) => i.status === "active");

  const trapped_cash = active.reduce((sum, i) => sum + i.price, 0);
  const dead_count = active.filter((i) => i.dead_inventory_score >= 55).length;
  const dead_inventory_pct =
    active.length > 0 ? Math.round((dead_count / active.length) * 100) : 0;
  const critical_count = active.filter(
    (i) => i.visibility_risk === "Critical"
  ).length;
  const high_risk_count = active.filter(
    (i) => i.visibility_risk === "High"
  ).length;
  const avg_days_listed =
    active.length > 0
      ? Math.round(active.reduce((s, i) => s + i.days_listed, 0) / active.length)
      : 0;

  const buckets: AgingBucket[] = [
    { label: "0–30d", days_min: 0, days_max: 30, count: 0, value: 0 },
    { label: "31–60d", days_min: 31, days_max: 60, count: 0, value: 0 },
    { label: "61–90d", days_min: 61, days_max: 90, count: 0, value: 0 },
    { label: "91–180d", days_min: 91, days_max: 180, count: 0, value: 0 },
    { label: "180d+", days_min: 181, days_max: Infinity, count: 0, value: 0 },
  ];

  for (const item of active) {
    const bucket = buckets.find(
      (b) => item.days_listed >= b.days_min && item.days_listed <= b.days_max
    );
    if (bucket) {
      bucket.count++;
      bucket.value += item.price;
    }
  }

  return {
    total_items: active.length,
    trapped_cash,
    dead_inventory_pct,
    critical_count,
    high_risk_count,
    avg_days_listed,
    aging_breakdown: buckets,
  };
}

export function buildRecoveryPlan(items: ScoredItem[]): RecoveryActionDetail[] {
  const active = items.filter((i) => i.status === "active");

  const actionMeta: Record<
    RecoveryAction,
    { label: string; urgency: RecoveryActionDetail["urgency"]; reasoning: string }
  > = {
    relist_now: {
      label: "Relist Now",
      urgency: "immediate",
      reasoning:
        "eBay's algorithm buries listings after 90 days. End the listing and create a fresh one — same item, new impressions clock. This is the fastest visibility reset available.",
    },
    strategic_markdown: {
      label: "Strategic Markdown",
      urgency: "this_week",
      reasoning:
        "Price drops trigger eBay's 'Recently Lowered' filter and send watchers a notification. A 15–25% cut moves the needle without destroying margin. Do it now, not next month.",
    },
    bundle: {
      label: "Bundle It",
      urgency: "this_week",
      reasoning:
        "Low-priced stale items are drag. Bundle 2–4 related pieces, raise the combined price, and create a listing that justifies shipping cost. Moves cash, clears space.",
    },
    move_platform: {
      label: "Move Platform",
      urgency: "this_month",
      reasoning:
        "This item's audience isn't on your current platform. Cross-list or migrate to where your buyers actually shop. Different eyeballs, different sell-through.",
    },
    optimize_specifics: {
      label: "Fix Item Specifics",
      urgency: "immediate",
      reasoning:
        "Missing item specifics = invisible in filtered searches. eBay's Cassini algorithm penalizes incomplete listings. Fill every field — it costs you nothing and immediately improves indexing.",
    },
    add_photos: {
      label: "Add More Photos",
      urgency: "this_week",
      reasoning:
        "Single-photo listings have 40% lower conversion than multi-photo. Shoot the item from 6+ angles including tags, flaws, and measurements. Buyers need to see it to buy it.",
    },
    liquidate: {
      label: "Liquidate",
      urgency: "immediate",
      reasoning:
        "This inventory has been dead too long. The carrying cost (space, mental overhead, capital lock-up) now outweighs the margin. Price to move: 20–30 cents on the dollar, sell in lots, or donate for the tax write-off.",
    },
    hold: {
      label: "Hold — Monitor",
      urgency: "this_month",
      reasoning:
        "This listing is performing within normal range. Watch for 30-day sell-through before making changes. Don't fix what isn't broken.",
    },
  };

  const grouped = new Map<RecoveryAction, ScoredItem[]>();
  for (const item of active) {
    const action = item.primary_recovery_action;
    if (!grouped.has(action)) grouped.set(action, []);
    grouped.get(action)!.push(item);
  }

  const urgencyOrder: Record<RecoveryActionDetail["urgency"], number> = {
    immediate: 0,
    this_week: 1,
    this_month: 2,
  };

  return Array.from(grouped.entries())
    .map(([action, actionItems]) => ({
      action,
      ...actionMeta[action],
      estimated_cash_recovery: actionItems.reduce(
        (sum, i) => sum + i.estimated_recovery,
        0
      ),
      items: actionItems.sort((a, b) => b.dead_inventory_score - a.dead_inventory_score),
    }))
    .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

export const RISK_COLORS: Record<VisibilityRisk, string> = {
  Low: "text-emerald-400",
  Medium: "text-yellow-400",
  High: "text-orange-400",
  Critical: "text-[#FF2D95]",
};

export const RISK_BG: Record<VisibilityRisk, string> = {
  Low: "bg-emerald-400/10 border-emerald-400/30",
  Medium: "bg-yellow-400/10 border-yellow-400/30",
  High: "bg-orange-400/10 border-orange-400/30",
  Critical: "bg-[#FF2D95]/10 border-[#FF2D95]/30",
};

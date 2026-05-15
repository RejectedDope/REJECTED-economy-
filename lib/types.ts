export type Platform = "eBay" | "Poshmark" | "Mercari" | "Depop" | "Facebook Marketplace" | "StockX" | "GOAT" | "Whatnot" | "Other";

export type VisibilityRisk = "Low" | "Medium" | "High" | "Critical";

export type ItemStatus = "active" | "sold" | "ended" | "draft";

export type RecoveryAction =
  | "relist_now"
  | "strategic_markdown"
  | "bundle"
  | "move_platform"
  | "optimize_specifics"
  | "add_photos"
  | "liquidate"
  | "hold";

export interface InventoryItem {
  id: string;
  user_id: string;
  title: string;
  platform: Platform;
  price: number;
  days_listed: number;
  category: string;
  image_url?: string;
  item_specifics_complete: boolean;
  image_count: number;
  title_keyword_strength: number;
  status: ItemStatus;
  created_at: string;
}

export interface ScoredItem extends InventoryItem {
  dead_inventory_score: number;
  listing_health_score: number;
  visibility_risk: VisibilityRisk;
  primary_recovery_action: RecoveryAction;
  estimated_recovery: number;
}

export interface RecoveryActionDetail {
  action: RecoveryAction;
  label: string;
  urgency: "immediate" | "this_week" | "this_month";
  reasoning: string;
  estimated_cash_recovery: number;
  items: ScoredItem[];
}

export interface DashboardStats {
  total_items: number;
  trapped_cash: number;
  dead_inventory_pct: number;
  critical_count: number;
  high_risk_count: number;
  avg_days_listed: number;
  aging_breakdown: AgingBucket[];
}

export interface AgingBucket {
  label: string;
  count: number;
  value: number;
  days_min: number;
  days_max: number;
}

export interface CSVRow {
  [key: string]: string;
}

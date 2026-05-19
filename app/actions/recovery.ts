"use server";

import { createClient } from "@/lib/supabase/server";
import type { RecoveryActionLog } from "@/lib/types";

export type FetchRecoveryLogsResult = {
  logs: RecoveryActionLog[];
  error?: string;
};

export async function fetchRecoveryLogs(
  itemId?: string,
  limit = 50
): Promise<FetchRecoveryLogsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { logs: [], error: "Not authenticated" };

  let query = supabase
    .from("recovery_actions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (itemId) query = query.eq("item_id", itemId);

  const { data, error } = await query;
  if (error) return { logs: [], error: error.message };

  return { logs: (data ?? []) as unknown as RecoveryActionLog[] };
}

export async function fetchRecoverySummary(): Promise<{
  total: number;
  sold: number;
  total_recovered: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, sold: 0, total_recovered: 0, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("recovery_actions")
    .select("action_status, outcome, recovery_amount")
    .eq("user_id", user.id)
    .eq("action_status", "completed");

  if (error) return { total: 0, sold: 0, total_recovered: 0, error: error.message };

  const rows = data ?? [];
  const sold = rows.filter((r) => r.outcome === "sold").length;
  const total_recovered = rows
    .filter((r) => r.outcome === "sold" && r.recovery_amount)
    .reduce((sum, r) => sum + (r.recovery_amount as number), 0);

  return { total: rows.length, sold, total_recovered };
}

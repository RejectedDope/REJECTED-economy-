"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";
import { MOCK_ITEMS } from "@/lib/mock-data";
import { scoreAll } from "@/lib/scoring";
import { InventoryTable } from "@/components/analyzer/InventoryTable";

export default function InventoryPage() {
  const items = useMemo(() => scoreAll(MOCK_ITEMS), []);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-3.5 w-3.5 text-[#E935C1]" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
            All Inventory
          </span>
        </div>
        <h1 className="text-2xl font-black text-zinc-100">Inventory</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Full view of every item — scored, sorted, ready to work.
        </p>
      </div>

      <InventoryTable items={items} />
    </div>
  );
}

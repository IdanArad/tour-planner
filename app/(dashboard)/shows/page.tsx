"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShowsTable } from "@/components/shows/shows-table";
import { useStore } from "@/lib/store";
import type { ShowStatus } from "@/types";

const statusFilters: { value: "all" | ShowStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "hold", label: "Hold" },
  { value: "pitched", label: "Pitched" },
  { value: "idea", label: "Ideas" },
  { value: "played", label: "Played" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ShowsPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<"all" | ShowStatus>("all");

  const filtered =
    filter === "all"
      ? [...state.shows].sort((a, b) => a.date.localeCompare(b.date))
      : state.shows.filter((s) => s.status === filter).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shows</h1>
        <p className="mt-1 text-sm text-muted-foreground">All shows across tours</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | ShowStatus)}>
        <TabsList>
          {statusFilters.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ShowsTable shows={filtered} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReachoutsTable } from "@/components/reachouts/reachouts-table";
import { ReachoutForm } from "@/components/reachouts/reachout-form";
import { useStore } from "@/lib/store";

type FilterKey = "all" | "awaiting" | "follow_up" | "replied" | "declined";

const filters: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Awaiting" },
  { value: "follow_up", label: "Needs Follow-Up" },
  { value: "replied", label: "Replied" },
  { value: "declined", label: "Declined" },
];

export default function ReachoutsPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = (() => {
    switch (filter) {
      case "awaiting":
        return state.reachouts.filter((r) => r.status === "sent");
      case "follow_up":
        return state.reachouts.filter((r) => r.status === "follow_up");
      case "replied":
        return state.reachouts.filter((r) => r.status === "replied" || r.status === "booked");
      case "declined":
        return state.reachouts.filter((r) => r.status === "declined" || r.status === "no_response");
      default:
        return state.reachouts;
    }
  })();

  const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reachouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track venue outreach and responses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Reachout
        </button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
        <TabsList>
          {filters.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ReachoutsTable reachouts={sorted} onAdd={() => setShowForm(true)} />

      <ReachoutForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

"use client";

import { VenuesTable } from "@/components/venues/venues-table";

export default function VenuesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your venue database</p>
      </div>
      <VenuesTable />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { VenuesTable } from "@/components/venues/venues-table";
import { VenueForm } from "@/components/venues/venue-form";

export default function VenuesPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your venue database</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Venue
        </button>
      </div>
      <VenuesTable />
      <VenueForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

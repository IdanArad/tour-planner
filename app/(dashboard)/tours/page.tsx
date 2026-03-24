"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ToursTable } from "@/components/tours/tours-table";
import { TourForm } from "@/components/tours/tour-form";

export default function ToursPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tours</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your tours</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Tour
        </button>
      </div>

      <ToursTable onAdd={() => setShowForm(true)} />

      <TourForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

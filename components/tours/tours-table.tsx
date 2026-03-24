"use client";

import { useState } from "react";
import { Pencil, Route } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TourForm } from "@/components/tours/tour-form";
import { useStore } from "@/lib/store";
import type { Tour, TourStatus } from "@/types";

const statusColors: Record<TourStatus, string> = {
  planning: "bg-blue-500/15 text-blue-400",
  active: "bg-green-500/15 text-green-400",
  completed: "bg-gray-500/15 text-gray-400",
  cancelled: "bg-red-500/15 text-red-400",
};

function formatDate(iso?: string) {
  if (!iso) return "\u2014";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ToursTable({ onAdd }: { onAdd?: () => void }) {
  const { state } = useStore();
  const [editTour, setEditTour] = useState<Tour | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tour</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Shows</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.tours.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Route className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No tours found</p>
                    {onAdd && (
                      <button
                        onClick={onAdd}
                        className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        New Tour
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              state.tours.map((tour) => {
                const showCount = state.shows.filter((s) => s.tourId === tour.id).length;
                return (
                  <TableRow key={tour.id} className="border-border/50 transition-colors hover:bg-accent/30">
                    <TableCell className="font-medium">{tour.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(tour.startDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(tour.endDate)}</TableCell>
                    <TableCell>{showCount}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[tour.status]}`}>
                        {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setEditTour(tour)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        title="Edit tour"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editTour && (
        <TourForm open={true} onClose={() => setEditTour(null)} tour={editTour} />
      )}
    </>
  );
}

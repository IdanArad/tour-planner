"use client";

import { useState } from "react";
import { CalendarPlus, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShowStatusBadge } from "@/components/shows/show-status-badge";
import { ShowForm } from "@/components/shows/show-form";
import { useStore, getVenueById } from "@/lib/store";
import type { Show, ShowStatus } from "@/types";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatType(type: string) {
  return type.replace("_", "-").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ShowsTable({ shows, onAdd }: { shows: Show[]; onAdd?: () => void }) {
  const { state, dispatch } = useStore();
  const [editShow, setEditShow] = useState<Show | null>(null);

  function handleStatusChange(showId: string, status: ShowStatus) {
    dispatch({ type: "UPDATE_SHOW_STATUS", payload: { id: showId, status } });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Guarantee</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarPlus className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No shows found</p>
                    {onAdd && (
                      <button
                        onClick={onAdd}
                        className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        New Show
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              shows.map((show) => {
                const venue = getVenueById(state, show.venueId);
                return (
                  <TableRow key={show.id} className="border-border/50 transition-colors hover:bg-accent/30">
                    <TableCell className="whitespace-nowrap">{formatDate(show.date)}</TableCell>
                    <TableCell className="font-medium">{venue?.name ?? "—"}</TableCell>
                    <TableCell>
                      {venue?.city}
                      {venue?.state ? `, ${venue.state}` : ""}
                    </TableCell>
                    <TableCell>{formatType(show.type)}</TableCell>
                    <TableCell>
                      <ShowStatusBadge status={show.status} onStatusChange={(s) => handleStatusChange(show.id, s)} />
                    </TableCell>
                    <TableCell className="text-right">
                      {show.guarantee ? `$${show.guarantee.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setEditShow(show)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        title="Edit show"
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

      {editShow && (
        <ShowForm open={true} onClose={() => setEditShow(null)} show={editShow} />
      )}
    </>
  );
}

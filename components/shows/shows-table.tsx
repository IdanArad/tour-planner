"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShowStatusBadge } from "@/components/shows/show-status-badge";
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

export function ShowsTable({ shows }: { shows: Show[] }) {
  const { state, dispatch } = useStore();

  function handleStatusChange(showId: string, status: ShowStatus) {
    dispatch({ type: "UPDATE_SHOW_STATUS", payload: { id: showId, status } });
  }

  return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {shows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No shows found
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
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

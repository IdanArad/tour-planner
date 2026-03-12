"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";

export function VenuesTable() {
  const { state } = useStore();

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venue</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Contacts</TableHead>
            <TableHead>Shows</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.venues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No venues found
              </TableCell>
            </TableRow>
          ) : (
            state.venues.map((venue) => {
              const showCount = state.shows.filter((s) => s.venueId === venue.id).length;
              return (
                <TableRow key={venue.id} className="border-border/50 transition-colors hover:bg-accent/30">
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>
                    {venue.city}
                    {venue.state ? `, ${venue.state}` : ""}
                  </TableCell>
                  <TableCell>{venue.capacity?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell>{venue.contacts.length}</TableCell>
                  <TableCell>{showCount}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
